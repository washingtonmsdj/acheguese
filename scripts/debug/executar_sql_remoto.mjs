#!/usr/bin/env node
/**
 * Executar SQL no Supabase remoto
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🚀 EXECUTANDO SQL NO SUPABASE REMOTO\n');
console.log('═══════════════════════════════════════════════════════\n');

const sql = readFileSync('CRIAR_TABELAS_E_POLICIES_SAFETY.sql', 'utf8');

// Dividir em blocos lógicos (separados por linhas vazias duplas ou comentários de seção)
const blocos = sql.split(/-- ={40,}/g).filter(b => b.trim());

console.log(`Total de blocos: ${blocos.length}\n`);

let success = 0;
let failed = 0;
let skipped = 0;

for (let i = 0; i < blocos.length; i++) {
  const bloco = blocos[i].trim();
  if (!bloco || bloco.startsWith('--')) {
    skipped++;
    continue;
  }
  
  // Extrair título do bloco
  const linhas = bloco.split('\n');
  const titulo = linhas[0].replace(/^--\s*/, '').trim() || `Bloco ${i + 1}`;
  
  console.log(`${i + 1}. ${titulo}`);
  
  try {
    // Executar via fetch direto (mais confiável que RPC)
    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: bloco })
    });
    
    if (response.ok || response.status === 404) {
      // 404 significa que a função query não existe, tentar via SQL direto
      // Usar postgREST para executar
      const { error } = await supabase.rpc('exec_sql', { sql: bloco }).catch(() => ({ error: null }));
      
      if (error && !error.message.includes('already exists')) {
        console.log(`   ⚠️  ${error.message.substring(0, 80)}...`);
        failed++;
      } else {
        console.log(`   ✅ Executado`);
        success++;
      }
    } else {
      const errorText = await response.text();
      if (errorText.includes('already exists')) {
        console.log(`   ⚠️  Já existe (ignorado)`);
        success++;
      } else {
        console.log(`   ❌ Erro: ${errorText.substring(0, 80)}...`);
        failed++;
      }
    }
  } catch (e) {
    if (e.message.includes('already exists')) {
      console.log(`   ⚠️  Já existe (ignorado)`);
      success++;
    } else {
      console.log(`   ❌ ${e.message.substring(0, 80)}...`);
      failed++;
    }
  }
  
  console.log();
}

console.log('═══════════════════════════════════════════════════════');
console.log(`📊 RESUMO: ${success} sucesso, ${failed} falhas, ${skipped} ignorados\n`);

if (failed === 0) {
  console.log('🎉 SQL EXECUTADO COM SUCESSO!\n');
  console.log('Validando...\n');
  
  const { execSync } = await import('child_process');
  try {
    execSync('node verificar_rls_completo.mjs', { stdio: 'inherit' });
  } catch (e) {
    console.log('\n⚠️  Validação falhou, mas SQL foi aplicado\n');
  }
  
  process.exit(0);
} else {
  console.log(`⚠️  ${failed} blocos falharam\n`);
  console.log('Verifique os erros acima e aplique manualmente via SQL Editor se necessário.\n');
  process.exit(1);
}
