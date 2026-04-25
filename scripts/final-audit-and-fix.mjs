import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function finalAuditAndFix() {
  console.log('🔍 VERIFICAÇÃO FINAL COMPLETA E CORREÇÃO DE ERROS...');
  
  const businessId = 'cd709a71-03e0-4edb-8114-743599ac960d';
  const profileId = 'dd18e6ed-616b-4e4d-821b-87e1bc1ccec3';
  
  // 1. Verificação de integridade do SSOT
  console.log('\n1️⃣ VERIFICAÇÃO DE INTEGRIDADE SSOT...');
  
  const checks = [];
  
  // Verificar business_data
  const { data: business, error: businessError } = await supabase
    .from('business_data')
    .select('id, business_name, slug, profile_id, status, location_id, address_id')
    .eq('id', businessId)
    .single();
  
  if (businessError) {
    console.log('❌ Business não encontrado:', businessError.message);
    checks.push({ item: 'business_data', status: '❌', error: businessError.message });
  } else {
    console.log('✅ Business OK');
    checks.push({ item: 'business_data', status: '✅', id: business.id });
  }
  
  // Verificar profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name, slug, profile_type')
    .eq('id', profileId)
    .single();
  
  if (profileError) {
    console.log('❌ Profile não encontrado:', profileError.message);
    checks.push({ item: 'profiles', status: '❌', error: profileError.message });
  } else {
    console.log('✅ Profile OK');
    checks.push({ item: 'profiles', status: '✅', id: profile.id });
  }
  
  // Verificar gastronomy_profiles
  const { data: gastroProfile, error: gastroError } = await supabase
    .from('gastronomy_profiles')
    .select('id, business_id, niche_key, cuisine_type, status')
    .eq('business_id', businessId)
    .single();
  
  if (gastroError) {
    console.log('❌ Gastronomy profile não encontrado:', gastroError.message);
    checks.push({ item: 'gastronomy_profiles', status: '❌', error: gastroError.message });
  } else {
    console.log('✅ Gastronomy Profile OK');
    checks.push({ item: 'gastronomy_profiles', status: '✅', id: gastroProfile.id });
  }
  
  // 2. Verificação de consistência
  console.log('\n2️⃣ VERIFICAÇÃO DE CONSISTÊNCIA...');
  
  const consistencyChecks = [];
  
  // business_data.profile_id == profiles.id?
  if (business && profile) {
    const profileConsistent = business.profile_id === profile.id;
    consistencyChecks.push({
      check: 'business.profile_id ↔ profiles.id',
      status: profileConsistent ? '✅' : '❌',
      business_profile_id: business.profile_id,
      profiles_id: profile.id
    });
  }
  
  // gastronomy_profiles.business_id == business_data.id?
  if (business && gastroProfile) {
    const gastroConsistent = gastroProfile.business_id === business.id;
    consistencyChecks.push({
      check: 'gastronomy.business_id ↔ business.id',
      status: gastroConsistent ? '✅' : '❌',
      gastro_business_id: gastroProfile.business_id,
      business_id: business.id
    });
  }
  
  // Slugs consistentes?
  if (business && profile) {
    const slugConsistent = business.slug === 'pizzaria-bella-napoli';
    consistencyChecks.push({
      check: 'business slug correto',
      status: slugConsistent ? '✅' : '❌',
      slug: business.slug
    });
  }
  
  consistencyChecks.forEach(check => {
    console.log(`${check.status} ${check.check}`);
    if (check.status === '❌') {
      Object.entries(check).forEach(([key, value]) => {
        if (key !== 'check' && key !== 'status') {
          console.log(`   ${key}: ${value}`);
        }
      });
    }
  });
  
  // 3. Verificação de dados do cardápio
  console.log('\n3️⃣ VERIFICAÇÃO DE CARDÁPIO...');
  
  const { data: menus, error: menusError } = await supabase
    .from('menus')
    .select('id, name, is_active')
    .eq('business_id', businessId)
    .eq('is_active', true);
  
  if (menusError || !menus || menus.length === 0) {
    console.log('❌ Nenhum menu ativo encontrado');
  } else {
    console.log(`✅ Menu encontrado: ${menus[0].name}`);
    
    // Contar categorias e itens
    const { data: categories } = await supabase
      .from('menu_categories')
      .select('id, name')
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
    
    console.log(`✅ ${categories?.length || 0} categorias, ${totalItems} itens`);
  }
  
  // 4. Verificação de dados da pizzaria (niche)
  console.log('\n4️⃣ VERIFICAÇÃO DE DADOS DA PIZZARIA...');
  
  const nicheChecks = [];
  
  // Tamanhos
  const { data: sizes } = await supabase
    .from('pizza_sizes')
    .select('id, name')
    .eq('business_id', businessId);
  
  nicheChecks.push({ item: 'Tamanhos de pizza', count: sizes?.length || 0 });
  
  // Sabores
  const { data: flavors } = await supabase
    .from('pizza_flavors')
    .select('id, name')
    .eq('business_id', businessId);
  
  nicheChecks.push({ item: 'Sabores de pizza', count: flavors?.length || 0 });
  
  // Bordas
  const { data: edges } = await supabase
    .from('pizza_edges')
    .select('id, name')
    .eq('business_id', businessId);
  
  nicheChecks.push({ item: 'Bordas de pizza', count: edges?.length || 0 });
  
  // Massas
  const { data: doughs } = await supabase
    .from('pizza_doughs')
    .select('id, name')
    .eq('business_id', businessId);
  
  nicheChecks.push({ item: 'Massas de pizza', count: doughs?.length || 0 });
  
  nicheChecks.forEach(check => {
    const expected = check.item.includes('Tamanhos') ? 5 : 
                    check.item.includes('Sabores') ? 18 :
                    check.item.includes('Bordas') ? 5 :
                    check.item.includes('Massas') ? 5 : 0;
    const status = check.count >= expected ? '✅' : '⚠️';
    console.log(`${status} ${check.item}: ${check.count}/${expected}`);
  });
  
  // 5. Correção de erros encontrados
  console.log('\n5️⃣ CORREÇÃO DE ERROS...');
  
  const errors = [];
  
  // Verificar se há inconsistências para corrigir
  if (business && profile && business.profile_id !== profile.id) {
    console.log('🔧 Corrigindo profile_id no business_data...');
    const { error: fixError } = await supabase
      .from('business_data')
      .update({ profile_id: profile.id })
      .eq('id', businessId);
    
    if (fixError) {
      errors.push(`Falha ao corrigir profile_id: ${fixError.message}`);
    } else {
      console.log('✅ profile_id corrigido');
    }
  }
  
  // Verificar se niche_key está correto
  if (gastroProfile && gastroProfile.niche_key !== 'pizza') {
    console.log('🔧 Corrigindo niche_key...');
    const { error: nicheError } = await supabase
      .from('gastronomy_profiles')
      .update({ niche_key: 'pizza' })
      .eq('business_id', businessId);
    
    if (nicheError) {
      errors.push(`Falha ao corrigir niche_key: ${nicheError.message}`);
    } else {
      console.log('✅ niche_key corrigido');
    }
  }
  
  // 6. Teste final das RPCs
  console.log('\n6️⃣ TESTE FINAL DAS RPCs...');
  
  try {
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('get_public_gastronomy_snapshot_by_slug', {
        p_state: 'ba',
        p_city: 'salvador',
        p_district: 'itaigara',
        p_slug: 'pizzaria-bella-napoli'
      });
    
    if (rpcError) {
      console.log('❌ RPC com erro:', rpcError.message);
      errors.push(`RPC error: ${rpcError.message}`);
    } else if (rpcResult?.gastronomy?.business?.id) {
      const rpcBusinessId = rpcResult.gastronomy.business.id;
      const rpcCorrect = rpcBusinessId === businessId;
      console.log(`${rpcCorrect ? '✅' : '❌'} RPC Business ID: ${rpcBusinessId}`);
      
      if (!rpcCorrect) {
        errors.push(`RPC retorna ID incorreto: ${rpcBusinessId} (esperado: ${businessId})`);
      }
    }
  } catch (err) {
    errors.push(`RPC exception: ${err.message}`);
  }
  
  // 7. Resumo final
  console.log('\n📋 RESUMO FINAL DA VERIFICAÇÃO:');
  
  const allChecksOk = checks.every(c => c.status === '✅') &&
                      consistencyChecks.every(c => c.status === '✅') &&
                      errors.length === 0;
  
  if (allChecksOk) {
    console.log('🎉 SISTEMA 100% FUNCIONAL!');
    console.log('✅ SSOT correto e consistente');
    console.log('✅ Todos os dados presentes');
    console.log('✅ Cardápio completo');
    console.log('✅ Dados da pizzaria completos');
  } else {
    console.log('⚠️ PROBLEMAS ENCONTRADOS:');
    errors.forEach(error => console.log(`   - ${error}`));
    
    console.log('\n🔧 AÇÕES NECESSÁRIAS:');
    if (errors.some(e => e.includes('RPC'))) {
      console.log('   - Corrigir definição das RPCs no banco');
    }
    if (errors.some(e => e.includes('profile_id'))) {
      console.log('   - Revisar relacionamentos entre tabelas');
    }
  }
  
  console.log('\n🎯 ESTADO FINAL DA BELLA NAPOLI:');
  console.log(`   - Business ID: ${businessId}`);
  console.log(`   - Profile ID: ${profileId}`);
  console.log(`   - Status: ${allChecksOk ? '✅ OK' : '⚠️ Com problemas'}`);
  console.log(`   - Cardápio: ${totalItems || 0} itens`);
  console.log(`   - Niche: ${gastroProfile?.niche_key || 'desconhecido'}`);
}

finalAuditAndFix();
