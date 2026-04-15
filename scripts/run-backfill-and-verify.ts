import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.VITE_SUPABASE_URL!,
  'process.env.SUPABASE_SERVICE_ROLE_KEY!',
  { auth: { persistSession: false } }
);

async function main() {
  // 1. Verificar cobertura de locations
  const { data: locs } = await sb
    .from('locations')
    .select('type, canonical_lat')
    .limit(200);

  const byType: Record<string, { total: number; withCoords: number }> = {};
  locs?.forEach((r: any) => {
    if (!byType[r.type]) byType[r.type] = { total: 0, withCoords: 0 };
    byType[r.type].total++;
    if (r.canonical_lat) byType[r.type].withCoords++;
  });

  console.log('Cobertura de locations:');
  Object.entries(byType).forEach(([type, s]) =>
    console.log(`  ${type}: ${s.withCoords}/${s.total}`)
  );

  // 2. Backfill events via UPDATE usando supabase client
  // Buscar events com location_id mas sem latitude
  const { data: eventsToFill } = await sb
    .from('events')
    .select('id, location_id')
    .not('location_id', 'is', null)
    .is('latitude', null)
    .limit(500);

  console.log(`\nEvents para backfill: ${eventsToFill?.length ?? 0}`);

  let eventsUpdated = 0;
  for (const event of eventsToFill ?? []) {
    const { data: loc } = await sb
      .from('locations')
      .select('canonical_lat, canonical_lng')
      .eq('id', event.location_id)
      .single();

    if (loc?.canonical_lat) {
      const { error } = await sb
        .from('events')
        .update({
          latitude: loc.canonical_lat,
          longitude: loc.canonical_lng,
          coordinate_source: 'approximate',
        })
        .eq('id', event.id);

      if (!error) eventsUpdated++;
    }
  }
  console.log(`Events atualizados: ${eventsUpdated}`);

  // 3. Backfill community_alerts
  const { data: alertsToFill } = await sb
    .from('community_alerts')
    .select('id, location_id')
    .not('location_id', 'is', null)
    .is('latitude', null)
    .limit(500);

  console.log(`\nAlertas para backfill: ${alertsToFill?.length ?? 0}`);

  let alertsUpdated = 0;
  for (const alert of alertsToFill ?? []) {
    const { data: loc } = await sb
      .from('locations')
      .select('canonical_lat, canonical_lng')
      .eq('id', alert.location_id)
      .single();

    if (loc?.canonical_lat) {
      const { error } = await sb
        .from('community_alerts')
        .update({
          latitude: loc.canonical_lat,
          longitude: loc.canonical_lng,
          coordinate_source: 'approximate',
        })
        .eq('id', alert.id);

      if (!error) alertsUpdated++;
    }
  }
  console.log(`Alertas atualizados: ${alertsUpdated}`);

  // 4. Verificação final
  const { data: eventsWithCoords } = await sb
    .from('events')
    .select('id')
    .not('latitude', 'is', null)
    .limit(1000);

  const { data: alertsWithCoords } = await sb
    .from('community_alerts')
    .select('id')
    .not('latitude', 'is', null)
    .limit(1000);

  console.log(`\n── Resultado final ──`);
  console.log(`events com coordenada:           ${eventsWithCoords?.length ?? 0}`);
  console.log(`community_alerts com coordenada: ${alertsWithCoords?.length ?? 0}`);
}

main();
