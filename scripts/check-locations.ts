import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.VITE_SUPABASE_URL!,
  'process.env.SUPABASE_SERVICE_ROLE_KEY!',
  { auth: { persistSession: false } }
);

const { data } = await sb
  .from('locations')
  .select('id, type, slug, geographic_path, canonical_lat, canonical_lng')
  .order('type')
  .limit(20);

console.log(JSON.stringify(data, null, 2));
