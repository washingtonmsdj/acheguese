#!/usr/bin/env tsx

/**
 * Validates the multi-profile database implementation using the public
 * Supabase client. This script should not require service_role.
 */

import { createAnonClient } from './supabase-client';

const supabase = createAnonClient();

async function expectProtectedRpc(
  name: string,
  params: Record<string, unknown>,
): Promise<'ok' | 'warning'> {
  try {
    const { error } = await supabase.rpc(name, params);
    if (error && (
      error.message.includes('permission denied') ||
      error.message.includes('not authenticated') ||
      error.message.includes('Could not find the function')
    )) {
      console.log(`OK ${name}: inacessivel para anon`);
      return 'ok';
    }
    if (error) {
      console.log(`WARN ${name}: ${error.message}`);
      return 'warning';
    }
    console.log(`WARN ${name}: executou sem auth`);
    return 'warning';
  } catch {
    console.log(`OK ${name}: protegido`);
    return 'ok';
  }
}

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

  console.log('\n=== 3. RPCs DE DOMINIO ===');
  const protectedRpcs: Array<[string, Record<string, unknown>]> = [
    [
      'profile_rpc_create_personal',
      {
        p_actor_user_id: '00000000-0000-4000-8000-000000000000',
        p_username: 'anon_probe',
        p_display_name: 'Anon Probe',
        p_avatar_url: null,
        p_bio: null,
        p_patch: { city: 'Salvador' },
      },
    ],
    [
      'mobility_rpc_create_driver_profile',
      {
        p_actor_user_id: '00000000-0000-4000-8000-000000000000',
        p_handle: 'anon-probe-driver',
        p_display_name: 'Anon Probe Driver',
        p_avatar_url: null,
        p_bio: null,
        p_extension_data: {},
      },
    ],
  ];

  for (const [name, params] of protectedRpcs) {
    if (await expectProtectedRpc(name, params) === 'warning') warnings++;
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
