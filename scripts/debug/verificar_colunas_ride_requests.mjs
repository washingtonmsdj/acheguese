#!/usr/bin/env node

/**
 * VERIFICAR COLUNAS - ride_requests
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.remote' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL?.trim(),
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
);

async function verificar() {
  console.log('🔍 VERIFICANDO COLUNAS - ride_requests\n');

  // Buscar estrutura da tabela
  const { data, error } = await supabase
    .from('ride_requests')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Erro ao buscar tabela:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  Tabela vazia, criando registro de teste...');
    
    // Criar registro de teste para ver estrutura
    const { data: testData, error: insertError } = await supabase
      .from('ride_requests')
      .insert({
        passenger_profile_id: '00000000-0000-0000-0000-000000000000',
        status: 'requested',
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao criar teste:', insertError.message);
      return;
    }

    console.log('✅ Colunas disponíveis:');
    Object.keys(testData).sort().forEach(col => {
      console.log(`   - ${col}`);
    });

    // Limpar teste
    await supabase
      .from('ride_requests')
      .delete()
      .eq('id', testData.id);

    return;
  }

  console.log('✅ Colunas disponíveis:');
  Object.keys(data[0]).sort().forEach(col => {
    console.log(`   - ${col}`);
  });

  // Verificar colunas específicas
  const requiredCols = [
    'origin',
    'destination',
    'origin_lat',
    'origin_lng',
    'destination_lat',
    'destination_lng',
    'suggested_price',
    'observation',
    'driver_assigned_at',
    'driver_accepted_at',
    'passenger_boarded_at',
    'started_at',
    'completed_at',
    'cancelled_at',
  ];

  console.log('\n📋 Verificando colunas necessárias:');
  requiredCols.forEach(col => {
    const exists = col in data[0];
    console.log(`   ${exists ? '✅' : '❌'} ${col}`);
  });
}

verificar().catch(console.error);
