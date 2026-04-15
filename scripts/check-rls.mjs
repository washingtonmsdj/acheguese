const PROJECT_REF = 'xhdowzacfujckjelqhtd';
const ACCESS_TOKEN = 'sbp_296ec3010b43324ce6163eb5150c45facea545c4';

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
