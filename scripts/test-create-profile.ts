#!/usr/bin/env tsx

/**
 * TESTE RÁPIDO - CRIAR PERFIL
 * Testa a criação de um perfil personal via RPC
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreateProfile() {
  console.log('🧪 TESTE: Criar perfil via RPC\n');

  // Tentar criar perfil sem autenticação (deve falhar)
  console.log('1. Testando sem autenticação...');
  const { data, error } = await supabase.rpc('create_profile_with_extension', {
    p_profile_type: 'personal',
    p_handle: 'test-user-' + Date.now(),
    p_display_name: 'Test User',
    p_extension_data: {}
  });

  if (error) {
    if (error.message.includes('not authenticated') || error.message.includes('permission denied')) {
      console.log('✅ RPC protegida corretamente (requer autenticação)');
      console.log(`   Erro: ${error.message}\n`);
    } else {
      console.log(`⚠️  Erro inesperado: ${error.message}\n`);
    }
  } else {
    console.log('❌ RPC executou sem autenticação (problema de segurança!)');
    console.log(`   Dados: ${JSON.stringify(data)}\n`);
  }

  // Verificar views públicas
  console.log('2. Testando views públicas...');
  const { data: profiles, error: viewError } = await supabase
    .from('public_profiles')
    .select('*')
    .limit(5);

  if (viewError) {
    console.log(`❌ Erro ao acessar public_profiles: ${viewError.message}`);
  } else {
    console.log(`✅ public_profiles acessível (${profiles?.length || 0} perfis encontrados)`);
    if (profiles && profiles.length > 0) {
      console.log(`   Exemplo: @${profiles[0].handle} (${profiles[0].profile_type})`);
    }
  }

  console.log('\n✅ TESTE CONCLUÍDO');
}

testCreateProfile().catch(console.error);

