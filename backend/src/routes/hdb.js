import { Router } from 'express';
import { authenticate, requireTier } from '../middleware/auth.js';
import {
  getMetrics,
  getAllAreaMetrics,
  getTransactions,
  getTransactionsCsv,
  ensureCacheLoaded,
  fetchLatestTransactions,
  getCacheStatus,
} from '../services/hdbDataService.js';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/hdb/metrics/summary  — bulk summary for heatmap (no auth required)
// ---------------------------------------------------------------------------
router.get('/metrics/summary', async (req, res) => {
  try {
    await ensureCacheLoaded();
    const { metric = 'avg_psf', period = '12m', level = 'planning_area' } = req.query;
    const summary = getAllAreaMetrics(level, period, 'all');
    res.json(summary);
  } catch (err) {
    console.error('Error in GET /api/hdb/metrics/summary:', err);
    res.status(500).json({ error: 'Failed to retrieve summary metrics' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/hdb/metrics
// ---------------------------------------------------------------------------
router.get('/metrics', authenticate, async (req, res) => {
  try {
    await ensureCacheLoaded();

    let { level, area, period, flat_type: flatType } = req.query;
    const tier = req.user.tier;

    // Free tier enforcement: lock to planning_area, 12m, all flat types
    if (tier === 'free') {
      level = 'planning_area';
      period = '12m';
      flatType = 'all';
    }

    // Validate level
    if (!['planning_area', 'district'].includes(level)) {
      level = 'planning_area';
    }

    // District level requires at least pro
    if (level === 'district' && tier === 'free') {
      return res.status(403).json({
        error: 'District-level data requires a Pro plan or above.',
        currentTier: tier,
      });
    }

    if (!area) {
      return res.status(400).json({ error: 'Missing required query parameter: area' });
    }

    const result = getMetrics(level, area, period, flatType);

    // Free tier: strip pro-only metrics and limit transactions
    if (tier === 'free') {
      result.metrics.yoy_change = null;
      result.metrics.vs_5yr_avg = null;
      result.transactions = result.transactions.slice(0, 3);
    }

    res.json(result);
  } catch (err) {
    console.error('Error in GET /api/hdb/metrics:', err);
    res.status(500).json({ error: 'Failed to retrieve metrics' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/hdb/transactions
// ---------------------------------------------------------------------------
router.get('/transactions', authenticate, requireTier('pro'), async (req, res) => {
  try {
    await ensureCacheLoaded();

    const {
      area,
      level = 'planning_area',
      period = '12m',
      flat_type: flatType = 'all',
      page = '1',
      limit = '50',
    } = req.query;

    if (!area) {
      return res.status(400).json({ error: 'Missing required query parameter: area' });
    }

    const result = getTransactions({
      level,
      area,
      period,
      flatType,
      page: parseInt(page, 10) || 1,
      limit: Math.min(parseInt(limit, 10) || 50, 200), // cap at 200 per page
    });

    res.json(result);
  } catch (err) {
    console.error('Error in GET /api/hdb/transactions:', err);
    res.status(500).json({ error: 'Failed to retrieve transactions' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/hdb/export
// ---------------------------------------------------------------------------
router.get('/export', authenticate, requireTier('pro'), async (req, res) => {
  try {
    await ensureCacheLoaded();

    const {
      area,
      level = 'planning_area',
      period = '12m',
      flat_type: flatType = 'all',
    } = req.query;

    if (!area) {
      return res.status(400).json({ error: 'Missing required query parameter: area' });
    }

    const csv = getTransactionsCsv(level, area, period, flatType);

    const filename = `hdb_transactions_${area.replace(/\s+/g, '_')}_${level}_${period}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    console.error('Error in GET /api/hdb/export:', err);
    res.status(500).json({ error: 'Failed to export transactions' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/hdb/status  (debug / admin)
// ---------------------------------------------------------------------------
router.get('/status', authenticate, (_req, res) => {
  res.json(getCacheStatus());
});

// POST /api/hdb/refresh - manual data refresh (protected by service role key)
router.post('/refresh', async (req, res) => {
  const authHeader = req.headers.authorization;
  const expectedKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!authHeader || !expectedKey || authHeader !== `Bearer ${expectedKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    res.json({ message: 'Data refresh started', status: 'in_progress' });
    // Run in background after sending response
    fetchLatestTransactions().then(result => {
      console.log('Manual data refresh completed:', result);
    }).catch(err => {
      console.error('Manual data refresh failed:', err.message);
    });
  } catch (err) {
    console.error('Error triggering refresh:', err);
    res.status(500).json({ error: 'Failed to trigger refresh' });
  }
});

export default router;
