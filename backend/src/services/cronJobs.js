import cron from 'node-cron';
import { fetchLatestTransactions, ensureCacheLoaded } from './hdbDataService.js';

/**
 * Start all scheduled background jobs.
 *
 * - On startup: ensure the in-memory cache is populated (from Supabase or
 *   a fresh fetch from data.gov.sg).
 * - Daily at 02:00 SGT: re-fetch and refresh the HDB transaction data.
 */
export function startCronJobs() {
  // Warm up the cache on startup (non-blocking)
  warmUpCache();

  // Schedule daily refresh at 2:00 AM Singapore time
  cron.schedule(
    '0 2 * * *',
    async () => {
      console.log('[CRON] Starting daily HDB data refresh ...');
      try {
        const result = await fetchLatestTransactions();
        console.log(`[CRON] Daily refresh complete – ${result.count} records`);
      } catch (err) {
        console.error('[CRON] Daily refresh failed:', err.message);
      }
    },
    {
      timezone: 'Asia/Singapore',
    },
  );

  console.log('Cron jobs scheduled: HDB data refresh at 02:00 SGT daily');
}

async function warmUpCache() {
  try {
    await ensureCacheLoaded();
    console.log('Cache warm-up complete');
  } catch (err) {
    console.error('Cache warm-up failed:', err.message);
    console.log('The cache will be populated on the next scheduled refresh or manual trigger.');
  }
}
