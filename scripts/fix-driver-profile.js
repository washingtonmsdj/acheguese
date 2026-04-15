/**
 * Script para corrigir profile_type e criar driver_data
 * Executa via Node.js usando service_role key
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.remote' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const driverId = 'a1f45031-5fee-4f16-85c0-8d73356fc830';

async function main() {
  console.log('🔧 Iniciando correção do perfil do motorista...\n');

  // PASSO 1: Verificar tipo atual
  console.log('📋 PASSO 1: Verificando tipo do perfil...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, profile_type, created_at')
    .eq('id', driverId)
    .single();

  if (profileError) {
    console.error('❌ Erro ao buscar perfil:', profileError);
    process.exit(1);
  }

  console.log('   Tipo atual:', profile.profile_type);

  // PASSO 2: Corrigir para 'driver' se necessário
  if (profile.profile_type !== 'driver') {
    console.log('\n🔄 PASSO 2: Corrigindo profile_type para "driver"...');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        profile_type: 'driver',
        updated_at: new Date().toISOString(),
      })
      .eq('id', driverId);

    if (updateError) {
      console.error('❌ Erro ao atualizar perfil:', updateError);
      process.exit(1);
    }

    console.log('   ✅ profile_type atualizado para "driver"');
  } else {
    console.log('   ✅ profile_type já é "driver"');
  }

  // PASSO 3: Verificar se driver_data já existe
  console.log('\n📋 PASSO 3: Verificando driver_data...');
  const { data: existingDriverData } = await supabase
    .from('driver_data')
    .select('profile_id, can_do_delivery')
    .eq('profile_id', driverId)
    .single();

  if (existingDriverData) {
    console.log('   driver_data já existe');
    console.log('   can_do_delivery:', existingDriverData.can_do_delivery);

    if (!existingDriverData.can_do_delivery) {
      console.log('\n🔄 Atualizando can_do_delivery para true...');
      const { error: updateError } = await supabase
        .from('driver_data')
        .update({
          can_do_delivery: true,
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', driverId);

      if (updateError) {
        console.error('❌ Erro ao atualizar driver_data:', updateError);
        process.exit(1);
      }

      console.log('   ✅ can_do_delivery atualizado para true');
    } else {
      console.log('   ✅ can_do_delivery já é true');
    }
  } else {
    // PASSO 4: Criar driver_data
    console.log('\n🔄 PASSO 4: Criando driver_data...');
    const { error: insertError } = await supabase
      .from('driver_data')
      .insert({
        profile_id: driverId,
        can_do_delivery: true,
        vehicle_type: 'motorcycle',
        license_number: 'ABC123456',
        license_expiry: '2030-12-31',
        vehicle_plate: 'ABC-1234',
        vehicle_model: 'Honda CG 160',
        vehicle_year: 2023,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('❌ Erro ao criar driver_data:', insertError);
      process.exit(1);
    }

    console.log('   ✅ driver_data criado com sucesso');
  }

  // PASSO 5: Validar resultado final
  console.log('\n📋 PASSO 5: Validando resultado final...');
  
  const { data: finalProfile } = await supabase
    .from('profiles')
    .select('id, profile_type')
    .eq('id', driverId)
    .single();

  const { data: finalDriverData } = await supabase
    .from('driver_data')
    .select('profile_id, can_do_delivery, vehicle_type, vehicle_plate')
    .eq('profile_id', driverId)
    .single();

  console.log('\n✅ RESULTADO FINAL:');
  console.log('   Profile:');
  console.log('     - ID:', finalProfile.id);
  console.log('     - Tipo:', finalProfile.profile_type);
  console.log('   Driver Data:');
  console.log('     - can_do_delivery:', finalDriverData.can_do_delivery);
  console.log('     - vehicle_type:', finalDriverData.vehicle_type);
  console.log('     - vehicle_plate:', finalDriverData.vehicle_plate);

  // PASSO 6: Validar join completo
  console.log('\n📋 PASSO 6: Validando join completo (como edge function)...');
  
  const { data: joinResult, error: joinError } = await supabase
    .from('driver_availability')
    .select(`
      profile_id,
      is_online,
      is_available,
      current_lat,
      current_lng,
      profiles!inner(profile_type, rating),
      driver_data!inner(can_do_delivery, vehicle_type)
    `)
    .eq('profile_id', driverId)
    .single();

  if (joinError) {
    console.error('❌ Erro no join:', joinError);
    console.log('\n⚠️  ATENÇÃO: O join falhou. Isso pode indicar que:');
    console.log('   - driver_availability não tem registro para este motorista');
    console.log('   - Ou há problema com as foreign keys');
  } else {
    console.log('   ✅ Join completo funcionando!');
    console.log('   Resultado:', JSON.stringify(joinResult, null, 2));
  }

  console.log('\n🎉 CORREÇÃO CONCLUÍDA!');
  console.log('\n📝 PRÓXIMO PASSO:');
  console.log('   Execute os testes:');
  console.log('   npm test tests/operational/gate6-motoboy-runtime.test.ts');
}

main().catch(console.error);
