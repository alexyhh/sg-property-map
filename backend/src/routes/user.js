import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { query } from '../services/db.js';

const router = Router();

const tierFeatures = {
  free: {
    planningArea: true, district: false, cadastral: false,
    timeRanges: ['12m'], flatTypeFilter: false,
    yoyTrend: false, vs5yrAvg: false, exportCsv: false,
    watchlist: false, maxTransactions: 3,
  },
  pro: {
    planningArea: true, district: true, cadastral: true,
    timeRanges: ['3m', '12m', '3y', 'all'], flatTypeFilter: true,
    yoyTrend: true, vs5yrAvg: true, exportCsv: true,
    watchlist: true, maxWatchlist: 10, maxTransactions: -1,
  },
  enterprise: {
    planningArea: true, district: true, cadastral: true,
    timeRanges: ['3m', '12m', '3y', 'all'], flatTypeFilter: true,
    yoyTrend: true, vs5yrAvg: true, exportCsv: true,
    watchlist: true, maxWatchlist: -1, maxTransactions: -1,
    apiAccess: true, teamSeats: 50,
  },
};

router.get('/profile', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM profiles WHERE id = $1', [req.user.id]);
    const profile = result.rows[0];
    const tier = profile?.tier || 'free';

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        displayName: profile?.display_name || null,
        tier,
        features: tierFeatures[tier] || tierFeatures.free,
        createdAt: profile?.created_at || null,
      },
    });
  } catch (err) {
    console.error('Error in GET /api/user/profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/profile', authenticate, async (req, res) => {
  try {
    const { displayName } = req.body;

    if (displayName === undefined || displayName === null) {
      return res.status(400).json({ error: 'Missing required field: displayName' });
    }

    if (typeof displayName !== 'string' || displayName.length > 100) {
      return res.status(400).json({ error: 'displayName must be a string of 100 characters or fewer' });
    }

    const result = await query(
      `INSERT INTO profiles (id, email, display_name, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (id) DO UPDATE SET display_name = $3, updated_at = NOW()
       RETURNING *`,
      [req.user.id, req.user.email, displayName.trim()]
    );
    const profile = result.rows[0];

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        displayName: profile.display_name,
        tier: profile.tier || 'free',
      },
    });
  } catch (err) {
    console.error('Error in PUT /api/user/profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.get('/tier', authenticate, async (req, res) => {
  try {
    const tier = req.user.tier || 'free';
    res.json({ tier, features: tierFeatures[tier] || tierFeatures.free });
  } catch (err) {
    console.error('Error in GET /api/user/tier:', err);
    res.status(500).json({ error: 'Failed to fetch tier information' });
  }
});

// One-time admin setup: POST /api/user/admin-setup
// Protected by SUPABASE_SERVICE_ROLE_KEY as bearer token
router.post('/admin-setup', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const expectedKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!authHeader || !expectedKey || authHeader !== `Bearer ${expectedKey}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId, email, tier, displayName } = req.body;
    if (!userId || !email || !tier) {
      return res.status(400).json({ error: 'Missing userId, email, or tier' });
    }

    const result = await query(
      `INSERT INTO profiles (id, email, display_name, tier, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (id) DO UPDATE SET tier = $4, display_name = $3, updated_at = NOW()
       RETURNING *`,
      [userId, email, displayName || 'Admin', tier]
    );

    res.json({ profile: result.rows[0] });
  } catch (err) {
    console.error('Error in POST /api/user/admin-setup:', err);
    res.status(500).json({ error: 'Failed to setup admin' });
  }
});

export default router;
