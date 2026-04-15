#!/usr/bin/env node
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const tables = [
  'profiles',
  'locations',
  'territorial_groups',
  'businesses',
  'classifieds',
  'events',
  'posts',
  'ad_campaigns',
  'ad_targets',
  'territorial_highlights',
  'territory_ai_content',
];

console.log('🔍 Verificando tabelas...\n');

for (const table of tables) {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ ${table.padEnd(25)} - ${error.message}`);
    } else {
      console.log(`✅ ${table.padEnd(25)} - OK`);
    }
  } catch (err) {
    console.log(`❌ ${table.padEnd(25)} - ${err.message}`);
  }
}

console.log('\n✅ Verificação concluída!');
