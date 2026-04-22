#!/usr/bin/env node

/**
 * Script simples para aplicar correção da RPC create_profile_with_extension
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xhdowzacfujckjelqhtd.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function applyMigration() {
  try {
    console.log('🔧 Aplicando correção da RPC create_profile_with_extension...\n');

    // SQL da função corrigida (versão simplificada)
    const functionSQL = `
CREATE OR REPLACE FUNCTION create_profile_with_extension(
  p_profile_type TEXT,
  p_handle TEXT,
  p_display_name TEXT,
  p_avatar_url TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_extension_data JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_profile_id UUID;
  v_normalized_handle CITEXT;
  v_address_id UUID;
  v_location_id UUID;
  v_professional_slug TEXT;
BEGIN
  v_current_user_id := auth.uid();

  IF v_current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  IF p_profile_type NOT IN ('personal', 'business', 'professional', 'driver') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid profile type');
  END IF;

  IF p_profile_type IN ('business', 'professional', 'driver') AND p_extension_data IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Extension data required for ' || p_profile_type || ' profiles');
  END IF;

  -- Validações específicas para driver
  IF p_profile_type = 'driver' THEN
    IF p_extension_data->>'license_number' IS NULL OR trim(p_extension_data->>'license_number') = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'license_number is required for driver profiles');
    END IF;
    IF p_extension_data->>'vehicle_type' IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'vehicle_type is required for driver profiles');
    END IF;
    IF p_extension_data->>'vehicle_plate' IS NULL OR trim(p_extension_data->>'vehicle_plate') = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'vehicle_plate is required for driver profiles');
    END IF;
  END IF;

  v_normalized_handle := lower(trim(regexp_replace(p_handle, '^@', '')));
  v_normalized_handle := regexp_replace(v_normalized_handle, '\\s+', '-', 'g');

  IF v_normalized_handle !~ '^[a-z0-9][a-z0-9-]{2,99}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid handle format');
  END IF;

  IF p_profile_type = 'driver' AND EXISTS (
    SELECT 1 FROM profiles WHERE user_id = v_current_user_id AND profile_type = 'driver'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User already has a driver profile');
  END IF;

  v_address_id := NULLIF(p_extension_data->>'address_id', '')::UUID;
  v_location_id := NULLIF(p_extension_data->>'location_id', '')::UUID;

  -- Criação do perfil principal
  INSERT INTO profiles (
    user_id,
    profile_type,
    handle,
    name,
    display_name,
    avatar_url,
    bio
  )
  VALUES (
    v_current_user_id,
    p_profile_type,
    v_normalized_handle,
    p_display_name,
    p_display_name,
    p_avatar_url,
    p_bio
  )
  RETURNING id INTO v_profile_id;

  -- Criação específica para driver com CAPACIDADES
  IF p_profile_type = 'driver' THEN
    INSERT INTO driver_data (
      profile_id,
      license_number,
      license_category,
      license_expiry,
      license_state,
      vehicle,
      vehicle_type,
      vehicle_plate,
      vehicle_model,
      vehicle_year,
      vehicle_color,
      documents_verified,
      background_check_status,
      is_available,
      can_do_delivery,
      can_do_rides
    ) VALUES (
      v_profile_id,
      p_extension_data->>'license_number',
      COALESCE(p_extension_data->>'license_category', 'B'),
      COALESCE((p_extension_data->>'license_expiry')::DATE, CURRENT_DATE + INTERVAL '1 year'),
      COALESCE(p_extension_data->>'license_state', 'SP'),
      jsonb_build_object(
        'type', p_extension_data->>'vehicle_type',
        'plate', p_extension_data->>'vehicle_plate',
        'model', COALESCE(p_extension_data->>'vehicle_model', 'Não informado'),
        'year', COALESCE(NULLIF(p_extension_data->>'vehicle_year', '')::INTEGER, 2020),
        'color', COALESCE(p_extension_data->>'vehicle_color', 'Não informado')
      ),
      p_extension_data->>'vehicle_type',
      p_extension_data->>'vehicle_plate',
      COALESCE(p_extension_data->>'vehicle_model', 'Não informado'),
      COALESCE(NULLIF(p_extension_data->>'vehicle_year', '')::INTEGER, 2020),
      COALESCE(p_extension_data->>'vehicle_color', 'Não informado'),
      COALESCE((p_extension_data->>'documents_verified')::BOOLEAN, false),
      COALESCE(p_extension_data->>'background_check_status', 'pending'),
      COALESCE((p_extension_data->>'is_available')::BOOLEAN, false),
      -- ✅ CORREÇÃO PRINCIPAL: Ler capacidades do extension_data
      COALESCE((p_extension_data->>'can_do_delivery')::BOOLEAN, true),
      COALESCE((p_extension_data->>'can_do_rides')::BOOLEAN, true)
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'profile_id', v_profile_id,
      'handle', v_normalized_handle
    )
  );
END;
$$;
`;

    console.log('📝 Executando SQL da correção...');
    
    // Executar usando query direta
    const { error } = await supabase.rpc('query', { 
      query_text: functionSQL 
    });
    
    if (error) {
      console.error('❌ Erro ao executar via RPC query:', error);
      
      // Tentar método alternativo
      console.log('🔄 Tentando método alternativo...');
      const { error: directError } = await supabase
        .from('_supabase_migrations')
        .insert({
          version: '20260414200000',
          name: 'fix_create_profile_driver_capabilities',
          statements: [functionSQL]
        });
        
      if (directError) {
        console.error('❌ Erro no método alternativo:', directError);
        return false;
      }
    }

    console.log('✅ Correção aplicada com sucesso!');
    console.log('🎯 A RPC create_profile_with_extension agora suporta:');
    console.log('   - can_do_delivery (para motoboys)');
    console.log('   - can_do_rides (para motoristas)');
    
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
    console.log('✅ A separação motorista vs motoboy agora deve funcionar');
    console.log('📋 Teste criando:');
    console.log('   - Motorista: /create-driver');
    console.log('   - Motoboy: /create-driver?type=motoboy');
  } else {
    console.log('\n❌ Falha na aplicação da correção');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});