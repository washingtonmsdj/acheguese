#!/usr/bin/env node
/**
 * Seed de dados mínimos para validação de produto da Fase 1 IA Transversal
 * 
 * Cria:
 * - 1 empresa comum
 * - 1 empresa premium
 * - 1 empresa gastronômica ativa/principal
 * - 1 profissional eletricista
 * - 1 profissional encanador
 * 
 * Todos na Pituba com coordenadas válidas
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.error('URL:', supabaseUrl ? 'OK' : 'MISSING');
  console.error('KEY:', supabaseKey ? 'OK' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Location ID da Pituba
const PITUBA_LOCATION_ID = '384add59-4e53-489d-a7b5-97dea2b3f442';

// Coordenadas da Pituba (centro aproximado)
const PITUBA_COORDS = {
  latitude: -12.9977,
  longitude: -38.4502,
};

async function createTestBusiness(data) {
  const { data: business, error } = await supabase
    .from('businesses')
    .insert({
      name: data.name,
      slug: data.slug,
      description: data.description,
      category: data.category,
      location_id: PITUBA_LOCATION_ID,
      latitude: PITUBA_COORDS.latitude + (Math.random() - 0.5) * 0.01, // Variação pequena
      longitude: PITUBA_COORDS.longitude + (Math.random() - 0.5) * 0.01,
      status: 'active',
      phone: '(71) 3333-4444',
      email: `${data.slug}@test.com`,
      is_premium: data.isPremium || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error(`❌ Erro ao criar empresa ${data.name}:`, error.message);
    return null;
  }

  console.log(`✅ Empresa criada: ${business.name} (${business.slug})`);
  return business;
}

async function createGastronomyProfile(businessId, data) {
  const { data: profile, error } = await supabase
    .from('gastronomy_profiles')
    .insert({
      business_id: businessId,
      cuisine_types: data.cuisineTypes,
      price_range: data.priceRange,
      accepts_reservations: true,
      has_delivery: data.hasDelivery || false,
      is_active: true,
      is_primary_vertical: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error(`❌ Erro ao criar perfil gastronômico:`, error.message);
    return null;
  }

  console.log(`✅ Perfil gastronômico criado para business ${businessId}`);
  return profile;
}

async function createTestProfessional(data) {
  // Primeiro, criar um profile (usuário)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: data.profileId,
      full_name: data.name,
      username: data.slug,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (profileError && profileError.code !== '23505') { // Ignora erro de duplicata
    console.error(`❌ Erro ao criar profile ${data.name}:`, profileError.message);
    return null;
  }

  // Criar professional_data
  const { data: professional, error } = await supabase
    .from('professional_data')
    .insert({
      profile_id: data.profileId,
      professional_name: data.name,
      slug: data.slug,
      category: data.category,
      location_id: PITUBA_LOCATION_ID,
      is_accepting_clients: true,
      phone: '(71) 9999-8888',
      metadata: {
        latitude: PITUBA_COORDS.latitude + (Math.random() - 0.5) * 0.01,
        longitude: PITUBA_COORDS.longitude + (Math.random() - 0.5) * 0.01,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error(`❌ Erro ao criar profissional ${data.name}:`, error.message);
    return null;
  }

  console.log(`✅ Profissional criado: ${professional.professional_name} (${professional.slug})`);
  return professional;
}

async function cleanupTestData() {
  console.log('\n🧹 Limpando dados de teste anteriores...\n');

  // Limpar empresas de teste
  const testBusinessSlugs = [
    'mercadinho-pituba-test',
    'consultoria-premium-test',
    'pizzaria-bella-test',
  ];

  for (const slug of testBusinessSlugs) {
    await supabase.from('businesses').delete().eq('slug', slug);
  }

  // Limpar profissionais de teste
  const testProfessionalSlugs = [
    'eletricista-joao-test',
    'encanador-carlos-test',
  ];

  for (const slug of testProfessionalSlugs) {
    await supabase.from('professional_data').delete().eq('slug', slug);
  }

  console.log('✅ Limpeza concluída\n');
}

async function main() {
  console.log('🌱 Seed de dados para validação Fase 1 IA Transversal\n');
  console.log(`📍 Location: Pituba (${PITUBA_LOCATION_ID})`);
  console.log(`📍 Coordenadas: ${PITUBA_COORDS.latitude}, ${PITUBA_COORDS.longitude}\n`);

  // Limpar dados anteriores
  await cleanupTestData();

  console.log('📦 Criando dados de teste...\n');

  // 1. Empresa comum
  const commonBusiness = await createTestBusiness({
    name: 'Mercadinho da Pituba',
    slug: 'mercadinho-pituba-test',
    description: 'Mercadinho de bairro com produtos variados',
    category: 'Comércio',
    isPremium: false,
  });

  // 2. Empresa premium
  const premiumBusiness = await createTestBusiness({
    name: 'Consultoria Premium Salvador',
    slug: 'consultoria-premium-test',
    description: 'Consultoria empresarial de alto nível',
    category: 'Serviços',
    isPremium: true,
  });

  // 3. Empresa gastronômica
  const gastroBusiness = await createTestBusiness({
    name: 'Pizzaria Bella Napoli',
    slug: 'pizzaria-bella-test',
    description: 'Pizzaria artesanal com delivery',
    category: 'Gastronomia',
    isPremium: false,
  });

  if (gastroBusiness) {
    await createGastronomyProfile(gastroBusiness.id, {
      cuisineTypes: ['Italiana', 'Pizza'],
      priceRange: 'moderate',
      hasDelivery: true,
    });
  }

  // 4. Profissional eletricista
  await createTestProfessional({
    profileId: '00000000-0000-0000-0000-000000000001',
    name: 'João Silva - Eletricista',
    slug: 'eletricista-joao-test',
    category: 'Eletricista',
  });

  // 5. Profissional encanador
  await createTestProfessional({
    profileId: '00000000-0000-0000-0000-000000000002',
    name: 'Carlos Santos - Encanador',
    slug: 'encanador-carlos-test',
    category: 'Encanador',
  });

  console.log('\n✅ Seed concluído com sucesso!\n');
  console.log('📊 Resumo:');
  console.log('   - 3 empresas criadas (1 comum, 1 premium, 1 gastronômica)');
  console.log('   - 2 profissionais criados (1 eletricista, 1 encanador)');
  console.log('   - Todos com location_id da Pituba');
  console.log('   - Todos com coordenadas válidas');
  console.log('   - Todos com status ativo\n');
}

main().catch(console.error);
