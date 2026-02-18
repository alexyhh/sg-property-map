import pg from 'pg';

const { Pool } = pg;

// Railway internal Postgres (postgres:16-alpine) doesn't use SSL
// Only enable SSL if DATABASE_URL contains an external host
const dbUrl = process.env.DATABASE_URL || '';
const needsSsl = dbUrl.includes('railway.app') || dbUrl.includes('rlwy.net');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

export async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 1000) {
    console.warn(`Slow query (${duration}ms):`, text.substring(0, 100));
  }
  return result;
}

export async function getClient() {
  return pool.connect();
}

export async function initDatabase() {
  console.log('Initializing database tables...');

  await query(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT,
      display_name TEXT,
      tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS hdb_transactions (
      id SERIAL PRIMARY KEY,
      month TEXT NOT NULL,
      town TEXT NOT NULL,
      flat_type TEXT NOT NULL,
      block TEXT,
      street_name TEXT,
      storey_range TEXT,
      floor_area_sqm REAL,
      flat_model TEXT,
      lease_commence_date TEXT,
      remaining_lease TEXT,
      resale_price REAL NOT NULL,
      psf REAL,
      planning_area TEXT,
      district TEXT,
      UNIQUE(month, town, block, street_name, flat_type, storey_range, floor_area_sqm, resale_price)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS watchlist (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      area_name TEXT NOT NULL,
      level TEXT DEFAULT 'planning_area',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, area_name, level)
    )
  `);

  // Create indexes for performance
  await query(`CREATE INDEX IF NOT EXISTS idx_hdb_transactions_town ON hdb_transactions(town)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_hdb_transactions_month ON hdb_transactions(month)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_hdb_transactions_district ON hdb_transactions(district)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_hdb_transactions_planning_area ON hdb_transactions(planning_area)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id)`);

  console.log('Database tables initialized successfully');
}

export default { query, getClient, initDatabase };
