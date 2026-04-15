import { createClient } from '@supabase/supabase-js';
const s = createClient(
  process.env.VITE_SUPABASE_URL!,
  'process.env.SUPABASE_SERVICE_ROLE_KEY!',
  { auth: { persistSession: false } }
);
async function main() {
  const { data, error } = await (s as any).from('business_data').select('*').limit(1);
  if (data?.[0]) console.log('colunas:', Object.keys(data[0]).join(', '));
  else console.log('erro:', error?.message);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
