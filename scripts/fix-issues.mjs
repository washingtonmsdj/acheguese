const PROJECT_REF = 'xhdowzacfujckjelqhtd';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  throw new Error('SUPABASE_ACCESS_TOKEN nao definida no ambiente.');
}

async function query(sql, label) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  const data = await res.json();
  console.log(`[${res.status}] ${label}:`, JSON.stringify(data).slice(0, 200));
  return data;
}

// 1. Remove o FK duplicado em business_data
await query(
  `ALTER TABLE business_data DROP CONSTRAINT IF EXISTS fk_business_data_location_id;`,
  'Remove FK duplicado business_data'
);

// 2. Recarrega schema cache do PostgREST
await query(`NOTIFY pgrst, 'reload schema';`, 'Reload PostgREST schema');

console.log('\nDone.');
