#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

// Login
const { data: authData } = await supabase.auth.signInWithPassword({
  email: 'passageiro@staging.local',
  password: 'Pass123!@#'
});

console.log('User:', authData.user.id);

// Tentar criar regra
const { data, error } = await supabase
  .from('pricing_rules')
  .insert({
    mode: 'ride',
    name: 'Teste RLS',
    base_fare: 5.00,
    price_per_km: 2.00,
    price_per_minute: 0.50,
    minimum_fare: 10.00,
    is_active: false
  })
  .select()
  .single();

if (error) {
  console.log('✅ BLOQUEADO:', error.message);
} else {
  console.log('❌ PERMITIDO:', data.id);
  
  // Limpar
  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  await supabaseAdmin.from('pricing_rules').delete().eq('id', data.id);
}
