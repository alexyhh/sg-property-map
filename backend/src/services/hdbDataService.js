import { query, getClient } from './db.js';
import { PLANNING_AREAS } from '../data/planningAreas.js';
import { POSTAL_DISTRICTS, townToDistrict } from '../data/districts.js';

const DATA_GOV_API =
  'https://data.gov.sg/api/action/datastore_search?resource_id=d_8b84c4ee58e3cfc0ece0d773c8ca6abc';
const PAGE_SIZE = 10000;
const SQM_TO_SQFT = 10.764;

let metricsCache = { planning_area: {}, district: {} };
let transactionsCache = [];
let lastRefresh = null;

export async function fetchLatestTransactions() {
  console.log('Starting HDB data fetch from data.gov.sg ...');
  const startTime = Date.now();

  try {
    const allRecords = await fetchAllPages();
    console.log(`Fetched ${allRecords.length} records from data.gov.sg`);

    const processed = allRecords.map(processRecord).filter(Boolean);
    console.log(`Processed ${processed.length} valid transactions`);

    await storeInPostgres(processed);

    transactionsCache = processed;
    metricsCache = buildMetricsCache(processed);
    lastRefresh = new Date().toISOString();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`HDB data refresh completed in ${elapsed}s`);

    return { count: processed.length, refreshedAt: lastRefresh };
  } catch (err) {
    console.error('Error fetching HDB data:', err);
    throw err;
  }
}

export function getAllAreaMetrics(level = 'planning_area', period = '12m', flatType = 'all') {
  const cache = level === 'district' ? metricsCache.district : metricsCache.planning_area;
  const summary = [];

  for (const [areaName, transactions] of Object.entries(cache)) {
    let pool = [...transactions];
    const cutoff = periodCutoff(period);
    if (cutoff) pool = pool.filter((t) => t.month >= cutoff);
    if (flatType && flatType !== 'all') {
      const ft = flatType.toUpperCase();
      pool = pool.filter((t) => t.flat_type?.toUpperCase() === ft);
    }
    if (pool.length === 0) continue;

    const prices = pool.map((t) => t.resale_price);
    const psfs = pool.map((t) => t.psf);
    const avg_psf = Math.round((psfs.reduce((a, b) => a + b, 0) / psfs.length) * 100) / 100;
    const median_price = median(prices);
    const volume = pool.length;

    summary.push({ planning_area: areaName, avg_psf, median_price, volume });
  }

  return summary;
}

export function getMetrics(level, area, period, flatType) {
  const transactions = filterTransactions(level, area, period, flatType);

  if (transactions.length === 0) {
    return {
      metrics: { avg_psf: 0, median_price: 0, volume: 0, yoy_change: null, vs_5yr_avg: null },
      transactions: [],
    };
  }

  const prices = transactions.map((t) => t.resale_price);
  const psfs = transactions.map((t) => t.psf);

  const avg_psf = Math.round((psfs.reduce((a, b) => a + b, 0) / psfs.length) * 100) / 100;
  const median_price = median(prices);
  const volume = transactions.length;
  const yoy_change = calculateYoyChange(level, area, flatType, avg_psf);
  const vs_5yr_avg = calculateVs5YrAvg(level, area, flatType, avg_psf);

  return {
    metrics: { avg_psf, median_price, volume, yoy_change, vs_5yr_avg },
    transactions: transactions
      .sort((a, b) => b.month.localeCompare(a.month))
      .map(formatTransaction),
  };
}

export function getTransactions(filters) {
  const { level, area, period, flatType, page = 1, limit = 50 } = filters;
  const all = filterTransactions(level, area, period, flatType).sort((a, b) =>
    b.month.localeCompare(a.month),
  );

  const start = (page - 1) * limit;
  const paged = all.slice(start, start + limit);

  return {
    transactions: paged.map(formatTransaction),
    pagination: { page, limit, total: all.length, totalPages: Math.ceil(all.length / limit) },
  };
}

export function getTransactionsCsv(level, area, period, flatType) {
  const all = filterTransactions(level, area, period, flatType).sort((a, b) =>
    b.month.localeCompare(a.month),
  );

  const header = 'Month,Town,Flat Type,Block,Street,Storey Range,Floor Area (sqm),PSF (SGD),Resale Price (SGD),Flat Model,Lease Commence,Remaining Lease';
  const rows = all.map((t) =>
    [t.month, t.town, t.flat_type, t.block, t.street_name, t.storey_range,
     t.floor_area_sqm, t.psf.toFixed(2), t.resale_price, t.flat_model,
     t.lease_commence_date, t.remaining_lease].join(','),
  );

  return [header, ...rows].join('\n');
}

export async function ensureCacheLoaded() {
  if (transactionsCache.length > 0) return;

  console.log('In-memory cache empty – loading from Postgres ...');
  try {
    const result = await query(
      'SELECT * FROM hdb_transactions ORDER BY month DESC LIMIT 100000'
    );

    if (result.rows.length > 0) {
      transactionsCache = result.rows.map((row) => ({
        ...row,
        psf: row.psf ?? (row.resale_price / row.floor_area_sqm) * SQM_TO_SQFT,
        planning_area: row.planning_area ?? row.town?.toUpperCase(),
        district: row.district ?? townToDistrict(row.town),
      }));
      metricsCache = buildMetricsCache(transactionsCache);
      lastRefresh = new Date().toISOString();
      console.log(`Loaded ${transactionsCache.length} transactions from Postgres into cache`);
    } else {
      console.log('No transactions found in Postgres – will fetch from data.gov.sg');
      await fetchLatestTransactions();
    }
  } catch (err) {
    console.error('Failed to load cache from Postgres:', err.message);
    console.log('Attempting direct fetch from data.gov.sg...');
    try {
      await fetchLatestTransactions();
    } catch (fetchErr) {
      console.error('Direct fetch also failed:', fetchErr.message);
    }
  }
}

export function getCacheStatus() {
  return {
    transactionCount: transactionsCache.length,
    lastRefresh,
    metricsAreas: {
      planning_area: Object.keys(metricsCache.planning_area).length,
      district: Object.keys(metricsCache.district).length,
    },
  };
}

// Internal helpers

async function fetchAllPages() {
  let allRecords = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const url = `${DATA_GOV_API}&limit=${PAGE_SIZE}&offset=${offset}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`data.gov.sg API returned ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    const records = json?.result?.records || [];
    allRecords = allRecords.concat(records);
    offset += PAGE_SIZE;

    if (records.length < PAGE_SIZE) hasMore = false;
    if (allRecords.length >= 500000) {
      console.warn('Reached 500k record safety cap');
      hasMore = false;
    }
  }

  return allRecords;
}

function processRecord(raw) {
  try {
    const resalePrice = parseFloat(raw.resale_price);
    const floorArea = parseFloat(raw.floor_area_sqm);
    if (!resalePrice || !floorArea || floorArea === 0) return null;

    const psf = (resalePrice / floorArea) * SQM_TO_SQFT;
    const town = (raw.town || '').toUpperCase().trim();
    const district = townToDistrict(town);

    return {
      month: raw.month, town, flat_type: raw.flat_type, block: raw.block,
      street_name: raw.street_name, storey_range: raw.storey_range,
      floor_area_sqm: floorArea, flat_model: raw.flat_model,
      lease_commence_date: raw.lease_commence_date,
      remaining_lease: raw.remaining_lease || null,
      resale_price: resalePrice, psf: Math.round(psf * 100) / 100,
      planning_area: town, district,
    };
  } catch {
    return null;
  }
}

async function storeInPostgres(records) {
  const client = await getClient();
  let inserted = 0;

  try {
    await client.query('BEGIN');

    const BATCH = 500;
    for (let i = 0; i < records.length; i += BATCH) {
      const batch = records.slice(i, i + BATCH);
      const values = [];
      const placeholders = [];

      batch.forEach((r, idx) => {
        const offset = idx * 14;
        placeholders.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14})`
        );
        values.push(
          r.month, r.town, r.flat_type, r.block, r.street_name, r.storey_range,
          r.floor_area_sqm, r.flat_model, r.lease_commence_date, r.remaining_lease,
          r.resale_price, r.psf, r.planning_area, r.district
        );
      });

      await client.query(
        `INSERT INTO hdb_transactions (month, town, flat_type, block, street_name, storey_range, floor_area_sqm, flat_model, lease_commence_date, remaining_lease, resale_price, psf, planning_area, district)
         VALUES ${placeholders.join(', ')}
         ON CONFLICT (month, town, block, street_name, flat_type, storey_range, floor_area_sqm, resale_price) DO NOTHING`,
        values
      );

      inserted += batch.length;
    }

    await client.query('COMMIT');
    console.log(`Inserted ${inserted} records to Postgres`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Postgres insert error:', err.message);
  } finally {
    client.release();
  }
}

function buildMetricsCache(transactions) {
  const cache = { planning_area: {}, district: {} };
  for (const t of transactions) {
    if (t.planning_area) {
      if (!cache.planning_area[t.planning_area]) cache.planning_area[t.planning_area] = [];
      cache.planning_area[t.planning_area].push(t);
    }
    if (t.district) {
      if (!cache.district[t.district]) cache.district[t.district] = [];
      cache.district[t.district].push(t);
    }
  }
  return cache;
}

function filterTransactions(level, area, period, flatType) {
  let pool;
  if (level === 'district') {
    pool = metricsCache.district[area?.toUpperCase()] || [];
  } else {
    pool = metricsCache.planning_area[area?.toUpperCase()] || [];
  }

  const cutoff = periodCutoff(period);
  if (cutoff) pool = pool.filter((t) => t.month >= cutoff);
  if (flatType && flatType !== 'all') {
    const ft = flatType.toUpperCase();
    pool = pool.filter((t) => t.flat_type?.toUpperCase() === ft);
  }
  return pool;
}

function periodCutoff(period) {
  const now = new Date();
  switch (period) {
    case '3m': { const d = new Date(now); d.setMonth(d.getMonth() - 3); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
    case '6m': { const d = new Date(now); d.setMonth(d.getMonth() - 6); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
    case '12m': case undefined: case null: { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
    case '3y': { const d = new Date(now); d.setFullYear(d.getFullYear() - 3); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
    case '5y': { const d = new Date(now); d.setFullYear(d.getFullYear() - 5); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
    case 'all': return null;
    default: return null;
  }
}

function calculateYoyChange(level, area, flatType, currentAvgPsf) {
  try {
    const now = new Date();
    const oneYearAgo = new Date(now); oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const twoYearsAgo = new Date(now); twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const cutoffStart = `${twoYearsAgo.getFullYear()}-${String(twoYearsAgo.getMonth() + 1).padStart(2, '0')}`;
    const cutoffEnd = `${oneYearAgo.getFullYear()}-${String(oneYearAgo.getMonth() + 1).padStart(2, '0')}`;

    let pool = level === 'district' ? metricsCache.district[area?.toUpperCase()] || [] : metricsCache.planning_area[area?.toUpperCase()] || [];
    pool = pool.filter((t) => t.month >= cutoffStart && t.month < cutoffEnd);
    if (flatType && flatType !== 'all') pool = pool.filter((t) => t.flat_type?.toUpperCase() === flatType.toUpperCase());
    if (pool.length === 0) return null;

    const prevAvgPsf = pool.reduce((s, t) => s + t.psf, 0) / pool.length;
    if (prevAvgPsf === 0) return null;
    return Math.round(((currentAvgPsf - prevAvgPsf) / prevAvgPsf) * 10000) / 100;
  } catch { return null; }
}

function calculateVs5YrAvg(level, area, flatType, currentAvgPsf) {
  try {
    const now = new Date();
    const fiveYearsAgo = new Date(now); fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const cutoff = `${fiveYearsAgo.getFullYear()}-${String(fiveYearsAgo.getMonth() + 1).padStart(2, '0')}`;

    let pool = level === 'district' ? metricsCache.district[area?.toUpperCase()] || [] : metricsCache.planning_area[area?.toUpperCase()] || [];
    pool = pool.filter((t) => t.month >= cutoff);
    if (flatType && flatType !== 'all') pool = pool.filter((t) => t.flat_type?.toUpperCase() === flatType.toUpperCase());
    if (pool.length === 0) return null;

    const fiveYrAvgPsf = pool.reduce((s, t) => s + t.psf, 0) / pool.length;
    if (fiveYrAvgPsf === 0) return null;
    return Math.round(((currentAvgPsf - fiveYrAvgPsf) / fiveYrAvgPsf) * 10000) / 100;
  } catch { return null; }
}

function median(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function formatTransaction(t) {
  return {
    month: t.month, town: t.town, flat_type: t.flat_type, block: t.block,
    street_name: t.street_name, storey_range: t.storey_range,
    floor_area_sqm: t.floor_area_sqm, psf: t.psf, resale_price: t.resale_price,
    flat_model: t.flat_model, lease_commence_date: t.lease_commence_date,
    remaining_lease: t.remaining_lease, planning_area: t.planning_area, district: t.district,
  };
}
