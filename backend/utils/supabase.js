const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️  Supabase credentials not configured. File uploads will not work.');
}

const supabase = createClient(SUPABASE_URL || 'https://dummy.supabase.co', SUPABASE_ANON_KEY || 'dummy-key');

module.exports = { supabase };
