import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Auth features will not work.',
  );
}

// Supabase client used ONLY for authentication (verifying JWTs)
export const supabaseAuth = createClient(supabaseUrl || '', supabaseServiceRoleKey || '', {
  auth: { autoRefreshToken: false, persistSession: false },
});

export default supabaseAuth;
