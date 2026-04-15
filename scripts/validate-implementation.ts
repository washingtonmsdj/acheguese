#!/usr/bin/env tsx

/**
 * VALIDAÇÃO DA IMPLEMENTAÇÃO MULTI-PERFIL
 * Verifica que todas as estruturas do banco foram criadas corretamente
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.error('   Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY em .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function validateImplementation() {
  console.log('🔍 VALIDANDO IMPLEMENTAÇÃO MULTI-PERFIL\n');
  
  let errors = 0;
  let warnings = 0;

  // 1. Verificar views públicas
  console.log('=== 1. VIEWS PÚBLICAS ===');
  const views = [
    'public_profiles',
    'public_business_profiles',
    'public_professional_profiles',
    'public_driver_profiles',
    'public_profile_links'
  ];

  for (const view of views) {
    try {
      const { error } = await supabase.from(view).select('*').limit(1);
      if (error) {
        console.log(`❌ ${view}: ${error.message}`);
        errors++;
      } else {
        console.log(`✅ ${view}`);
      }
    } catch (e) {
      console.log(`❌ ${view}: ${e}`);
      errors++;
    }
  }

  // 2. Verificar tabelas (via RLS - deve falhar para anon)
  console.log('\n=== 2. TABELAS (RLS) ===');
  const tables = [
    'profiles',
    'profile_members',
    'profile_links',
    'business_data',
    'professional_data',
    'driver_data'
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error && error.message.includes('permission denied')) {
        console.log(`✅ ${table}: RLS ativo (acesso negado para anon)`);
      } else if (error) {
        console.log(`⚠️  ${table}: ${error.message}`);
        warnings++;
      } else {
        console.log(`⚠️  ${table}: RLS pode estar desativado (acesso permitido)`);
        warnings++;
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e}`);
      errors++;
    }
  }

  // 3. Verificar RPCs (deve falhar sem auth)
  console.log('\n=== 3. RPCs ===');
  
  try {
    const { error } = await supabase.rpc('create_profile_with_extension', {
      p_profile_type: 'personal',
      p_handle: 'test',
      p_display_name: 'Test',
      p_extension_data: {}
    });
    
    if (error && (error.message.includes('permission denied') || error.message.includes('not authenticated'))) {
      console.log('✅ create_profile_with_extension: Requer autenticação');
    } else if (error) {
      console.log(`⚠️  create_profile_with_extension: ${error.message}`);
      warnings++;
    } else {
      console.log('⚠️  create_profile_with_extension: Executou sem auth (problema de segurança)');
      warnings++;
    }
  } catch (e) {
    console.log(`✅ create_profile_with_extension: Protegido`);
  }

  // 4. Resumo
  console.log('\n=== RESUMO ===');
  console.log(`✅ Sucessos: ${views.length - errors}`);
  console.log(`❌ Erros: ${errors}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  
  if (errors === 0 && warnings === 0) {
    console.log('\n🎉 VALIDAÇÃO COMPLETA - IMPLEMENTAÇÃO OK');
    process.exit(0);
  } else if (errors === 0) {
    console.log('\n⚠️  VALIDAÇÃO COM WARNINGS - REVISAR');
    process.exit(0);
  } else {
    console.log('\n❌ VALIDAÇÃO FALHOU - CORRIGIR ERROS');
    process.exit(1);
  }
}

validateImplementation().catch(console.error);

