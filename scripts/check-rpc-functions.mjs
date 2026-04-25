import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function checkRpcFunctions() {
  console.log('🔍 Verificando funções RPC de business vs gastronomy...');
  
  // 1. Testar RPC de business
  console.log('\n1️⃣ Testando get_public_business_snapshot_by_slug...');
  try {
    const { data: businessData, error: businessError } = await supabase
      .rpc('get_public_business_snapshot_by_slug', {
        p_state: 'ba',
        p_city: 'salvador', 
        p_district: 'itaigara',
        p_slug: 'pizzaria-bella-napoli'
      });
    
    if (businessError) {
      console.log('❌ Erro RPC business:', businessError.message);
    } else {
      console.log('✅ RPC business funcionou');
      console.log('   Estrutura:', Object.keys(businessData || {}));
      if (businessData?.institutional?.business) {
        console.log('   Business ID:', businessData.institutional.business.id);
        console.log('   Business Profile ID:', businessData.institutional.business.profile_id);
      }
    }
  } catch (err) {
    console.log('❌ Exceção RPC business:', err.message);
  }
  
  // 2. Testar RPC de gastronomy
  console.log('\n2️⃣ Testando get_public_gastronomy_snapshot_by_slug...');
  try {
    const { data: gastroData, error: gastroError } = await supabase
      .rpc('get_public_gastronomy_snapshot_by_slug', {
        p_state: 'ba',
        p_city: 'salvador',
        p_district: 'itaigara', 
        p_slug: 'pizzaria-bella-napoli'
      });
    
    if (gastroError) {
      console.log('❌ Erro RPC gastronomy:', gastroError.message);
    } else {
      console.log('✅ RPC gastronomy funcionou');
      console.log('   Estrutura:', Object.keys(gastroData || {}));
      if (gastroData?.gastronomy?.business) {
        console.log('   Gastro Business ID:', gastroData.gastronomy.business.id);
        console.log('   Gastro Business Profile ID:', gastroData.gastronomy.business.profile_id);
        console.log('   Gastro Profile ID:', gastroData.gastronomy.profile?.id);
      }
    }
  } catch (err) {
    console.log('❌ Exceção RPC gastronomy:', err.message);
  }
  
  // 3. Comparar os IDs
  console.log('\n3️⃣ Comparando IDs entre as duas RPCs...');
  
  try {
    const [businessResult, gastroResult] = await Promise.all([
      supabase.rpc('get_public_business_snapshot_by_slug', {
        p_state: 'ba', p_city: 'salvador', p_district: 'itaigara', p_slug: 'pizzaria-bella-napoli'
      }),
      supabase.rpc('get_public_gastronomy_snapshot_by_slug', {
        p_state: 'ba', p_city: 'salvador', p_district: 'itaigara', p_slug: 'pizzaria-bella-napoli'
      })
    ]);
    
    if (businessResult.data && gastroResult.data) {
      const businessId = businessResult.data.institutional?.business?.id;
      const gastroBusinessId = gastroResult.data.gastronomy?.business?.id;
      
      console.log('   Business ID (RPC business):', businessId);
      console.log('   Business ID (RPC gastronomy):', gastroBusinessId);
      
      if (businessId === gastroBusinessId) {
        console.log('✅ SSOT OK: Ambas usam o mesmo business_id');
      } else {
        console.log('❌ SSOT PROBLEMA: IDs diferentes!');
      }
      
      // Verificar se ambos apontam para business_data
      console.log('\n4️⃣ Verificando se apontam para business_data (SSOT)...');
      
      const { data: directBusiness } = await supabase
        .from('business_data')
        .select('id, business_name')
        .eq('slug', 'pizzaria-bella-napoli')
        .single();
      
      if (directBusiness) {
        console.log('   Direct business_data ID:', directBusiness.id);
        console.log('   Match com business RPC:', businessId === directBusiness.id ? '✅' : '❌');
        console.log('   Match com gastronomy RPC:', gastroBusinessId === directBusiness.id ? '✅' : '❌');
        
        if (businessId === directBusiness.id && gastroBusinessId === directBusiness.id) {
          console.log('\n🎉 AMBAS AS PÁGINAS USAM SSOT CORRETO (business_data)!');
        } else {
          console.log('\n⚠️ HÁ DIVERGÊNCIA NO SSOT');
        }
      }
    }
  } catch (err) {
    console.log('❌ Erro na comparação:', err.message);
  }
  
  // 5. Verificar se as queries são diferentes
  console.log('\n5️⃣ Analisando diferenças nas queries...');
  
  // Simular query direta que gastronomy usa
  const { data: directGastro } = await supabase
    .from('business_data')
    .select(`
      *,
      gastronomy_profiles!inner(
        business_id,
        niche_key,
        cuisine_type,
        status
      )
    `)
    .eq('status', 'active')
    .eq('slug', 'pizzaria-bella-napoli')
    .single();
    
  if (directGastro) {
    console.log('   Query direta gastronomy:');
    console.log('     - business_data.id:', directGastro.id);
    console.log('     - gastronomy_profiles.business_id:', directGastro.gastronomy_profiles?.business_id);
    console.log('     - IDs iguais:', directGastro.id === directGastro.gastronomy_profiles?.business_id ? '✅' : '❌');
  }
}

checkRpcFunctions();
