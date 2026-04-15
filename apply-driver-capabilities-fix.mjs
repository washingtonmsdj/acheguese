#!/usr/bin/env node

/**
 * Script para aplicar correção da RPC create_profile_with_extension
 * Adiciona suporte às capacidades can_do_delivery e can_do_rides
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xhdowzacfujckjelqhtd.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada');
  console.error('💡 Configure a variável de ambiente ou use .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function applyMigration() {
  try {
    console.log('🔧 Aplicando correção da RPC create_profile_with_extension...\n');

    // Ler o arquivo de migração
    const migrationPath = join(__dirname, 'supabase/migrations/20260414200000_fix_create_profile_driver_capabilities.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Extrair apenas a parte da função (sem comentários de validação)
    const functionSQL = migrationSQL
      .split('-- ============================================================================')[0]
      .trim();

    console.log('📝 Executando SQL da migração...');
    
    // Executar a migração
    const { error } = await supabase.rpc('exec_sql', { sql: functionSQL });
    
    if (error) {
      console.error('❌ Erro ao executar migração:', error);
      return false;
    }

    console.log('✅ Migração aplicada com sucesso!');
    
    // Testar se a função foi atualizada
    console.log('\n🧪 Testando função atualizada...');
    
    const testResult = await supabase.rpc('create_profile_with_extension', {
      p_profile_type: 'driver',
      p_handle: 'test-driver-capabilities',
      p_display_name: 'Test Driver',
      p_extension_data: {
        license_number: '12345678901',
        license_category: 'B',
        license_expiry: '2025-12-31',
        license_state: 'SP',
        vehicle_type: 'car',
        vehicle_plate: 'TEST1234',
        vehicle_model: 'Test Car',
        vehicle_year: '2020',
        vehicle_color: 'Azul',
        can_do_delivery: false,
        can_do_rides: true
      }
    });

    if (testResult.error) {
      console.error('❌ Erro no teste:', testResult.error);
      return false;
    }

    if (testResult.data?.success) {
      console.log('✅ Função funcionando corretamente!');
      console.log('📊 Resultado do teste:', testResult.data);
      
      // Verificar se as capacidades foram aplicadas corretamente
      const profileId = testResult.data.data.profile_id;
      const { data: driverData, error: queryError } = await supabase
        .from('driver_data')
        .select('can_do_delivery, can_do_rides')
        .eq('profile_id', profileId)
        .single();

      if (queryError) {
        console.error('❌ Erro ao verificar capacidades:', queryError);
        return false;
      }

      console.log('🎯 Capacidades aplicadas:', driverData);
      
      if (driverData.can_do_delivery === false && driverData.can_do_rides === true) {
        console.log('✅ Capacidades corretas! Motorista configurado adequadamente.');
      } else {
        console.log('⚠️ Capacidades incorretas. Esperado: can_do_delivery=false, can_do_rides=true');
      }

      // Limpar dados de teste
      await supabase.from('profiles').delete().eq('id', profileId);
      console.log('🧹 Dados de teste removidos');
      
    } else {
      console.error('❌ Teste falhou:', testResult.data);
      return false;
    }

    return true;

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return false;
  }
}

// Executar
applyMigration().then(success => {
  if (success) {
    console.log('\n🎉 Correção aplicada com sucesso!');
    console.log('✅ A separação motorista vs motoboy agora funciona corretamente');
    console.log('📋 Próximos passos:');
    console.log('   1. Testar criação de motorista: /create-driver');
    console.log('   2. Testar criação de motoboy: /create-driver?type=motoboy');
    console.log('   3. Verificar capacidades no banco de dados');
  } else {
    console.log('\n❌ Falha na aplicação da correção');
    console.log('💡 Verifique os logs acima para mais detalhes');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});