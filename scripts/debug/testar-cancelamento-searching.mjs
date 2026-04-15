#!/usr/bin/env node

/**
 * Script para testar cancelamento de corrida no estado searching_driver
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Testando cancelamento de corrida em searching_driver\n');

// 1. Buscar corridas em searching_driver
console.log('1️⃣  Buscando corridas em searching_driver...');
const { data: rides, error: fetchError } = await supabase
  .from('ride_requests')
  .select('*')
  .eq('status', 'searching_driver')
  .order('created_at', { ascending: false })
  .limit(5);

if (fetchError) {
  console.error('❌ Erro ao buscar corridas:', fetchError);
  process.exit(1);
}

if (!rides || rides.length === 0) {
  console.log('⚠️  Nenhuma corrida em searching_driver encontrada');
  console.log('   Criando uma corrida de teste...\n');
  
  // Criar uma corrida de teste
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
    .single();
  
  if (!profile) {
    console.error('❌ Nenhum perfil encontrado');
    process.exit(1);
  }
  
  const { data: newRide, error: createError } = await supabase
    .from('ride_requests')
    .insert({
      passenger_profile_id: profile.id,
      pickup_location_id: null,
      dropoff_location_id: null,
      status: 'searching_driver',
      suggested_price: 15.00,
      ride_type: 'ride'
    })
    .select()
    .single();
  
  if (createError) {
    console.error('❌ Erro ao criar corrida:', createError);
    process.exit(1);
  }
  
  console.log('✅ Corrida de teste criada:', newRide.id);
  rides.push(newRide);
}

console.log(`✅ ${rides.length} corrida(s) encontrada(s)\n`);

// 2. Testar cancelamento da primeira corrida
const ride = rides[0];
console.log('2️⃣  Testando cancelamento da corrida:', ride.id);
console.log('   Status atual:', ride.status);
console.log('   Passageiro:', ride.passenger_profile_id);

// Verificar se o estado é cancelável
const CANCELLABLE_STATES = [
  'requested',
  'searching_driver',
  'driver_assigned',
  'driver_accepted',
  'driver_arriving',
  'passenger_boarded',
  'pickup_confirmed'
];

const isCancellable = CANCELLABLE_STATES.includes(ride.status);
console.log('   É cancelável?', isCancellable ? '✅ SIM' : '❌ NÃO');

// Verificar se passageiro pode cancelar
const PASSENGER_BLOCKED_STATES = [
  'passenger_boarded',
  'in_progress',
  'pickup_confirmed',
  'in_delivery'
];

const canPassengerCancel = isCancellable && !PASSENGER_BLOCKED_STATES.includes(ride.status);
console.log('   Passageiro pode cancelar?', canPassengerCancel ? '✅ SIM' : '❌ NÃO\n');

if (!canPassengerCancel) {
  console.log('❌ Passageiro NÃO pode cancelar neste estado');
  console.log('   Motivo: Estado bloqueado para passageiro');
  process.exit(0);
}

// 3. Tentar cancelar
console.log('3️⃣  Tentando cancelar...');
const { data: cancelResult, error: cancelError } = await supabase
  .from('ride_requests')
  .update({
    status: 'cancelled_by_passenger',
    updated_at: new Date().toISOString()
  })
  .eq('id', ride.id)
  .eq('status', 'searching_driver') // Optimistic locking
  .select()
  .single();

if (cancelError) {
  console.error('❌ Erro ao cancelar:', cancelError);
  process.exit(1);
}

if (!cancelResult) {
  console.log('⚠️  Cancelamento falhou - possível race condition');
  console.log('   A corrida pode ter mudado de estado durante o cancelamento');
  process.exit(0);
}

console.log('✅ Corrida cancelada com sucesso!');
console.log('   Novo status:', cancelResult.status);
console.log('   ID:', cancelResult.id);

console.log('\n✅ Teste concluído com sucesso!');
