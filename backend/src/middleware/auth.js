import { supabaseAuth } from '../services/supabase.js';
import { query } from '../services/db.js';

const tierLevel = { free: 0, pro: 1, enterprise: 2 };

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify JWT via Supabase Auth
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch user tier from Railway Postgres
    const result = await query(
      'SELECT tier, display_name FROM profiles WHERE id = $1',
      [user.id]
    );
    const profile = result.rows[0];

    // Auto-create profile if not exists
    if (!profile) {
      await query(
        'INSERT INTO profiles (id, email, tier) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
        [user.id, user.email, 'free']
      );
    }

    req.user = {
      id: user.id,
      email: user.email,
      tier: profile?.tier || 'free',
      displayName: profile?.display_name || null,
    };

    req.accessToken = token;
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

export function requireTier(minimumTier) {
  return (req, res, next) => {
    const userTier = req.user?.tier || 'free';
    const userLevel = tierLevel[userTier] ?? 0;
    const requiredLevel = tierLevel[minimumTier] ?? 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        error: 'Insufficient tier',
        message: `This feature requires the "${minimumTier}" plan or above. Please upgrade your account.`,
        currentTier: userTier,
        requiredTier: minimumTier,
      });
    }

    next();
  };
}
