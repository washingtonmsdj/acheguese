#!/usr/bin/env tsx

/**
 * Validates the multi-profile database implementation using the public
 * Supabase client. This script should not require service_role.
 */

import { createAnonClient } from './supabase-client';

const supabase = createAnonClient();

async function validateImplementation() {
  console.log('VALIDANDO IMPLEMENTACAO MULTI-PERFIL\n');

  let errors = 0;
  let warnings = 0;

  console.log('=== 1. VIEWS PUBLICAS ===');
  const views = [
    'public_profiles',
    'public_business_profiles',
    'public_professional_profiles',
    'public_driver_profiles',
    'public_profile_links',
  ];

  for (const view of views) {
    try {
      const { error } = await supabase.from(view).select('*').limit(1);
      if (error) {
        console.log(`ERRO ${view}: ${error.message}`);
        errors++;
      } else {
        console.log(`OK ${view}`);
      }
    } catch (error) {
      console.log(`ERRO ${view}: ${error}`);
      errors++;
    }
  }

  console.log('\n=== 2. TABELAS (RLS) ===');
  const tables = [
    'profiles',
    'profile_members',
    'profile_links',
    'business_data',
    'professional_data',
    'driver_data',
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error && error.message.includes('permission denied')) {
        console.log(`OK ${table}: RLS ativo (acesso negado para anon)`);
      } else if (error) {
        console.log(`WARN ${table}: ${error.message}`);
        warnings++;
      } else {
        console.log(`WARN ${table}: RLS pode estar desativado (acesso permitido)`);
        warnings++;
      }
    } catch (error) {
      console.log(`ERRO ${table}: ${error}`);
      errors++;
    }
  }

  console.log('\n=== 3. RPCs ===');

  try {
    const { error } = await supabase.rpc('create_profile_with_extension', {
      p_profile_type: 'personal',
      p_handle: 'test',
      p_display_name: 'Test',
      p_extension_data: {},
    });

    if (error && (error.message.includes('permission denied') || error.message.includes('not authenticated'))) {
      console.log('OK create_profile_with_extension: requer autenticacao');
    } else if (error) {
      console.log(`WARN create_profile_with_extension: ${error.message}`);
      warnings++;
    } else {
      console.log('WARN create_profile_with_extension: executou sem auth');
      warnings++;
    }
  } catch {
    console.log('OK create_profile_with_extension: protegido');
  }

  console.log('\n=== RESUMO ===');
  console.log(`Erros: ${errors}`);
  console.log(`Warnings: ${warnings}`);

  if (errors === 0 && warnings === 0) {
    console.log('\nVALIDACAO COMPLETA - IMPLEMENTACAO OK');
    process.exit(0);
  }

  if (errors === 0) {
    console.log('\nVALIDACAO COM WARNINGS - REVISAR');
    process.exit(0);
  }

  console.log('\nVALIDACAO FALHOU - CORRIGIR ERROS');
  process.exit(1);
}

validateImplementation().catch((error) => {
  console.error(error);
  process.exit(1);
});