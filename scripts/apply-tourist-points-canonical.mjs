const PROJECT_REF = 'xhdowzacfujckjelqhtd';
const ACCESS_TOKEN = 'sbp_db5b6a29484375c7ceec51616d0c3ef56083a170';
const SERVICE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  console.log(`[${res.status}]`, text.slice(0, 300));
  return res.status;
}

async function rest(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  console.log(`[${res.status}] ${method} ${path}:`, text.slice(0, 500));
  return JSON.parse(text);
}

// ── 1. Adicionar colunas canônicas ────────────────────────────────────────────
console.log('\n=== 1. Adicionando location_id e address_id ===');
await query(`
  ALTER TABLE tourist_points
    ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS address_id  UUID REFERENCES addresses(id) ON DELETE SET NULL;

  CREATE INDEX IF NOT EXISTS idx_tourist_points_location_id ON tourist_points(location_id);
  CREATE INDEX IF NOT EXISTS idx_tourist_points_address_id  ON tourist_points(address_id);
`);

// ── 2. Buscar location_id do bairro Barra em Salvador ────────────────────────
console.log('\n=== 2. Buscando location_id da Barra ===');
const locations = await rest('GET', "locations?slug=eq.barra&select=id,name,full_name,geographic_path&limit=5");
const barraLocation = locations.find(l => l.geographic_path?.includes('salvador'));
console.log('Barra location:', barraLocation);

if (!barraLocation) {
  console.error('Location "barra" em Salvador não encontrada. Verifique os dados em locations.');
  process.exit(1);
}

// ── 3. Criar endereço canônico para a Praia do Porto da Barra ────────────────
console.log('\n=== 3. Criando address canônico ===');
const addresses = await rest('POST', 'addresses', {
  location_id: barraLocation.id,
  street: 'Avenida Sete de Setembro',
  number: 's/n',
  complement: 'Orla da Barra',
  postal_code: '40140-100',
  address_type: 'exact',
  latitude: -13.0089,
  longitude: -38.5321,
  geocoding_source: 'manual',
  geocoding_confidence: 1.0,
  is_verified: true,
});
const newAddress = Array.isArray(addresses) ? addresses[0] : addresses;
console.log('Address criado:', newAddress?.id);

// ── 4. Atualizar o ponto turístico com os IDs canônicos ──────────────────────
console.log('\n=== 4. Atualizando tourist_point com FKs canônicas ===');
await rest('PATCH', 'tourist_points?slug=eq.praia-porto-da-barra', {
  location_id: barraLocation.id,
  address_id: newAddress?.id ?? null,
});

console.log('\n✓ Migração concluída.');
