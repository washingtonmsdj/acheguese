import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_KEY  = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function main() {
  console.log('=== STATUS DO BANCO ===\n');

  // 1. Verificar se tabela existe
  const { error: tErr } = await (supabase as any).from('business_slug_history').select('id').limit(0);
  console.log('business_slug_history existe:', !tErr, tErr?.message ?? '');

  // 2. Verificar RPCs disponiveis
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
    },
  });
  const schema = await res.json() as any;
  const rpcs = Object.keys(schema?.paths ?? {}).filter((p: string) => p.startsWith('/rpc/'));
  console.log('\nRPCs disponiveis:', rpcs);

  // 3. Verificar se business_data tem slug
  const { data: sample } = await (supabase as any)
    .from('business_data')
    .select('profile_id, slug, location_id, status')
    .not('slug', 'is', null)
    .eq('status', 'active')
    .limit(3);
  console.log('\nEmpresas com slug:', sample);

  // 4. Verificar join locations
  const { data: joinTest, error: jErr } = await (supabase as any)
    .from('business_data')
    .select('profile_id, slug, location:locations!location_id(geographic_path)')
    .not('slug', 'is', null)
    .eq('status', 'active')
    .limit(1);
  console.log('\nJoin locations funciona:', !jErr, jErr?.message ?? '');
  console.log('Resultado join:', joinTest);
}

main().catch(console.error);
