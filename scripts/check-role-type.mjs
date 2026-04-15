import { config } from 'dotenv';
config({ path: '.env.local' });

const res = await fetch('https://api.supabase.com/v1/projects/xhdowzacfujckjelqhtd/database/query', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + process.env.SUPABASE_ACCESS_TOKEN,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query: `
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_name = 'profile_members' AND column_name = 'role';
  ` })
});
console.log(await res.json());
