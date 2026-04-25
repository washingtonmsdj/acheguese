import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function fixSsotFinalApproach() {
  console.log('🔧 ABORDAGEM FINAL PARA CORRIGIR SSOT...');
  
  const businessId = 'cd709a71-03e0-4edb-8114-743599ac960d';
  
  // 1. Verificar todos os profiles existentes para encontrar o correto
  console.log('\n1️⃣ Buscando profile correto existente...');
  
  const { data: allProfiles, error: allProfilesError } = await supabase
    .from('profiles')
    .select('id, display_name, slug, profile_type, user_id, created_at')
    .eq('profile_type', 'business')
    .ilike('display_name', '%bella%napoli%')
    .order('created_at', { ascending: false });
  
  if (allProfilesError) {
    console.log('❌ Erro ao buscar profiles:', allProfilesError.message);
    return;
  }
  
  console.log(`Encontrados ${allProfiles?.length || 0} profiles business "Bella":`);
  allProfiles?.forEach((profile, index) => {
    console.log(`${index + 1}. ID: ${profile.id}`);
    console.log(`   - Nome: ${profile.display_name}`);
    console.log(`   - Slug: ${profile.slug}`);
    console.log(`   - User ID: ${profile.user_id}`);
    console.log(`   - Criado: ${profile.created_at}`);
  });
  
  // 2. Verificar qual profile está associado ao gastronomy_profile
  console.log('\n2️⃣ Verificando profile do gastronomy...');
  
  const { data: gastroProfile } = await supabase
    .from('gastronomy_profiles')
    .select('id, business_id')
    .eq('business_id', businessId)
    .single();
  
  if (!gastroProfile) {
    console.log('❌ Gastronomy profile não encontrado');
    return;
  }
  
  console.log(`Gastronomy Profile ID: ${gastroProfile.id}`);
  
  // 3. Verificar se há um profile com ID igual ao gastronomy_profile
  const { data: matchingProfile } = await supabase
    .from('profiles')
    .select('id, display_name, slug, user_id')
    .eq('id', gastroProfile.id)
    .single();
  
  if (matchingProfile) {
    console.log('✅ Profile encontrado com ID igual ao gastronomy_profile!');
    console.log(`   - ID: ${matchingProfile.id}`);
    console.log(`   - Nome: ${matchingProfile.display_name}`);
    
    // 4. Corrigir business_data.profile_id
    console.log('\n3️⃣ Corrigindo business_data.profile_id...');
    
    const { error: updateError } = await supabase
      .from('business_data')
      .update({ 
        profile_id: matchingProfile.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', businessId);
    
    if (updateError) {
      console.log('❌ Erro ao corrigir profile_id:', updateError.message);
      return;
    }
    
    console.log('✅ business_data.profile_id corrigido');
    
  } else {
    console.log('❌ Nenhum profile com ID igual ao gastronomy_profile');
    
    // Usar o primeiro profile existente
    if (allProfiles && allProfiles.length > 0) {
      const firstProfile = allProfiles[0];
      console.log(`\nUsando profile existente: ${firstProfile.id}`);
      
      const { error: updateError } = await supabase
        .from('business_data')
        .update({ 
          profile_id: firstProfile.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', businessId);
      
      if (updateError) {
        console.log('❌ Erro ao atualizar:', updateError.message);
        return;
      }
      
      console.log('✅ business_data atualizado com profile existente');
    } else {
      console.log('❌ Nenhum profile disponível para usar');
      return;
    }
  }
  
  // 5. Verificação final
  console.log('\n4️⃣ Verificação final do SSOT...');
  
  const { data: finalBusiness } = await supabase
    .from('business_data')
    .select(`
      id,
      profile_id,
      gastronomy_profiles!inner(
        id,
        business_id,
        niche_key
      )
    `)
    .eq('id', businessId)
    .single();
  
  if (!finalBusiness) {
    console.log('❌ Erro ao verificar final');
    return;
  }
  
  const profileConsistent = finalBusiness.profile_id === finalBusiness.gastronomy_profiles.id;
  const businessConsistent = finalBusiness.id === finalBusiness.gastronomy_profiles.business_id;
  
  console.log(`✅ business.profile_id ↔ gastro_profile.id: ${profileConsistent ? 'OK' : 'FALHOU'}`);
  console.log(`✅ business.id ↔ gastro_profile.business_id: ${businessConsistent ? 'OK' : 'FALHOU'}`);
  
  // 6. Teste final completo
  console.log('\n5️⃣ Teste final completo...');
  
  // Cardápio
  const { data: menus } = await supabase
    .from('menus')
    .select('id')
    .eq('business_id', businessId)
    .eq('is_active', true);
  
  const { data: categories } = await supabase
    .from('menu_categories')
    .select('id')
    .eq('menu_id', menus[0].id)
    .eq('is_available', true);
  
  let totalItems = 0;
  for (const cat of categories || []) {
    const { data: items } = await supabase
      .from('menu_items')
      .select('id')
      .eq('category_id', cat.id)
      .eq('is_available', true);
    totalItems += items?.length || 0;
  }
  
  // Dados da pizzaria
  const [sizes, flavors] = await Promise.all([
    supabase.from('pizza_sizes').select('id').eq('business_id', businessId),
    supabase.from('pizza_flavors').select('id').eq('business_id', businessId)
  ]);
  
  const finalChecks = [
    finalBusiness ? true : false,
    finalBusiness.gastronomy_profiles?.niche_key === 'pizza',
    totalItems >= 50,
    sizes.data?.length === 5,
    flavors.data?.length === 18,
    profileConsistent && businessConsistent
  ];
  
  const passedFinal = finalChecks.filter(Boolean).length;
  
  console.log(`📊 Checks finais: ${passedFinal}/6 passaram`);
  
  if (passedFinal === 6) {
    console.log('\n🎉🎉🎉 SSOT 100% CORRIGIDO! 🎉🎉🎉');
    console.log('');
    console.log('✅ Todos os dados consistentes');
    console.log(`✅ Cardápio: ${totalItems} itens`);
    console.log('✅ Pizzaria: 5 tamanhos, 18 sabores');
    console.log('✅ SSOT perfeito');
    
    console.log('\n🎯 RESPOSTA FINAL:');
    console.log('SIM! Gastronomia agora usa SSOT 100% correto.');
    console.log('Bella Napoli está completamente funcional.');
    console.log('Todos os erros foram corrigidos sem gambiarras.');
    
  } else {
    console.log(`\n⚠️ Ainda ${6 - passedFinal} problemas`);
  }
}

fixSsotFinalApproach();
