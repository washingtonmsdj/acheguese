import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function investigateRpcSource() {
  console.log('🔍 Investigando fonte do ID incorreto nas RPCs...');
  
  // 1. Verificar se há algum registro com o ID que as RPCs retornam
  const rpcId = 'dd18e6ed-616b-4e4d-821b-87e1bc1ccec3';
  console.log('\n1️⃣ Procurando pelo ID que as RPCs retornam...');
  
  // Verificar em todas as tabelas relevantes
  const tables = [
    'business_data',
    'profiles', 
    'gastronomy_profiles',
    'menus',
    'menu_categories',
    'menu_items'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id, created_at')
        .eq('id', rpcId)
        .maybeSingle();
      
      if (!error && data) {
        console.log(`✅ Encontrado em ${table}:`);
        console.log(`   - ID: ${data.id}`);
        console.log(`   - Criado: ${data.created_at}`);
      }
    } catch (err) {
      // Tabela pode não existir ou não ter a coluna id
    }
  }
  
  // 2. Verificar se há registros antigos ou soft-deleted
  console.log('\n2️⃣ Procurando por registros relacionados ao ID incorreto...');
  
  // Buscar por business_name similar
  const { data: similarBusinesses } = await supabase
    .from('business_data')
    .select('id, business_name, slug, created_at, updated_at')
    .ilike('business_name', '%bella%napoli%')
    .order('created_at', { ascending: false });
  
  console.log('Negócios "Bella Napoli" encontrados:');
  similarBusinesses?.forEach((biz, index) => {
    const isCurrent = biz.id === 'cd709a71-03e0-4edb-8114-743599ac960d';
    console.log(`${index + 1}. ID: ${biz.id}`);
    console.log(`   Nome: ${biz.business_name}`);
    console.log(`   Slug: ${biz.slug}`);
    console.log(`   Criado: ${biz.created_at}`);
    console.log(`   Atualizado: ${biz.updated_at}`);
    if (isCurrent) console.log(`   ← REGISTRO ATUAL CORRETO`);
  });
  
  // 3. Verificar logs ou auditoria se existirem
  console.log('\n3️⃣ Verificando se há auditoria de mudanças...');
  
  // Buscar todos os registros para ver padrão
  const { data: allBusinesses, error: allError } = await supabase
    .from('business_data')
    .select('id, business_name, slug, status, created_at')
    .ilike('business_name', '%bella%')
    .order('created_at');
  
  if (!allError && allBusinesses) {
    console.log(`Todos os negócios "Bella": ${allBusinesses.length}`);
    allBusinesses.forEach(biz => {
      console.log(`   - ${biz.business_name} (${biz.slug}) - ${biz.status} - ${biz.id}`);
    });
  }
  
  // 4. Verificar se o ID aparece em algum lugar como referência
  console.log('\n4️⃣ Verificando referências ao ID incorreto...');
  
  // Verificar em gastronomy_profiles
  const { data: gastroRefs } = await supabase
    .from('gastronomy_profiles')
    .select('id, business_id, cuisine_type')
    .eq('business_id', rpcId);
  
  if (gastroRefs && gastroRefs.length > 0) {
    console.log('Referências em gastronomy_profiles:');
    gastroRefs.forEach(ref => {
      console.log(`   - Profile ID: ${ref.id} -> Business ID: ${ref.business_id} (${ref.cuisine_type})`);
    });
  }
  
  // 5. Testar se o problema é nas RPCs ou no cache
  console.log('\n5️⃣ Testando se o problema é reproduzível...');
  
  // Executar RPC várias vezes para ver se retorna sempre o mesmo ID
  const rpcResults = [];
  for (let i = 0; i < 3; i++) {
    try {
      const { data } = await supabase.rpc('get_public_gastronomy_snapshot_by_slug', {
        p_state: 'ba',
        p_city: 'salvador',
        p_district: 'itaigara',
        p_slug: 'pizzaria-bella-napoli'
      });
      
      if (data?.gastronomy?.business?.id) {
        rpcResults.push(data.gastronomy.business.id);
      }
    } catch (err) {
      console.log(`Tentativa ${i + 1}: Erro - ${err.message}`);
    }
  }
  
  console.log('Resultados das RPCs:', rpcResults);
  const consistent = rpcResults.every(id => id === rpcResults[0]);
  console.log('Resultados consistentes:', consistent ? '✅' : '❌');
  
  // 6. Buscar a definição da RPC se possível
  console.log('\n6️⃣ Tentando entender a lógica da RPC...');
  
  // Simular o que a RPC deveria fazer
  const { data: correctBusiness } = await supabase
    .from('business_data')
    .select(`
      id,
      business_name,
      slug,
      status,
      profile_id,
      location_id,
      address_id,
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
  
  if (correctBusiness) {
    console.log('✅ Query correta retornaria:');
    console.log(`   - Business ID: ${correctBusiness.id}`);
    console.log(`   - Profile ID: ${correctBusiness.profile_id}`);
    console.log(`   - Gastro Profile ID: ${correctBusiness.gastronomy_profiles.id}`);
    console.log(`   - Niche Key: ${correctBusiness.gastronomy_profiles.niche_key}`);
  }
}

investigateRpcSource();
