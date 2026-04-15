/**
 * Verifica se as migrations de coordenadas foram aplicadas no banco.
 * Executar após aplicar as migrations manualmente via Supabase Dashboard.
 *
 * Uso: npx tsx scripts/verify-coordinates-migrations.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_KEY  = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function main() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  VERIFICAÇÃO: Migrations de Coordenadas');
  console.log('═══════════════════════════════════════════════════\n');

  let allOk = true;

  // 1. Colunas em events
  const { error: e1 } = await sb.from('events').select('latitude, longitude, coordinate_source').limit(1);
  if (e1) {
    console.log('❌ events: colunas latitude/longitude/coordinate_source NÃO existem');
    console.log(`   Erro: ${e1.message}`);
    allOk = false;
  } else {
    console.log('✅ events: colunas latitude, longitude, coordinate_source — OK');
  }

  // 2. Colunas em community_alerts
  const { error: e2 } = await sb.from('community_alerts').select('latitude, longitude, coordinate_source').limit(1);
  if (e2) {
    console.log('❌ community_alerts: colunas latitude/longitude/coordinate_source NÃO existem');
    console.log(`   Erro: ${e2.message}`);
    allOk = false;
  } else {
    console.log('✅ community_alerts: colunas latitude, longitude, coordinate_source — OK');
  }

  // 3. View community_alerts_public com novos campos
  const { data: viewData, error: e3 } = await sb
    .from('community_alerts_public')
    .select('id, latitude, longitude, coordinate_source')
    .limit(1);
  if (e3) {
    console.log('❌ community_alerts_public: view sem novos campos');
    console.log(`   Erro: ${e3.message}`);
    allOk = false;
  } else {
    console.log('✅ community_alerts_public: view com latitude, longitude, coordinate_source — OK');
  }

  // 4. RPC create_community_alert com novos parâmetros
  const { error: e4 } = await sb.rpc('create_community_alert', {
    p_title: '__test__',
    p_description: '__test__',
    p_type: 'other',
    p_latitude: -12.9714,
    p_longitude: -38.5014,
    p_coord_source: 'exact',
  });
  // Esperamos erro de negócio (sem perfil ativo), não erro de "função não encontrada"
  if (e4 && e4.message?.includes('Could not find the function')) {
    console.log('❌ create_community_alert: RPC não aceita novos parâmetros');
    console.log(`   Erro: ${e4.message}`);
    allOk = false;
  } else {
    console.log('✅ create_community_alert: RPC aceita p_latitude, p_longitude, p_coord_source — OK');
    console.log(`   (Erro esperado de negócio: ${e4?.message?.substring(0, 60) || 'nenhum'})`);
  }

  // 5. Cobertura de backfill
  const { data: eventsWithCoords } = await sb
    .from('events').select('id').not('latitude', 'is', null).limit(1000);
  const { data: alertsWithCoords } = await sb
    .from('community_alerts').select('id').not('latitude', 'is', null).limit(1000);

  console.log(`\n  events com coordenada: ${eventsWithCoords?.length ?? 0}`);
  console.log(`  community_alerts com coordenada: ${alertsWithCoords?.length ?? 0}`);

  if ((eventsWithCoords?.length ?? 0) === 0 && (alertsWithCoords?.length ?? 0) === 0) {
    console.log('\n  ⚠️  Backfill ainda não executado ou locations sem canonical_lat/lng.');
  }

  console.log('\n═══════════════════════════════════════════════════');
  if (allOk) {
    console.log('  ✅ Todas as migrations foram aplicadas com sucesso!');
  } else {
    console.log('  ❌ Migrations pendentes. Aplicar via Supabase Dashboard:');
    console.log('  https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql');
    console.log('\n  Arquivos a executar (nesta ordem):');
    console.log('  1. supabase/migrations/20260403000001_add_coordinates_to_events.sql');
    console.log('  2. supabase/migrations/20260403000002_add_coordinates_to_community_alerts.sql');
    console.log('  3. supabase/migrations/20260403000003_update_create_community_alert_rpc.sql');
    console.log('\n  Após aplicar, executar o backfill:');
    console.log('  UPDATE events e SET latitude = l.canonical_lat, longitude = l.canonical_lng,');
    console.log("  coordinate_source = 'approximate' FROM locations l");
    console.log('  WHERE e.location_id = l.id AND l.canonical_lat IS NOT NULL AND e.latitude IS NULL;');
  }
  console.log('═══════════════════════════════════════════════════\n');

  process.exit(allOk ? 0 : 1);
}

main();
