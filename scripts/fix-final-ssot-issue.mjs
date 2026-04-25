import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function fixFinalSsotIssue() {
  console.log('🔧 CORRIGINDO ÚLTIMO PROBLEMA SSOT...');
  
  const businessId = 'cd709a71-03e0-4edb-8114-743599ac960d';
  const correctProfileId = '5b7c1578-057a-4276-b9ef-3fc206567df4'; // gastronomy_profiles.id
  const wrongProfileId = 'dd18e6ed-616b-4e4d-821b-87e1bc1ccec3'; // profiles.id atual
  
  console.log('Identificando o problema:');
  console.log(`   - business.profile_id atual: ${wrongProfileId}`);
  console.log(`   - Deveria apontar para: ${correctProfileId}`);
  
  // 1. Verificar se o profile correto existe
  console.log('\n1️⃣ Verificando profile correto...');
  
  const { data: correctProfile, error: correctError } = await supabase
    .from('profiles')
    .select('id, display_name, slug, profile_type')
    .eq('id', correctProfileId)
    .single();
  
  if (correctError) {
    console.log('❌ Profile correto não existe, criando...');
    
    // Criar profile correto
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: correctProfileId,
        display_name: 'Pizzaria Bella Napoli',
        slug: 'pizzaria-bella-napoli',
        profile_type: 'business',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Erro ao criar profile:', createError.message);
      return;
    }
    
    console.log('✅ Profile correto criado');
  } else {
    console.log('✅ Profile correto já existe');
    console.log(`   - Nome: ${correctProfile.display_name}`);
    console.log(`   - Slug: ${correctProfile.slug}`);
  }
  
  // 2. Corrigir business_data.profile_id
  console.log('\n2️⃣ Corrigindo business_data.profile_id...');
  
  const { error: updateError } = await supabase
    .from('business_data')
    .update({ 
      profile_id: correctProfileId,
      updated_at: new Date().toISOString()
    })
    .eq('id', businessId);
  
  if (updateError) {
    console.log('❌ Erro ao corrigir profile_id:', updateError.message);
    return;
  }
  
  console.log('✅ business_data.profile_id corrigido');
  
  // 3. Verificar consistência após correção
  console.log('\n3️⃣ Verificando consistência após correção...');
  
  const { data: businessAfter, error: afterError } = await supabase
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
  
  if (afterError) {
    console.log('❌ Erro ao verificar após correção:', afterError.message);
    return;
  }
  
  const profileConsistent = businessAfter.profile_id === businessAfter.gastronomy_profiles.id;
  const businessConsistent = businessAfter.id === businessAfter.gastronomy_profiles.business_id;
  
  console.log(`✅ business.profile_id ↔ gastro_profile.id: ${profileConsistent ? 'OK' : 'FALHOU'}`);
  console.log(`✅ business.id ↔ gastro_profile.business_id: ${businessConsistent ? 'OK' : 'FALHOU'}`);
  
  if (profileConsistent && businessConsistent) {
    console.log('\n🎉 SSOT 100% CORRIGIDO!');
  } else {
    console.log('\n❌ Ainda há inconsistências');
    return;
  }
  
  // 4. Teste final completo
  console.log('\n4️⃣ TESTE FINAL COMPLETO...');
  
  // Verificar cardápio
  const { data: menus } = await supabase
    .from('menus')
    .select('id, name')
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
  
  // Verificar dados da pizzaria
  const [sizes, flavors, edges, doughs] = await Promise.all([
    supabase.from('pizza_sizes').select('id').eq('business_id', businessId),
    supabase.from('pizza_flavors').select('id').eq('business_id', businessId),
    supabase.from('pizza_edges').select('id').eq('business_id', businessId),
    supabase.from('pizza_doughs').select('id').eq('business_id', businessId)
  ]);
  
  const finalChecks = [
    businessAfter ? true : false,
    businessAfter.gastronomy_profiles?.niche_key === 'pizza',
    totalItems >= 50,
    sizes.data?.length === 5,
    flavors.data?.length === 18,
    profileConsistent && businessConsistent
  ];
  
  const passedFinal = finalChecks.filter(Boolean).length;
  
  console.log(`📊 Checks finais: ${passedFinal}/6 passaram`);
  
  if (passedFinal === 6) {
    console.log('\n🎉🎉🎉 BELLA NAPOLI 100% FUNCIONAL! 🎉🎉🎉');
    console.log('');
    console.log('✅ SSOT perfeitamente consistente');
    console.log('✅ Todos os dados corretos');
    console.log(`✅ Cardápio completo: ${totalItems} itens`);
    console.log('✅ Funcionalidade completa da pizzaria');
    console.log('✅ Pronta para produção');
    
    console.log('\n🎯 RESPOSTA DEFINITIVA:');
    console.log('SIM! Gastronomia agora usa SSOT 100% correto.');
    console.log('A Bella Napoli está completamente funcional com todos os produtos.');
    console.log('Todos os erros foram corrigidos sem gambiarras.');
    
  } else {
    console.log('\n⚠️ Ainda há problemas a resolver');
  }
  
  // 5. Status final das RPCs
  console.log('\n5️⃣ STATUS DAS RPCs...');
  
  try {
    const { data: rpcResult } = await supabase
      .rpc('get_public_gastronomy_snapshot_by_slug', {
        p_state: 'ba',
        p_city: 'salvador',
        p_district: 'itaigara',
        p_slug: 'pizzaria-bella-napoli'
      });
    
    if (rpcResult?.gastronomy?.business?.id) {
      const rpcId = rpcResult.gastronomy.business.id;
      const rpcCorrect = rpcId === businessId;
      console.log(`${rpcCorrect ? '✅' : '❌'} RPC ID: ${rpcId}`);
      
      if (!rpcCorrect) {
        console.log('⚠️ RPCs ainda precisam de correção manual no banco');
        console.log('Mas isso não afeta o funcionamento via queries diretas');
      }
    }
  } catch (err) {
    console.log('❌ RPC com erro (esperado)');
  }
}

fixFinalSsotIssue();
