#!/usr/bin/env node

/**
 * Script para aplicar funções RPC de pricing no Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applyRpcFunctions() {
  console.log('🚀 Aplicando funções RPC de pricing...\n');

  try {
    // Ler o SQL
    const sql = readFileSync('ADD_PRICING_RPC_FUNCTIONS.sql', 'utf-8');

    // Executar via RPC query
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
      // Se exec_sql não existir, tentar executar diretamente
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ sql_query: sql })
      });

      if (!response.ok) {
        // Tentar via query direto
        const queryResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/vnd.pgrst.object+json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Prefer': 'return=representation'
          },
          body: sql
        });

        if (!queryResponse.ok) {
          throw new Error(`HTTP ${queryResponse.status}: ${await queryResponse.text()}`);
        }

        return { data: await queryResponse.json(), error: null };
      }

      return { data: await response.json(), error: null };
    });

    if (error) {
      console.error('❌ Erro ao aplicar funções RPC:', error);
      console.log('\n⚠️  Execute manualmente no Supabase SQL Editor:');
      console.log('   https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new');
      process.exit(1);
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
    console.log('\n⚠️  Execute manualmente no Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new');
    console.log('\n📄 Conteúdo do arquivo ADD_PRICING_RPC_FUNCTIONS.sql:\n');
    console.log(readFileSync('ADD_PRICING_RPC_FUNCTIONS.sql', 'utf-8'));
    process.exit(1);
  }
}

applyRpcFunctions();
