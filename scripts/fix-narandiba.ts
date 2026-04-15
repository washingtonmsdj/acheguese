import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.VITE_SUPABASE_URL!,
  'process.env.SUPABASE_SERVICE_ROLE_KEY!',
  { auth: { persistSession: false } }
);

const { error } = await sb
  .from('locations')
  .update({ canonical_lat: -12.9600, canonical_lng: -38.4700 })
  .eq('geographic_path', '/br/ba/salvador/narandiba');

console.log(error ? 'ERRO: ' + error.message : 'OK — narandiba atualizada');
