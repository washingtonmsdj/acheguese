#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  'process.env.SUPABASE_SERVICE_ROLE_KEY!'
);

async function main() {
  console.log('📦 Aplicando migration 20260329000011_business_slug_history.sql...\n');

  const sql = readFileSync('supabase/migrations/20260329000011_business_slug_history.sql', 'utf-8');
  
  // Dividir em statements individuais
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && s.length > 10);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';';
    console.log(`Executando statement ${i + 1}/${statements.length}...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt });
      if (error) {
        console.error(`❌ Erro no statement ${i + 1}:`, error.message);
      } else {
        console.log(`✅ Statement ${i + 1} executado`);
      }
    } catch (err: any) {
      console.error(`❌ Exceção no statement ${i + 1}:`, err.message);
    }
  }

  console.log('\n✅ Migration aplicada!');
}

main();
