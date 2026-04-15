#!/usr/bin/env node

/**
 * Script simples para aplicar funções RPC de pricing no Supabase
 */

import { readFileSync } from 'fs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

async function applyRpcFunctions() {
  console.log('🚀 Aplicando funções RPC de pricing...\n');

  try {
    // Ler o SQL
    const sql = readFileSync('ADD_PRICING_RPC_FUNCTIONS.sql', 'utf-8');

    // Executar via REST API do Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    console.log('✅ Funções RPC aplicadas com sucesso!\n');
    console.log('✅ Função activate_pricing_rule criada');
    console.log('✅ Função create_active_pricing_rule criada');

    console.log('\n✨ Pronto! Agora você pode:');
    console.log('   1. Criar regras ativas sem conflito');
    console.log('   2. Ativar regras inativas automaticamente');
    console.log('   3. Regras antigas serão desativadas automaticamente\n');

  } catch (err) {
    console.error('❌ Erro:', err.message);
    console.log('\n⚠️  A API REST não suporta exec_sql diretamente.');
    console.log('   Execute manualmente no Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new');
    console.log('\n📄 Cole este SQL:\n');
    console.log('─'.repeat(80));
    console.log(readFileSync('ADD_PRICING_RPC_FUNCTIONS.sql', 'utf-8'));
    console.log('─'.repeat(80));
  }
}

applyRpcFunctions();
