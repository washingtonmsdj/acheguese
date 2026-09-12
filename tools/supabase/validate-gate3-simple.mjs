/**
 * GATE 3: preflight read-only de Failed Delivery Metadata.
 *
 * Este utilitario legado permanece apenas como probe seguro de estrutura remota.
 * Escritas de snapshot/resolucao pertencem aos owners canonicos de Mobilidade e
 * aos testes de contrato; o script nunca deve alterar `ride_requests` diretamente.
 */

import { createAnonClient } from './supabase-client.mjs';

const supabase = createAnonClient({ envFiles: ['.env.test', '.env.local', '.env'] });

console.log('========================================');
console.log('GATE 3: PREFLIGHT READ-ONLY');
console.log('========================================\n');

const { data, error } = await supabase
  .from('ride_requests')
  .select('id, status, ride_mode, failed_delivery_at, failed_delivery_reason, failed_delivery_metadata')
  .limit(1);

if (error) {
  if (error.message.includes('failed_delivery_metadata')) {
    console.error('❌ Coluna failed_delivery_metadata indisponivel:', error.message);
  } else {
    console.error('❌ Preflight remoto falhou:', error.message);
  }
  process.exit(1);
}

console.log('✅ Leitura estrutural de ride_requests concluida sem DML.');

if (!data || data.length === 0) {
  console.log('ℹ️ Nenhuma ride visivel para o cliente anonimo; isso nao e falha do contrato.');
} else {
  const sample = data[0];
  console.log(`ℹ️ Amostra legivel: id=${sample.id}, status=${sample.status}, ride_mode=${sample.ride_mode}`);
  console.log(
    `ℹ️ failed_delivery_metadata presente: ${sample.failed_delivery_metadata != null ? 'sim' : 'nao'}`,
  );
}

console.log('\nAutoridade de escrita:');
console.log('  - snapshot inicial: comando/broker canonico de Mobilidade');
console.log('  - retry G82: mesma ride, server-owned, via retry_delivery_requested');
console.log('  - handoff G81: solicitacao administrativa + aceite autenticado do receptor');
console.log('  - next_ride_id: somente leitura historica; nunca input de comando');
console.log('\nNenhuma linha foi alterada por este probe.');
console.log('\n========================================');
console.log('PREFLIGHT READ-ONLY CONCLUIDO ✅');
console.log('========================================\n');
