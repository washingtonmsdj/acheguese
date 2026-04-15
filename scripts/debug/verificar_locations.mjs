#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.remote' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL?.trim(),
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
);

async function run() {
  // Verificar locations ativas
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name, type, status')
    .eq('status', 'active')
    .order('type')
    .limit(10);

  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }

  console.log(`\n✅ ${locations?.length || 0} locations ativas encontradas:\n`);
  locations?.forEach(l => {
    console.log(`  [${l.type}] ${l.name} — ${l.id}`);
  });

  if (!locations || locations.length === 0) {
    console.log('\n⚠️  SEM LOCATIONS ATIVAS! O formulário não conseguirá criar addresses.');
    console.log('   Execute o SQL de seed de locations.');
  }
}

run().catch(console.error);
