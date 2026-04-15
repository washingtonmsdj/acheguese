#!/usr/bin/env node
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const tableName = process.argv[2] || 'classifieds';

const { data, error } = await supabase
  .from(tableName)
  .select('*')
  .limit(1);

if (error) {
  console.log(`❌ Tabela "${tableName}" não existe ou erro:`, error.message);
} else {
  console.log(`✅ Tabela "${tableName}" existe!`);
  console.log('Colunas:', Object.keys(data[0] || {}));
}
