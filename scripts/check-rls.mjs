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
  return res.json();
}

const rls = await query("SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'locations'");
console.log('RLS status:', JSON.stringify(rls, null, 2));

const policies = await query("SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'locations'");
console.log('Policies:', JSON.stringify(policies, null, 2));
