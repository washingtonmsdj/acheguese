import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.VITE_SUPABASE_URL!,
  'process.env.SUPABASE_SERVICE_ROLE_KEY!',
  { auth: { persistSession: false } }
);

async function main() {
  // Listar funções via information_schema usando select em tabela que aceita SQL
  // Tentar via pg_proc através de uma view que possa existir
  const knownRpcs = [
    'create_community_alert',
    'increment_alert_edit_count',
    'reserve_route',
    'create_profile_with_extension',
    'increment_event_participants',
    'decrement_event_participants',
    'increment_alert_confirmations',
    'decrement_alert_confirmations',
  ];

  console.log('RPCs conhecidas no banco:');
  for (const rpc of knownRpcs) {
    const { error } = await (sb as any).rpc(rpc, {});
    // Se erro for de parâmetros (não de "não encontrado"), a função existe
    const exists = !error || !error.message?.includes('Could not find the function');
    console.log(`  ${rpc}: ${exists ? 'EXISTE' : 'NAO EXISTE'} — ${error?.message?.substring(0, 80) || 'OK'}`);
  }
}

main();
