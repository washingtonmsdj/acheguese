#!/usr/bin/env tsx
/**
 * Script para deletar empresas de gastronomia MOCK (dados de teste)
 * Identifica empresas com profile_id começando com 'a' e remove
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente do .env.remote
dotenv.config({ path: resolve(__dirname, '.env.remote') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🗑️  Deletando empresas de gastronomia MOCK...\n');

  // Profile IDs de mock data (começam com 'a')
  const mockProfileIds = [
    'a1111111-1111-1111-1111-111111111111',
    'a3333333-3333-3333-3333-333333333333',
    'a4444444-4444-4444-4444-444444444444',
    'a5555555-5555-5555-5555-555555555555',
  ];

  console.log('📋 Profile IDs a serem removidos:');
  mockProfileIds.forEach(id => console.log(`   - ${id}`));
  console.log('');

  // Buscar business_ids correspondentes
  const { data: businesses, error: businessError } = await supabase
    .from('business_data')
    .select('id, profile_id, business_name, slug')
    .in('profile_id', mockProfileIds);

  if (businessError) {
    console.error('❌ Erro ao buscar business_data:', businessError);
    process.exit(1);
  }

  if (!businesses || businesses.length === 0) {
    console.log('✅ Nenhuma empresa mock encontrada. Banco já está limpo!');
    return;
  }

  console.log(`📊 Encontradas ${businesses.length} empresas mock:\n`);
  businesses.forEach(b => {
    console.log(`   - ${b.business_name} (${b.slug})`);
    console.log(`     Business ID: ${b.id}`);
    console.log(`     Profile ID: ${b.profile_id}`);
    console.log('');
  });

  const businessIds = businesses.map(b => b.id);

  // ============================================================================
  // PASSO 1: Deletar gastronomy_profiles
  // ============================================================================
  console.log('🗑️  PASSO 1: Deletando gastronomy_profiles...');
  
  const { error: gastroError } = await supabase
    .from('gastronomy_profiles')
    .delete()
    .in('business_id', businessIds);

  if (gastroError) {
    console.error('❌ Erro ao deletar gastronomy_profiles:', gastroError);
    process.exit(1);
  }
  console.log('✅ gastronomy_profiles deletados\n');

  // ============================================================================
  // PASSO 2: Deletar business_data
  // ============================================================================
  console.log('🗑️  PASSO 2: Deletando business_data...');
  
  const { error: businessDeleteError } = await supabase
    .from('business_data')
    .delete()
    .in('profile_id', mockProfileIds);

  if (businessDeleteError) {
    console.error('❌ Erro ao deletar business_data:', businessDeleteError);
    process.exit(1);
  }
  console.log('✅ business_data deletados\n');

  // ============================================================================
  // PASSO 3: Deletar addresses (se existirem)
  // ============================================================================
  console.log('🗑️  PASSO 3: Deletando addresses associados...');
  
  // Buscar address_ids das empresas deletadas
  const addressIds = [
    'e1111111-1111-1111-1111-111111111111',
    'e3333333-3333-3333-3333-333333333333',
    'e4444444-4444-4444-4444-444444444444',
    'e5555555-5555-5555-5555-555555555555',
  ];

  const { error: addressError } = await supabase
    .from('addresses')
    .delete()
    .in('id', addressIds);

  if (addressError) {
    console.warn('⚠️  Aviso ao deletar addresses:', addressError.message);
  } else {
    console.log('✅ addresses deletados\n');
  }

  // ============================================================================
  // PASSO 4: Deletar profiles
  // ============================================================================
  console.log('🗑️  PASSO 4: Deletando profiles...');
  
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .in('id', mockProfileIds);

  if (profileError) {
    console.error('❌ Erro ao deletar profiles:', profileError);
    process.exit(1);
  }
  console.log('✅ profiles deletados\n');

  // ============================================================================
  // VALIDAÇÃO FINAL
  // ============================================================================
  console.log('✅ VALIDAÇÃO: Verificando se as empresas foram removidas...\n');

  const { data: remaining, error: validationError } = await supabase
    .from('business_data')
    .select('id, business_name, slug')
    .in('profile_id', mockProfileIds);

  if (validationError) {
    console.error('❌ Erro na validação:', validationError);
    process.exit(1);
  }

  if (remaining && remaining.length > 0) {
    console.log('⚠️  ATENÇÃO: Ainda existem empresas mock no banco:');
    remaining.forEach(b => console.log(`   - ${b.business_name}`));
  } else {
    console.log('🎉 SUCESSO! Todas as empresas mock foram removidas!');
    console.log('✅ O banco agora contém apenas dados reais de gastronomia');
  }
}

main().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
