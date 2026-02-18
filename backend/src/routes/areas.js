import { Router } from 'express';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate, requireTier } from '../middleware/auth.js';
import { query } from '../services/db.js';
import { PLANNING_AREAS, getPlanningAreaNames } from '../data/planningAreas.js';
import { POSTAL_DISTRICTS, getDistrictNames } from '../data/districts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// Load bundled URA planning area boundary GeoJSON at startup
let planningAreaGeoJson = null;
try {
  const geoPath = path.join(__dirname, '../data/planningAreaBoundaries.geojson');
  planningAreaGeoJson = JSON.parse(readFileSync(geoPath, 'utf-8'));
  console.log(`Loaded ${planningAreaGeoJson.features?.length || 0} planning area polygons from bundled GeoJSON`);
} catch (err) {
  console.warn('Failed to load bundled GeoJSON, will use fallback:', err.message);
}

router.get('/planning', (_req, res) => {
  try {
    if (planningAreaGeoJson) {
      return res.json(planningAreaGeoJson);
    }
    return res.json(buildFallbackPlanningAreaGeoJson());
  } catch (err) {
    console.error('Error in GET /api/areas/planning:', err);
    res.status(500).json({ error: 'Failed to load planning area data' });
  }
});

router.get('/districts', authenticate, requireTier('pro'), async (_req, res) => {
  try {
    const features = Object.entries(POSTAL_DISTRICTS).map(([code, info]) => ({
      type: 'Feature',
      properties: { code, name: info.name, postalCodes: info.postalCodes },
      geometry: null,
    }));

    res.json({
      type: 'FeatureCollection',
      features,
      meta: {
        source: 'static-definitions',
        districts: getDistrictNames(),
      },
    });
  } catch (err) {
    console.error('Error in GET /api/areas/districts:', err);
    res.status(500).json({ error: 'Failed to load district data' });
  }
});

router.get('/watchlist', authenticate, requireTier('pro'), async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM watchlist WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ watchlist: result.rows });
  } catch (err) {
    console.error('Error in GET /api/areas/watchlist:', err);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

router.post('/watchlist', authenticate, requireTier('pro'), async (req, res) => {
  try {
    const { area_name, level = 'planning_area' } = req.body;

    if (!area_name) {
      return res.status(400).json({ error: 'Missing required field: area_name' });
    }
    if (!['planning_area', 'district'].includes(level)) {
      return res.status(400).json({ error: 'level must be "planning_area" or "district"' });
    }

    const countResult = await query(
      'SELECT COUNT(*) as count FROM watchlist WHERE user_id = $1',
      [req.user.id]
    );
    const currentCount = parseInt(countResult.rows[0].count, 10);
    const maxWatchlist = req.user.tier === 'enterprise' ? Infinity : 10;

    if (currentCount >= maxWatchlist) {
      return res.status(400).json({ error: `Watchlist limit reached (${maxWatchlist}).`, currentCount, maxWatchlist });
    }

    const result = await query(
      `INSERT INTO watchlist (user_id, area_name, level)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, area_name, level) DO NOTHING
       RETURNING *`,
      [req.user.id, area_name.toUpperCase(), level]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'Area is already in your watchlist' });
    }

    res.status(201).json({ watchlistItem: result.rows[0] });
  } catch (err) {
    console.error('Error in POST /api/areas/watchlist:', err);
    res.status(500).json({ error: 'Failed to add area to watchlist' });
  }
});

router.delete('/watchlist/:id', authenticate, requireTier('pro'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM watchlist WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Watchlist item not found' });
    }

    res.json({ message: 'Watchlist item removed', id });
  } catch (err) {
    console.error('Error in DELETE /api/areas/watchlist/:id:', err);
    res.status(500).json({ error: 'Failed to remove area from watchlist' });
  }
});

function buildFallbackPlanningAreaGeoJson() {
  const features = Object.entries(PLANNING_AREAS).map(([key, info]) => ({
    type: 'Feature',
    properties: { name: key, planningAreaName: key, displayName: info.name },
    geometry: { type: 'Point', coordinates: info.center },
  }));

  return {
    type: 'FeatureCollection',
    features,
    meta: { source: 'static-fallback', planningAreas: getPlanningAreaNames() },
  };
}

export default router;
