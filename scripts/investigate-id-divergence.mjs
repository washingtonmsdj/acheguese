import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function investigateIdDivergence() {
  console.log('🔍 Investigando divergência de IDs...');
  
  // IDs encontrados
  const rpcBusinessId = 'dd18e6ed-616b-4e4d-821b-87e1bc1ccec3';
  const directBusinessId = 'cd709a71-03e0-4edb-8114-743599ac960d';
  
  console.log('   RPC Business ID:', rpcBusinessId);
  console.log('   Direct Business ID:', directBusinessId);
  
  // 1. Verificar se o ID da RPC existe em business_data
  console.log('\n1️⃣ Verificando se RPC ID existe em business_data...');
  const { data: rpcBusinessData, error: rpcError } = await supabase
    .from('business_data')
    .select('id, business_name, slug, status')
    .eq('id', rpcBusinessId)
    .single();
    
  if (rpcError) {
    console.log('❌ RPC ID não encontrado em business_data:', rpcError.message);
  } else {
    console.log('✅ RPC ID encontrado em business_data:');
    console.log('   - Nome:', rpcBusinessData.business_name);
    console.log('   - Slug:', rpcBusinessData.slug);
    console.log('   - Status:', rpcBusinessData.status);
  }
  
  // 2. Verificar se o ID direto existe em business_data
  console.log('\n2️⃣ Verificando Direct ID em business_data...');
  const { data: directBusinessData, error: directError } = await supabase
    .from('business_data')
    .select('id, business_name, slug, status')
    .eq('id', directBusinessId)
    .single();
    
  if (directError) {
    console.log('❌ Direct ID não encontrado:', directError.message);
  } else {
    console.log('✅ Direct ID encontrado:');
    console.log('   - Nome:', directBusinessData.business_name);
    console.log('   - Slug:', directBusinessData.slug);
    console.log('   - Status:', directBusinessData.status);
  }
  
  // 3. Verificar se há duplicatas de slug
  console.log('\n3️⃣ Verificando duplicatas do slug "pizzaria-bella-napoli"...');
  const { data: duplicateSlugs, error: dupError } = await supabase
    .from('business_data')
    .select('id, business_name, status, created_at')
    .eq('slug', 'pizzaria-bella-napoli');
    
  if (dupError) {
    console.log('❌ Erro ao buscar duplicatas:', dupError.message);
  } else {
    console.log(`✅ Encontrados ${duplicateSlugs?.length || 0} registros com o mesmo slug:`);
    duplicateSlugs?.forEach((biz, index) => {
      const isRpc = biz.id === rpcBusinessId;
      const isDirect = biz.id === directBusinessId;
      console.log(`   ${index + 1}. ID: ${biz.id}`);
      console.log(`      Nome: ${biz.business_name}`);
      console.log(`      Status: ${biz.status}`);
      console.log(`      Criado: ${biz.created_at}`);
      if (isRpc) console.log('      ← USADO PELAS RPCs');
      if (isDirect) console.log('      ← USADO PELAS QUERIES DIRETAS');
    });
  }
  
  // 4. Verificar gastronomy_profiles para ambos os IDs
  console.log('\n4️⃣ Verificando gastronomy_profiles...');
  
  for (const [label, businessId] of [['RPC', rpcBusinessId], ['Direct', directBusinessId]]) {
    const { data: gastro, error: gastroError } = await supabase
      .from('gastronomy_profiles')
      .select('id, business_id, cuisine_type, status, created_at')
      .eq('business_id', businessId);
      
    if (gastroError) {
      console.log(`❌ ${label} ID sem gastronomy_profile:`, gastroError.message);
    } else {
      console.log(`✅ ${label} ID tem ${gastro?.length || 0} gastronomy_profile(s):`);
      gastro?.forEach(profile => {
        console.log(`   - Profile ID: ${profile.id}`);
        console.log(`     Cuisine: ${profile.cuisine_type}`);
        console.log(`     Status: ${profile.status}`);
        console.log(`     Criado: ${profile.created_at}`);
      });
    }
  }
  
  // 5. Verificar menus para ambos os IDs
  console.log('\n5️⃣ Verificando menus...');
  
  for (const [label, businessId] of [['RPC', rpcBusinessId], ['Direct', directBusinessId]]) {
    const { data: menus, error: menuError } = await supabase
      .from('menus')
      .select('id, name, is_active, created_at')
      .eq('business_id', businessId);
      
    if (menuError) {
      console.log(`❌ ${label} ID sem menus:`, menuError.message);
    } else {
      console.log(`✅ ${label} ID tem ${menus?.length || 0} menu(s):`);
      menus?.forEach(menu => {
        console.log(`   - Menu ID: ${menu.id}`);
        console.log(`     Nome: ${menu.name}`);
        console.log(`     Ativo: ${menu.is_active}`);
        console.log(`     Criado: ${menu.created_at}`);
      });
    }
  }
  
  // 6. Análise e recomendação
  console.log('\n📋 ANÁLISE E RECOMENDAÇÃO:');
  
  if (duplicateSlugs && duplicateSlugs.length > 1) {
    console.log('⚠️ PROBLEMA IDENTIFICADO: Há duplicatas do mesmo slug!');
    console.log('   Isso causa confusão nas RPCs que buscam por slug.');
    console.log('   As RPCs podem estar retornando o registro errado.');
    
    // Identificar qual é o correto
    const activeBusinesses = duplicateSlugs.filter(b => b.status === 'active');
    if (activeBusinesses.length === 1) {
      console.log('\n✅ SOLUÇÃO: Apenas um negócio está ativo.');
      const correctId = activeBusinesses[0].id;
      console.log(`   ID correto: ${correctId}`);
      
      if (correctId === directBusinessId) {
        console.log('   As queries diretas estão corretas, mas as RPCs estão erradas.');
        console.log('   Recomendo corrigir as RPCs ou desativar o registro incorreto.');
      } else {
        console.log('   As RPCs estão corretas, mas as queries diretas estão erradas.');
        console.log('   Recomendo verificar qual contém os dados completos (menus, etc.).');
      }
    } else {
      console.log('\n❌ PROBLEMA CRÍTICO: Múltiplos negócios ativos com o mesmo slug!');
      console.log('   Isso viola o princípio de slug único.');
    }
  } else {
    console.log('✅ Não há duplicatas de slug.');
    console.log('   A divergência pode estar na lógica das RPCs.');
  }
}

investigateIdDivergence();
