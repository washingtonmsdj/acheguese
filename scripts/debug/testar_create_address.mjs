#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.remote' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL?.trim(),
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
);

async function run() {
  // Pegar primeira location ativa
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name')
    .eq('status', 'active')
    .limit(1)
    .single();

  if (!locations) {
    console.error('❌ Nenhuma location ativa');
    return;
  }

  console.log('✅ Location:', locations.name, locations.id);

  // Testar criar address
  const { data: address, error } = await supabase
    .from('addresses')
    .insert({
      location_id: locations.id,
      street: 'Rua Teste, 123',
      address_type: 'approximate',
      latitude: -23.5615,
      longitude: -46.6408,
      geocoding_source: 'manual',
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Erro ao criar address:', error.message);
    console.log('   Code:', error.code);
    console.log('   Details:', error.details);
    return;
  }

  console.log('✅ Address criado:', address.id);

  // Testar INSERT em ride_requests com address
  const profileId = '0a843169-861a-4f60-bbd2-0b44b45981cf';
  const { data: ride, error: rideError } = await supabase
    .from('ride_requests')
    .insert({
      passenger_profile_id: profileId,
      pickup_address_id: address.id,
      dropoff_address_id: address.id,
      pickup_location_id: locations.id,
      dropoff_location_id: locations.id,
      status: 'requested',
      suggested_price: 15.00,
      available_seats: 1,
    })
    .select()
    .single();

  if (rideError) {
    console.error('❌ Erro ao criar ride_request:', rideError.message);
    console.log('   Code:', rideError.code);
    console.log('   Details:', rideError.details);
  } else {
    console.log('✅ ride_request criado:', ride.id);
    console.log('   Status:', ride.status);

    // Limpar
    await supabase.from('ride_requests').delete().eq('id', ride.id);
    console.log('✅ Teste limpo');
  }

  // Limpar address
  await supabase.from('addresses').delete().eq('id', address.id);
}

run().catch(console.error);
