import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.VITE_SUPABASE_URL!,
  'process.env.SUPABASE_SERVICE_ROLE_KEY!',
  { auth: { persistSession: false } }
);

async function main() {
  // Events: total, com location_id, sem location_id
  const { data: events } = await sb
    .from('events')
    .select('id, location_id, latitude, status')
    .limit(500);

  const evTotal = events?.length ?? 0;
  const evWithLoc = events?.filter(e => e.location_id).length ?? 0;
  const evWithCoord = events?.filter(e => e.latitude).length ?? 0;

  console.log(`events: total=${evTotal}, com location_id=${evWithLoc}, com coordenada=${evWithCoord}`);

  // Community alerts: total, com location_id, sem location_id
  const { data: alerts } = await sb
    .from('community_alerts')
    .select('id, location_id, latitude, status')
    .limit(500);

  const alTotal = alerts?.length ?? 0;
  const alWithLoc = alerts?.filter(a => a.location_id).length ?? 0;
  const alWithCoord = alerts?.filter(a => a.latitude).length ?? 0;

  console.log(`community_alerts: total=${alTotal}, com location_id=${alWithLoc}, com coordenada=${alWithCoord}`);

  // Location sem coordenada
  const { data: locsWithout } = await sb
    .from('locations')
    .select('slug, geographic_path')
    .is('canonical_lat', null);

  console.log(`\nLocations sem coordenada: ${locsWithout?.length ?? 0}`);
  locsWithout?.forEach(l => console.log(`  ${l.geographic_path}`));
}

main();
