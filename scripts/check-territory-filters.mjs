import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function checkTerritoryFilters() {
  console.log('🔍 Verificando filtros territoriais da Bella Napoli...');
  
  // 1. Dados completos da Bella
  const { data: bella, error: bellaError } = await supabase
    .from('business_data')
    .select(`
      *,
      address:addresses!address_id(*),
      location:locations!location_id(*),
      gastronomy_profiles!inner(
        business_id,
        niche_key,
        cuisine_type,
        status
      )
    `)
    .eq('slug', 'pizzaria-bella-napoli')
    .single();
    
  if (bellaError) {
    console.log('❌ Erro:', bellaError.message);
    return;
  }
  
  console.log('✅ Dados completos da Bella:');
  console.log('   - ID:', bella.id);
  console.log('   - Nome:', bella.business_name);
  console.log('   - Status:', bella.status);
  console.log('   - Business Role:', bella.business_role);
  console.log('   - Location ID:', bella.location_id);
  console.log('   - Location:', bella.location?.name, `(${bella.location?.type})`);
  console.log('   - Geographic Path:', bella.location?.geographic_path);
  console.log('   - Niche Key:', bella.gastronomy_profiles?.niche_key);
  console.log('   - Gastro Status:', bella.gastronomy_profiles?.status);
  
  // 2. Simular query exata do frontend com territory filters
  console.log('\n🧪 Simulando query do frontend com territory filters...');
  
  // Query base (sem territory filter)
  const { data: baseQuery, error: baseError } = await supabase
    .from('business_data')
    .select(`
      *,
      address:addresses!address_id(*),
      location:locations!location_id(*),
      gastronomy_profiles!inner(
        business_id,
        niche_key,
        cuisine_type,
        status
      )
    `)
    .eq('status', 'active')
    .eq('gastronomy_profiles.status', 'active')
    .in('business_role', ['standalone', 'branch'])
    .eq('slug', 'pizzaria-bella-napoli');
    
  if (!baseError && baseQuery) {
    console.log('✅ Query base (sem territory): Encontra Bella');
  } else {
    console.log('❌ Query base (sem territory): Não encontra Bella');
    console.log('   Erro:', baseError?.message);
    return;
  }
  
  // Query com territory filter comum (Bahia/Salvador)
  console.log('\n🧪 Testando com territory filter (Bahia/Salvador)...');
  
  const { data: withTerritory, error: territoryError } = await supabase
    .from('business_data')
    .select(`
      *,
      address:addresses!address_id(*),
      location:locations!location_id(*),
      gastronomy_profiles!inner(
        business_id,
        niche_key,
        cuisine_type,
        status
      )
    `)
    .eq('status', 'active')
    .eq('gastronomy_profiles.status', 'active')
    .in('business_role', ['standalone', 'branch'])
    .eq('location.geographic_path', '/br/ba/salvador/itaigara')
    .eq('slug', 'pizzaria-bella-napoli');
    
  if (!territoryError && withTerritory) {
    console.log('✅ Query com territory: Encontra Bella');
  } else {
    console.log('❌ Query com territory: Não encontra Bella');
    console.log('   Erro:', territoryError?.message);
  }
  
  // 3. Verificar outras empresas na mesma localização
  console.log('\n📊 Outras empresas em Itaigara...');
  const { data: itaigaraBusinesses, error: itaigaraError } = await supabase
    .from('business_data')
    .select('business_name, category, status')
    .eq('location.geographic_path', '/br/ba/salvador/itaigara')
    .eq('status', 'active');
    
  if (!itaigaraError) {
    console.log(`✅ ${itaigaraBusinesses?.length || 0} empresas em Itaigara:`);
    itaigaraBusinesses?.forEach(b => console.log(`   - ${b.business_name} (${b.category})`));
  }
  
  // 4. Verificar se Bella aparece na listagem geral de gastronomia
  console.log('\n🍕 Listagem geral de gastronomia (primeiros 10)...');
  const { data: allGastro, error: allGastroError } = await supabase
    .from('business_data')
    .select(`
      business_name,
      slug,
      location:locations!location_id(name),
      gastronomy_profiles!inner(niche_key, cuisine_type)
    `)
    .eq('status', 'active')
    .eq('gastronomy_profiles.status', 'active')
    .in('business_role', ['standalone', 'branch'])
    .order('business_name')
    .limit(10);
    
  if (!allGastroError) {
    console.log('✅ Negócios gastronômicos encontrados:');
    allGastro?.forEach(b => {
      const isBella = b.slug === 'pizzaria-bella-napoli';
      console.log(`   ${isBella ? '👉' : '  '} ${b.business_name} (${b.location?.name}) - ${b.gastronomy_profiles?.cuisine_type}`);
    });
    
    const bellaInList = allGastro?.some(b => b.slug === 'pizzaria-bella-napoli');
    if (!bellaInList) {
      console.log('\n❌ BELLA NÃO ESTÁ NA LISTAGEM GERAL!');
      console.log('   Isso explica por que não aparece no frontend');
    } else {
      console.log('\n✅ Bella está na listagem geral');
    }
  }
  
  // 5. Verificar se há algum problema com as permissões (RLS)
  console.log('\n🔐 Verificando se há problema de permissões...');
  const { data: publicQuery, error: publicError } = await supabase
    .from('business_data')
    .select('business_name, slug')
    .eq('status', 'active')
    .eq('slug', 'pizzaria-bella-napoli');
    
  if (!publicError && publicQuery) {
    console.log('✅ Query pública (sem joins): Encontra Bella');
  } else {
    console.log('❌ Query pública: Não encontra Bella');
  }
}

checkTerritoryFilters();
