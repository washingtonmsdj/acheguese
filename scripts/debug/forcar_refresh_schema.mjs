#!/usr/bin/env node
/**
 * Script para forçar refresh do schema cache do Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.remote' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.error('Certifique-se de que .env.remote contém:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔄 Forçando refresh do schema cache...\n');

async function main() {
  try {
    // 1. Verificar colunas existentes
    console.log('1️⃣ Verificando colunas da tabela ride_requests...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'ride_requests'
          ORDER BY ordinal_position;
        `
      });

    if (columnsError) {
      console.log('⚠️  Não foi possível verificar via RPC, tentando query direta...');
      
      // Tentar query direta
      const { data: testData, error: testError } = await supabase
        .from('ride_requests')
        .select('*')
        .limit(1);
      
      if (testError) {
        console.error('❌ Erro ao testar tabela:', testError.message);
      } else {
        console.log('✅ Tabela ride_requests acessível');
        if (testData && testData.length > 0) {
          console.log('📋 Colunas disponíveis:', Object.keys(testData[0]).join(', '));
        }
      }
    } else {
      console.log('✅ Colunas encontradas:', columns?.length || 0);
      if (columns) {
        columns.forEach(col => {
          console.log(`   - ${col.column_name} (${col.data_type})`);
        });
      }
    }

    // 2. Verificar colunas específicas
    console.log('\n2️⃣ Verificando colunas do motor operacional...');
    const requiredColumns = ['destination', 'origin', 'status', 'departure_time'];
    
    for (const colName of requiredColumns) {
      const { data, error } = await supabase
        .from('ride_requests')
        .select(colName)
        .limit(1);
      
      if (error) {
        console.log(`   ❌ ${colName}: ${error.message}`);
      } else {
        console.log(`   ✅ ${colName}: existe`);
      }
    }

    // 3. Tentar notificar PostgREST (pode não funcionar via client)
    console.log('\n3️⃣ Tentando notificar PostgREST...');
    const { error: notifyError } = await supabase
      .rpc('exec_sql', {
        query: "NOTIFY pgrst, 'reload schema';"
      });
    
    if (notifyError) {
      console.log('⚠️  NOTIFY não disponível via client (esperado)');
      console.log('   Você precisa executar no SQL Editor:');
      console.log('   NOTIFY pgrst, \'reload schema\';');
    } else {
      console.log('✅ PostgREST notificado');
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO');
    console.log('='.repeat(60));
    console.log('O cache do Supabase é gerenciado pelo PostgREST.');
    console.log('Para forçar refresh, você precisa:');
    console.log('');
    console.log('1. Acessar: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/editor');
    console.log('2. Executar: NOTIFY pgrst, \'reload schema\';');
    console.log('3. Aguardar 30 segundos');
    console.log('4. Testar novamente no navegador');
    console.log('');
    console.log('OU pausar/retomar o projeto no Dashboard.');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

main();
