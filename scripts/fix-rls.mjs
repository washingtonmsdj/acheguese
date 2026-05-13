const PROJECT_REF = 'xhdowzacfujckjelqhtd';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  throw new Error('SUPABASE_ACCESS_TOKEN nao definida no ambiente.');
}

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ACCESS_TOKEN}` },
    body: JSON.stringify({ query: sql }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

// Tabelas que precisam de leitura pública
const tables = [
  'locations',
  'service_areas',
  'module_rollouts',
  'territorial_groups',
  'territorial_highlights',
  'territory_ai_content',
  'ad_campaigns',
];

for (const table of tables) {
  try {
    await query(`CREATE POLICY "public_read_${table}" ON ${table} FOR SELECT TO anon, authenticated USING (true)`);
    console.log(`✅ Policy criada: ${table}`);
  } catch (err) {
    const msg = err.message;
    if (msg.includes('already exists')) {
      console.log(`⚠️  Já existe: ${table}`);
    } else {
      console.log(`❌ ${table}: ${msg.slice(0, 100)}`);
    }
  }
}

console.log('\nDone!');
