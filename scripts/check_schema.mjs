import pg from 'pg';
const { Client } = pg;

const c = new Client({
  host: 'aws-0-us-west-2.pooler.supabase.com',
  port: 6543,
  user: 'postgres.xhdowzacfujckjelqhtd',
  password: process.env.SUPABASE_DB_PASSWORD,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

await c.connect();

const cols = await c.query(`
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'business_data' 
    AND column_name IN ('id', 'profile_id')
  ORDER BY column_name
`);
console.log('Colunas:', cols.rows);

const pk = await c.query(`
  SELECT kcu.column_name 
  FROM information_schema.table_constraints tc 
  JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name 
  WHERE tc.table_name = 'business_data' AND tc.constraint_type = 'PRIMARY KEY'
`);
console.log('PK:', pk.rows);

const uniq = await c.query(`
  SELECT kcu.column_name, tc.constraint_name
  FROM information_schema.table_constraints tc 
  JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name 
  WHERE tc.table_name = 'business_data' AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
  ORDER BY tc.constraint_type, kcu.column_name
`);
console.log('Unique/PK constraints:', uniq.rows);

await c.end();
