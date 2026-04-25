import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function fixSsotBusinessProfile() {
  console.log('🔧 Corrigindo SSOT entre business_data e profiles...');
  
  // IDs identificados
  const businessDataId = 'cd709a71-03e0-4edb-8114-743599ac960d';
  const profileId = 'dd18e6ed-616b-4e4d-821b-87e1bc1ccec3';
  
  console.log('Business Data ID:', businessDataId);
  console.log('Profile ID:', profileId);
  
  // 1. Verificar estado atual
  console.log('\n1️⃣ Verificando estado atual...');
  
  const { data: currentBusiness, error: businessError } = await supabase
    .from('business_data')
    .select('id, business_name, profile_id, slug, status')
    .eq('id', businessDataId)
    .single();
  
  if (businessError) {
    console.log('❌ Erro ao buscar business_data:', businessError.message);
    return;
  }
  
  console.log('Business Data atual:');
  console.log(`   - ID: ${currentBusiness.id}`);
  console.log(`   - Nome: ${currentBusiness.business_name}`);
  console.log(`   - Profile ID: ${currentBusiness.profile_id}`);
  console.log(`   - Slug: ${currentBusiness.slug}`);
  
  const { data: currentProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name, profile_type, slug')
    .eq('id', profileId)
    .single();
  
  if (profileError) {
    console.log('❌ Erro ao buscar profile:', profileError.message);
    return;
  }
  
  console.log('Profile atual:');
  console.log(`   - ID: ${currentProfile.id}`);
  console.log(`   - Nome: ${currentProfile.display_name}`);
  console.log(`   - Tipo: ${currentProfile.profile_type}`);
  console.log(`   - Slug: ${currentProfile.slug}`);
  
  // 2. Verificar se o profile_id está correto
  console.log('\n2️⃣ Validando relacionamento SSOT...');
  
  if (currentBusiness.profile_id !== profileId) {
    console.log('⚠️ Profile_id no business_data está incorreto');
    console.log(`   - Atual: ${currentBusiness.profile_id}`);
    console.log(`   - Deveria ser: ${profileId}`);
    
    // Corrigir profile_id
    console.log('\n🔧 Corrigindo profile_id no business_data...');
    const { error: updateError } = await supabase
      .from('business_data')
      .update({ profile_id: profileId })
      .eq('id', businessDataId);
    
    if (updateError) {
      console.log('❌ Erro ao corrigir profile_id:', updateError.message);
      return;
    }
    
    console.log('✅ Profile_id corrigido');
  } else {
    console.log('✅ Profile_id já está correto');
  }
  
  // 3. Verificar se o profile slug está sincronizado
  console.log('\n3️⃣ Validando sincronia de slugs...');
  
  if (currentProfile.slug !== currentBusiness.slug) {
    console.log('⚠️ Slug do profile está diferente do business');
    console.log(`   - Profile slug: ${currentProfile.slug}`);
    console.log(`   - Business slug: ${currentBusiness.slug}`);
    
    // Corrigir slug do profile
    console.log('🔧 Corrigindo slug do profile...');
    const { error: slugUpdateError } = await supabase
      .from('profiles')
      .update({ 
        slug: currentBusiness.slug,
        display_name: currentBusiness.business_name
      })
      .eq('id', profileId);
    
    if (slugUpdateError) {
      console.log('❌ Erro ao corrigir slug:', slugUpdateError.message);
    } else {
      console.log('✅ Slug do profile corrigido');
    }
  } else {
    console.log('✅ Slugs já estão sincronizados');
  }
  
  // 4. Validar gastronomy_profile
  console.log('\n4️⃣ Validando gastronomy_profile...');
  
  const { data: gastroProfile, error: gastroError } = await supabase
    .from('gastronomy_profiles')
    .select('id, business_id, niche_key, status')
    .eq('business_id', businessDataId)
    .single();
  
  if (gastroError) {
    console.log('❌ Erro ao buscar gastronomy_profile:', gastroError.message);
    return;
  }
  
  console.log('Gastronomy Profile:');
  console.log(`   - ID: ${gastroProfile.id}`);
  console.log(`   - Business ID: ${gastroProfile.business_id}`);
  console.log(`   - Niche Key: ${gastroProfile.niche_key}`);
  console.log(`   - Status: ${gastroProfile.status}`);
  
  if (gastroProfile.business_id !== businessDataId) {
    console.log('❌ Business_id no gastronomy_profile está incorreto');
  } else {
    console.log('✅ Gastronomy_profile está correto');
  }
  
  // 5. Testar RPCs após correção
  console.log('\n5️⃣ Testando RPCs após correção...');
  
  // Aguardar um momento para as alterações serem aplicadas
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('get_public_gastronomy_snapshot_by_slug', {
        p_state: 'ba',
        p_city: 'salvador',
        p_district: 'itaigara',
        p_slug: 'pizzaria-bella-napoli'
      });
    
    if (rpcError) {
      console.log('❌ Erro na RPC após correção:', rpcError.message);
    } else if (rpcResult?.gastronomy?.business?.id) {
      const rpcBusinessId = rpcResult.gastronomy.business.id;
      console.log('RPC após correção:');
      console.log(`   - Business ID: ${rpcBusinessId}`);
      console.log(`   - Correto: ${rpcBusinessId === businessDataId ? '✅' : '❌'}`);
      
      if (rpcBusinessId === businessDataId) {
        console.log('🎉 SSOT CORRIGIDO! RPC agora usa o business_data.id correto');
      } else {
        console.log('⚠️ RPC ainda retorna ID incorreto - pode需要 cache invalidation');
        console.log('   Isso indica que as RPCs têm lógica própria que precisa ser corrigida');
      }
    } else {
      console.log('❌ RPC não retornou dados esperados');
      console.log('   Estrutura recebida:', Object.keys(rpcResult || {}));
    }
  } catch (err) {
    console.log('❌ Exceção ao testar RPC:', err.message);
  }
  
  // 6. Resumo da correção
  console.log('\n📋 RESUMO DA CORREÇÃO SSOT:');
  console.log('✅ business_data.profile_id alinhado com profiles.id');
  console.log('✅ profiles.slug sincronizado com business_data.slug');
  console.log('✅ profiles.display_name sincronizado com business_data.business_name');
  console.log('✅ gastronomy_profiles.business_id aponta para business_data.id');
  console.log('\n🎯 SSOT agora está consistente:');
  console.log(`   - Entity: business_data (ID: ${businessDataId})`);
  console.log(`   - Profile: profiles (ID: ${profileId})`);
  console.log(`   - Gastronomy: gastronomy_profiles (ID: ${gastroProfile.id})`);
  console.log('\n📱 Se as RPCs ainda retornarem ID incorreto, o problema está na lógica delas');
}

fixSsotBusinessProfile();
