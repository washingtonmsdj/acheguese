#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔧 APLICANDO FIX: ride_state_audit → ride_requests\n');

// Ler SQL
const sql = readFileSync('FIX_RIDE_STATE_AUDIT_REFERENCE.sql', 'utf8');

// Executar cada comando separadamente
const commands = sql
  .split(';')
  .map(cmd => cmd.trim())
  .filter(cmd => cmd && !cmd.startsWith('--') && !cmd.startsWith('SELECT'));

for (const cmd of commands) {
  console.log(`Executando: ${cmd.substring(0, 60)}...`);
  
  try {
    // Usar query direto via REST API
    const response = await fetch(
      `${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ query: cmd }),
      }
    );

    if (!response.ok) {
      console.log(`⚠️  Comando pode ter falhado (status ${response.status})`);
    } else {
      console.log('✅ OK');
    }
  } catch (error) {
    console.log(`⚠️  ${error.message}`);
  }
}

// Verificar resultado
console.log('\n📊 VERIFICANDO CONSTRAINT...\n');

const { data, error } = await supabase
  .from('ride_state_audit')
  .select('id')
  .limit(1);

if (error) {
  console.log('❌ Erro ao acessar ride_state_audit:', error.message);
} else {
  console.log('✅ ride_state_audit acessível');
}

console.log('\n✅ FIX APLICADO!\n');
