/**
 * Debug: verificar por que o marcador approximate não aparece no DOM.
 * Inspeciona o que o EventsService.getByBounds retorna para os bounds de Salvador.
 */

import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.VITE_SUPABASE_URL!,
  'process.env.SUPABASE_SERVICE_ROLE_KEY!',
  { auth: { persistSession: false } }
);

// Bounds do fetch inicial em MapaPageV4
const BOUNDS = { west: -38.6, south: -13.1, east: -38.3, north: -12.8 };

const { data: events } = await sb
  .from('events')
  .select('id, title, latitude, longitude, coordinate_source, status')
  .not('latitude', 'is', null)
  .not('longitude', 'is', null)
  .gte('latitude', BOUNDS.south)
  .lte('latitude', BOUNDS.north)
  .gte('longitude', BOUNDS.west)
  .lte('longitude', BOUNDS.east)
  .in('status', ['upcoming', 'ongoing'])
  .order('date', { ascending: true })
  .limit(200);

console.log(`\nEventos dentro dos bounds de Salvador:`);
console.log(`Bounds: west=${BOUNDS.west}, south=${BOUNDS.south}, east=${BOUNDS.east}, north=${BOUNDS.north}`);
console.log(`Total: ${events?.length ?? 0}\n`);

events?.forEach(e => {
  const inBounds =
    e.longitude >= BOUNDS.west && e.longitude <= BOUNDS.east &&
    e.latitude >= BOUNDS.south && e.latitude <= BOUNDS.north;
  console.log(`  ${e.title}`);
  console.log(`    lat=${e.latitude}, lng=${e.longitude}, source=${e.coordinate_source}, status=${e.status}`);
  console.log(`    dentro dos bounds: ${inBounds}`);
});
