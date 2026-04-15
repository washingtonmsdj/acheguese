const PROJECT_REF = 'xhdowzacfujckjelqhtd';
const ACCESS_TOKEN = 'sbp_db5b6a29484375c7ceec51616d0c3ef56083a170';

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: `
    SELECT
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'business_data'
      AND ccu.table_name = 'locations'
    ORDER BY kcu.column_name;
  ` }),
});
const data = await res.json();
console.log('FKs business_data → locations:', JSON.stringify(data, null, 2));
