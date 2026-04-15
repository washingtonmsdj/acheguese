#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.remote' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL?.trim(),
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
);

async function run() {
  // Buscar última corrida com join em addresses
  const { data: ride, error: rideError } = await supabase
    .from('ride_requests')
    .select('id, pickup_address_id, dropoff_address_id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (rideError) { console.error(rideError.message); return; }
  console.log('Corrida:', ride.id);

  // Buscar address de pickup
  const { data: pickup } = await supabase
    .from('addresses')
    .select('*')
    .eq('id', ride.pickup_address_id)
    .single();

  console.log('\n📍 PICKUP ADDRESS:');
  console.log(JSON.stringify(pickup, null, 2));

  const { data: dropoff } = await supabase
    .from('addresses')
    .select('*')
    .eq('id', ride.dropoff_address_id)
    .single();

  console.log('\n📍 DROPOFF ADDRESS:');
  console.log(JSON.stringify(dropoff, null, 2));
}

run().catch(console.error);
