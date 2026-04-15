import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.VITE_SUPABASE_URL!,
  'process.env.SUPABASE_SERVICE_ROLE_KEY!',
  { auth: { persistSession: false } }
);

async function main() {
  // Verificar colunas
  const { error: e1 } = await sb.from('events').select('latitude').limit(1);
  console.log('events.latitude:', e1 ? 'NAO EXISTE' : 'EXISTE');

  const { error: e2 } = await sb.from('community_alerts').select('latitude').limit(1);
  console.log('community_alerts.latitude:', e2 ? 'NAO EXISTE' : 'EXISTE');

  // Listar RPCs disponíveis
  const rpcs = ['exec_sql', 'exec', 'run_sql', 'execute_sql'];
  for (const rpc of rpcs) {
    const { error } = await (sb as any).rpc(rpc, { sql: 'SELECT 1' });
    console.log(`rpc.${rpc}:`, error ? `NAO EXISTE (${error.code})` : 'EXISTE');
  }
}

main();
