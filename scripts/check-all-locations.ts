import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.VITE_SUPABASE_URL!,
  'process.env.SUPABASE_SERVICE_ROLE_KEY!',
  { auth: { persistSession: false } }
);

const { data } = await sb
  .from('locations')
  .select('id, type, slug, geographic_path')
  .order('geographic_path');

console.log(`Total: ${data?.length}`);
data?.forEach(r => console.log(`${r.geographic_path} — ${r.id}`));
