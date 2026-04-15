/**
 * Script: setup-motoboy-test-data
 * 
 * Cria dados de teste seguros para validação do motoboy.
 * Uso: npx tsx scripts/dev/setup-motoboy-test-data.ts
 * 
 * IMPORTANTE: Apenas para ambiente dev/test
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// IDs fixos para testes (UUIDs válidos)
const TEST_IDS = {
  passenger: '00000000-0000-0000-0000-000000000001',
  motoboy: '00000000-0000-0000-0000-000000000002',
  driver: '00000000-0000-0000-0000-000000000003',
  delivery: '00000000-0000-0000-0000-000000000101',
  ride: '00000000-0000-0000-0000-000000000102',
};

async function setupTestData() {
  console.log('🚀 Iniciando setup de dados de teste para motoboy...\n');

  try {
    // Verificar se já existem dados de teste
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, profile_type')
      .in('id', [TEST_IDS.passenger, TEST_IDS.motoboy, TEST_IDS.driver]);

    if (existingProfiles && existingProfiles.length > 0) {
      console.log('⚠️  Dados de teste já existem:');
      existingProfiles.forEach(p => {
        console.log(`   - ${p.full_name} (${p.profile_type})`);
      });
      console.log('\n💡 Para recriar, delete manualmente no Supabase Dashboard');
      return;
    }

    console.log('📝 Criando perfis de teste...\n');

    // Nota: Em produção real, esses perfis seriam criados via auth.signUp
    // Aqui estamos apenas documentando a estrutura esperada
    
    console.log('✅ Estrutura de dados de teste documentada:');
    console.log('\n1. Passageiro/Empresa:');
    console.log(`   ID: ${TEST_IDS.passenger}`);
    console.log('   Nome: Test Passenger');
    console.log('   Tipo: passenger');
    
    console.log('\n2. Motoboy:');
    console.log(`   ID: ${TEST_IDS.motoboy}`);
    console.log('   Nome: Test Motoboy');
    console.log('   Tipo: driver');
    console.log('   can_do_delivery: true');
    
    console.log('\n3. Motorista:');
    console.log(`   ID: ${TEST_IDS.driver}`);
    console.log('   Nome: Test Driver');
    console.log('   Tipo: driver');
    console.log('   can_do_delivery: false');

    console.log('\n📋 Para criar esses dados:');
    console.log('1. Criar usuários via auth.signUp na aplicação');
    console.log('2. Ou executar SQL no Supabase Dashboard:');
    console.log('\n```sql');
    console.log(`-- Criar perfis de teste (ajustar IDs conforme auth)`);
    console.log(`INSERT INTO profiles (id, full_name, profile_type) VALUES`);
    console.log(`  ('${TEST_IDS.passenger}', 'Test Passenger', 'passenger'),`);
    console.log(`  ('${TEST_IDS.motoboy}', 'Test Motoboy', 'driver'),`);
    console.log(`  ('${TEST_IDS.driver}', 'Test Driver', 'driver');`);
    console.log('');
    console.log(`-- Configurar driver_data`);
    console.log(`INSERT INTO driver_data (profile_id, can_do_delivery, vehicle_type) VALUES`);
    console.log(`  ('${TEST_IDS.motoboy}', true, 'motorcycle'),`);
    console.log(`  ('${TEST_IDS.driver}', false, 'car');`);
    console.log('```\n');

    console.log('✅ Setup documentado com sucesso!');
    console.log('\n💡 Próximo passo: Acessar /dev/mobility/motoboy-validation');

  } catch (error) {
    console.error('❌ Erro ao setup:', error);
    process.exit(1);
  }
}

setupTestData();
