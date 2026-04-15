#!/usr/bin/env node
/**
 * Script simples para aplicar migration no Supabase
 * Uso: node apply-migration-simple.mjs
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

async function executeSql(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return response.json();
}

async function main() {
  try {
    console.log('📖 Lendo SQL...');
    const sqlPath = join(__dirname, 'APLICAR_NO_SUPABASE.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('🚀 Aplicando migration via REST API...');
    
    // Tentar executar via RPC
    try {
      await executeSql(sql);
      console.log('✅ Migration aplicada com sucesso!');
    } catch (error) {
      console.log('⚠️  RPC não disponível:', error.message);
      console.log('');
      console.log('📋 Aplicar manualmente:');
      console.log('1. Abrir: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new');
      console.log('2. Copiar conteúdo de: APLICAR_NO_SUPABASE.sql');
      console.log('3. Colar e executar (Run)');
      process.exit(1);
    }

    // Verificar se a tabela foi criada
    console.log('🔍 Verificando tabela...');
    const checkResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/neighborhood_boundaries?limit=0`,
      {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`
        }
      }
    );

    if (checkResponse.ok) {
      console.log('✅ Tabela neighborhood_boundaries criada!');
      console.log('');
      console.log('🎯 Próximos passos:');
      console.log('1. Recarregar aplicação');
      console.log('2. Identificar bairros sem polígono');
      console.log('3. Cadastrar usando: scripts/cadastrar-bairro.md');
    } else {
      console.log('⚠️  Tabela pode não ter sido criada');
      console.log('Verificar manualmente no Dashboard');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('');
    console.log('💡 Aplicar manualmente no Dashboard:');
    console.log('https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new');
    process.exit(1);
  }
}

main();
