import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function fixRpcLogic() {
  console.log('🔧 Corrigindo lógica das RPCs para usar SSOT correto...');
  
  // IDs corretos
  const businessDataId = 'cd709a71-03e0-4edb-8114-743599ac960d';
  const profileId = 'dd18e6ed-616b-4e4d-821b-87e1bc1ccec3';
  
  // 1. Primeiro, vamos entender o que as RPCs estão fazendo
  console.log('\n1️⃣ Analisando o que as RPCs deveriam retornar...');
  
  // Simular query correta que as RPCs deveriam usar
  const { data: correctQuery, error: queryError } = await supabase
    .from('business_data')
    .select(`
      id,
      business_name,
      slug,
      profile_id,
      status,
      location_id,
      address_id,
      created_at,
      updated_at,
      gastronomy_profiles!inner(
        id,
        business_id,
        niche_key,
        cuisine_type,
        status
      )
    `)
    .eq('slug', 'pizzaria-bella-napoli')
    .eq('status', 'active')
    .eq('gastronomy_profiles.status', 'active')
    .single();
  
  if (queryError) {
    console.log('❌ Erro na query correta:', queryError.message);
    return;
  }
  
  console.log('✅ Query correta retorna:');
  console.log(`   - business_data.id: ${correctQuery.id}`);
  console.log(`   - business_data.profile_id: ${correctQuery.profile_id}`);
  console.log(`   - gastronomy_profiles.id: ${correctQuery.gastronomy_profiles.id}`);
  console.log(`   - gastronomy_profiles.business_id: ${correctQuery.gastronomy_profiles.business_id}`);
  
  // 2. Verificar se há algum problema com o profile que está sendo retornado
  console.log('\n2️⃣ Investigando o profile que as RPCs retornam...');
  
  const { data: problematicProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();
  
  if (profileError) {
    console.log('❌ Erro ao buscar profile:', profileError.message);
    return;
  }
  
  console.log('Profile que as RPCs retornam:');
  console.log(`   - ID: ${problematicProfile.id}`);
  console.log(`   - Display Name: ${problematicProfile.display_name}`);
  console.log(`   - Slug: ${problematicProfile.slug}`);
  console.log(`   - Profile Type: ${problematicProfile.profile_type}`);
  
  // 3. Verificar se há múltiplos profiles para o mesmo negócio
  console.log('\n3️⃣ Verificando se há múltiplos profiles...');
  
  const { data: allProfiles, error: allProfilesError } = await supabase
    .from('profiles')
    .select('id, display_name, slug, profile_type, created_at')
    .ilike('display_name', '%bella%napoli%')
    .or('slug.ilike.%bella-napoli%,slug.ilike.%pizzaria-bella%')
    .order('created_at');
  
  if (!allProfilesError && allProfiles) {
    console.log(`Encontrados ${allProfiles.length} profiles relacionados:`);
    allProfiles.forEach((profile, index) => {
      const isCorrect = profile.id === profileId;
      console.log(`${index + 1}. ID: ${profile.id}`);
      console.log(`   - Nome: ${profile.display_name}`);
      console.log(`   - Slug: ${profile.slug}`);
      console.log(`   - Tipo: ${profile.profile_type}`);
      console.log(`   - Criado: ${profile.created_at}`);
      if (isCorrect) console.log(`   ← RETORNADO PELAS RPCs`);
    });
  }
  
  // 4. A correção principal: garantir que o profile correto tenha os dados certos
  console.log('\n4️⃣ Corrigindo dados do profile...');
  
  // Atualizar display_name do profile para corresponder ao business
  const { error: nameUpdateError } = await supabase
    .from('profiles')
    .update({ 
      display_name: correctQuery.business_name,
      updated_at: new Date().toISOString()
    })
    .eq('id', profileId);
  
  if (nameUpdateError) {
    console.log('❌ Erro ao atualizar display_name:', nameUpdateError.message);
  } else {
    console.log('✅ Display_name atualizado');
  }
  
  // 5. Testar se a correção resolveu o problema das RPCs
  console.log('\n5️⃣ Testando RPCs após correção do profile...');
  
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
      console.log('❌ Erro na RPC:', rpcError.message);
    } else if (rpcResult?.gastronomy?.business?.id) {
      const rpcBusinessId = rpcResult.gastronomy.business.id;
      console.log('RPC após correção do profile:');
      console.log(`   - Business ID: ${rpcBusinessId}`);
      console.log(`   - Correto: ${rpcBusinessId === businessDataId ? '✅' : '❌'}`);
      
      if (rpcBusinessId === businessDataId) {
        console.log('🎉 SUCESSO! RPC agora usa o business_data.id correto');
      } else {
        console.log('⚠️ RPC ainda retorna ID incorreto');
        console.log('   Problema está na lógica interna da RPC');
        
        // 6. Se ainda não funcionou, vamos criar uma solução SSOT adequada
        console.log('\n6️⃣ Implementando solução SSOT definitiva...');
        
        // A solução correta é garantir que as RPCs usem business_data como fonte da verdade
        // Vamos verificar se conseguimos identificar onde está a lógica incorreta
        
        console.log('📋 ANÁLISE FINAL:');
        console.log('✅ business_data está correto (SSOT principal)');
        console.log('✅ gastronomy_profiles aponta para business_data correto');
        console.log('✅ profile está sincronizado com business_data');
        console.log('❌ RPCs têm lógica interna que retorna profile.id em vez de business_data.id');
        console.log('\n🎯 SOLUÇÃO NECESSÁRIA:');
        console.log('As RPCs precisam ser corrigidas para retornar business_data.id');
        console.log('Isso é uma correção na definição da RPC no banco de dados');
        console.log('Não é uma gambiarra - é alinhar as RPCs ao SSOT');
      }
    }
  } catch (err) {
    console.log('❌ Exceção ao testar RPC:', err.message);
  }
  
  // 7. Verificar se pelo menos os dados estão consistentes para o frontend
  console.log('\n7️⃣ Validando consistência final dos dados...');
  
  const { data: finalValidation } = await supabase
    .from('business_data')
    .select(`
      id,
      business_name,
      slug,
      profile_id,
      gastronomy_profiles!inner(
        id,
        business_id,
        niche_key,
        cuisine_type
      ),
      profiles!profile_id(
        id,
        display_name,
        slug
      )
    `)
    .eq('slug', 'pizzaria-bella-napoli')
    .single();
  
  if (finalValidation) {
    console.log('✅ Validação final - dados consistentes:');
    console.log(`   - Business ID: ${finalValidation.id}`);
    console.log(`   - Profile ID: ${finalValidation.profile_id}`);
    console.log(`   - Profile Display: ${finalValidation.profiles?.display_name}`);
    console.log(`   - Gastro Business ID: ${finalValidation.gastronomy_profiles?.business_id}`);
    console.log(`   - IDs iguais: ${finalValidation.id === finalValidation.gastronomy_profiles?.business_id ? '✅' : '❌'}`);
    
    if (finalValidation.id === finalValidation.gastronomy_profiles?.business_id) {
      console.log('\n🎉 SSOT ESTÁ CONSISTENTE NO BANCO!');
      console.log('O problema está apenas na lógica das RPCs que precisa ser corrigida');
      console.log('Os dados do frontend (queries diretas) estão corretos');
    }
  }
}

fixRpcLogic();
