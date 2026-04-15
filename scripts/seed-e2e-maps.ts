/**
 * Seed E2E para testes de dados reais no mapa.
 * Idempotente: verifica existência antes de inserir.
 *
 * Uso:
 *   npx tsx scripts/seed-e2e-maps.ts seed    — inserir seed
 *   npx tsx scripts/seed-e2e-maps.ts clean   — remover seed
 *   npx tsx scripts/seed-e2e-maps.ts status  — verificar estado
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_KEY  = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const PREFIX = '[E2E] e2e-maps-seed-v1';

const SEED_EVENTS = [
  {
    title: `${PREFIX} - Evento Pituba (exact)`,
    description: 'Evento de teste E2E com coordenada exata em Pituba',
    date: new Date(Date.now() + 86400000).toISOString(),
    location: 'Pituba, Salvador',
    category: 'cultura',
    status: 'upcoming',
    latitude: -12.9877,
    longitude: -38.4573,
    coordinate_source: 'exact',
    current_participants: 0,
    is_free: true,
  },
  {
    title: `${PREFIX} - Evento Rio Vermelho (approximate)`,
    description: 'Evento de teste E2E com coordenada aproximada em Rio Vermelho',
    date: new Date(Date.now() + 172800000).toISOString(),
    location: 'Rio Vermelho, Salvador',
    category: 'esporte',
    status: 'upcoming',
    latitude: -13.0050,
    longitude: -38.4950,
    coordinate_source: 'approximate',
    current_participants: 0,
    is_free: true,
  },
];

// community_alerts inseridos diretamente com service_role (bypass RLS para seed)
const SEED_ALERTS = [
  {
    title: `${PREFIX} - Alerta Barra (exact)`,
    description: 'Alerta de teste E2E com coordenada exata na Barra',
    type: 'other',
    status: 'open',
    latitude: -13.0100,
    longitude: -38.5300,
    coordinate_source: 'exact',
    edit_count: 0,
  },
];

async function getSeedProfile(): Promise<string | null> {
  const { data } = await sb
    .from('profiles')
    .select('id')
    .eq('is_active', true)
    .limit(1)
    .single();
  return data?.id ?? null;
}

async function seed() {
  console.log(`\n── Seed E2E Maps ────────────────────────────────────`);

  const profileId = await getSeedProfile();
  if (!profileId) {
    console.error('❌ Nenhum perfil ativo encontrado.');
    process.exit(1);
  }
  console.log(`  Perfil: ${profileId}`);

  // Events
  for (const event of SEED_EVENTS) {
    const { data: existing } = await sb
      .from('events')
      .select('id')
      .eq('title', event.title)
      .single();

    if (existing) {
      console.log(`  ⚠️  Já existe (event): ${event.title}`);
      continue;
    }

    const { data, error } = await sb
      .from('events')
      .insert({ ...event, organizer_profile_id: profileId })
      .select('id')
      .single();

    if (error) console.error(`  ❌ Event: ${error.message}`);
    else console.log(`  ✅ Event inserido: ${event.title} (${data.id})`);
  }

  // Community alerts — inserção direta com service_role
  for (const alert of SEED_ALERTS) {
    const { data: existing } = await sb
      .from('community_alerts')
      .select('id')
      .eq('title', alert.title)
      .single();

    if (existing) {
      console.log(`  ⚠️  Já existe (alert): ${alert.title}`);
      continue;
    }

    const { data, error } = await sb
      .from('community_alerts')
      .insert({ ...alert, profile_id: profileId })
      .select('id')
      .single();

    if (error) console.error(`  ❌ Alert: ${error.message}`);
    else console.log(`  ✅ Alert inserido: ${alert.title} (${data.id})`);
  }

  await status();
}

async function seedVolume() {
  console.log(`\n── Seed Volume (60+ eventos próximos para clustering) ──`);

  const profileId = await getSeedProfile();
  if (!profileId) { console.error('❌ Nenhum perfil ativo.'); process.exit(1); }

  // 60 eventos em cluster próximo em Pituba (dentro do threshold=50)
  const BASE_LAT = -12.9877;
  const BASE_LNG = -38.4573;
  let inserted = 0;

  for (let i = 0; i < 60; i++) {
    const title = `${PREFIX} - Volume ${String(i + 1).padStart(3, '0')}`;

    const { data: existing } = await sb.from('events').select('id').eq('title', title).single();
    if (existing) { continue; }

    // Dispersão pequena (~200m) para garantir clustering
    const lat = BASE_LAT + (Math.random() - 0.5) * 0.002;
    const lng = BASE_LNG + (Math.random() - 0.5) * 0.002;

    const { error } = await sb.from('events').insert({
      title,
      description: 'Evento de volume para teste de clustering',
      date: new Date(Date.now() + 86400000).toISOString(),
      location: 'Pituba, Salvador',
      category: 'cultura',
      status: 'upcoming',
      latitude: lat,
      longitude: lng,
      coordinate_source: 'exact',
      current_participants: 0,
      is_free: true,
      organizer_profile_id: profileId,
    });

    if (!error) inserted++;
  }

  console.log(`  ✅ ${inserted} eventos de volume inseridos`);
  await status();
}

async function clean() {
  console.log(`\n── Cleanup E2E Maps ─────────────────────────────────`);

  const { data: evDel } = await sb
    .from('events')
    .delete()
    .like('title', `${PREFIX}%`)
    .select('id');
  console.log(`  Events removidos: ${evDel?.length ?? 0}`);

  const { data: alDel } = await sb
    .from('community_alerts')
    .delete()
    .like('title', `${PREFIX}%`)
    .select('id');
  console.log(`  Alerts removidos: ${alDel?.length ?? 0}`);
}

async function status() {
  console.log(`\n── Status E2E Maps ──────────────────────────────────`);

  const { data: events } = await sb
    .from('events')
    .select('id, title, latitude, longitude, coordinate_source')
    .like('title', `${PREFIX}%`);

  const { data: alerts } = await sb
    .from('community_alerts')
    .select('id, title, latitude, longitude, coordinate_source')
    .like('title', `${PREFIX}%`);

  console.log(`\n  Events (${events?.length ?? 0}):`);
  events?.forEach(r => console.log(`    lat=${r.latitude}, lng=${r.longitude}, source=${r.coordinate_source} — ${r.title}`));

  console.log(`\n  Alerts (${alerts?.length ?? 0}):`);
  alerts?.forEach(r => console.log(`    lat=${r.latitude}, lng=${r.longitude}, source=${r.coordinate_source} — ${r.title}`));
}

const cmd = process.argv[2] ?? 'status';
if (cmd === 'seed')              await seed();
else if (cmd === 'seed-volume')  await seedVolume();
else if (cmd === 'clean')        await clean();
else                             await status();
