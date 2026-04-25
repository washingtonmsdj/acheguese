import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function debugGastronomyVisibility() {
  console.log('🔍 Debugando visibilidade da Bella Napoli em gastronomia...');
  
  // 1. Verificar se Bella aparece na query principal de gastronomia
  console.log('\n1️⃣ Testando query principal de gastronomia...');
  
  const { data: gastroBusinesses, error: gastroError } = await supabase
    .from('business_data')
    .select(`
      *,
      gastronomy_profiles!inner(
        business_id,
        niche_key,
        cuisine_type,
        status,
        delivery_enabled
      ),
      address:addresses!address_id(*)
    `)
    .eq('status', 'active')
    .eq('gastronomy_profiles.status', 'active');
    
  if (gastroError) {
    console.log('❌ Erro na query:', gastroError.message);
  } else {
    console.log(`✅ Encontrados ${gastroBusinesses?.length} negócios gastronômicos ativos`);
    
    const bella = gastroBusinesses?.find(b => b.slug === 'pizzaria-bella-napoli');
    if (bella) {
      console.log('✅ Bella Napoli encontrada na query!');
      console.log('   Dados:', {
        id: bella.id,
        name: bella.business_name,
        status: bella.status,
        niche_key: bella.gastronomy_profiles?.niche_key,
        cuisine_type: bella.gastronomy_profiles?.cuisine_type,
        delivery_enabled: bella.gastronomy_profiles?.delivery_enabled
      });
    } else {
      console.log('❌ Bella Napoli NÃO encontrada na query principal');
      console.log('   Negócios encontrados:', gastroBusinesses?.map(b => b.business_name));
    }
  }
  
  // 2. Verificar filtros específicos que o frontend pode usar
  console.log('\n2️⃣ Verificando filtros comuns do frontend...');
  
  // Filtro por cuisine_type
  const { data: italianBusinesses, error: italianError } = await supabase
    .from('business_data')
    .select('business_name, slug')
    .eq('status', 'active')
    .eq('gastronomy_profiles.status', 'active')
    .eq('gastronomy_profiles.cuisine_type', 'italiana');
    
  if (!italianError) {
    console.log(`✅ Negócios com cuisine_type='italiana': ${italianBusinesses?.length}`);
    italianBusinesses?.forEach(b => console.log(`   - ${b.business_name} (${b.slug})`));
  }
  
  // Filtro por niche_key
  const { data: pizzaBusinesses, error: pizzaError } = await supabase
    .from('business_data')
    .select('business_name, slug')
    .eq('status', 'active')
    .eq('gastronomy_profiles.status', 'active')
    .eq('gastronomy_profiles.niche_key', 'pizza');
    
  if (!pizzaError) {
    console.log(`✅ Negócios com niche_key='pizza': ${pizzaBusinesses?.length}`);
    pizzaBusinesses?.forEach(b => console.log(`   - ${b.business_name} (${b.slug})`));
  }
  
  // 3. Verificar se há problemas com localização/geografia
  console.log('\n3️⃣ Verificando dados de localização...');
  
  const { data: bellaWithLocation, error: locError } = await supabase
    .from('business_data')
    .select(`
      business_name,
      slug,
      location_id,
      address:addresses!address_id(*)
    `)
    .eq('slug', 'pizzaria-bella-napoli')
    .single();
    
  if (!locError && bellaWithLocation) {
    console.log('✅ Dados de localização da Bella:');
    console.log('   - location_id:', bellaWithLocation.location_id);
    console.log('   - address_id:', bellaWithLocation.address?.id);
    console.log('   - endereço:', bellaWithLocation.address?.street_address);
    
    // Verificar se location_id é válido
    if (bellaWithLocation.location_id) {
      const { data: location, error: locationError } = await supabase
        .from('locations')
        .select('name, type, geographic_path')
        .eq('id', bellaWithLocation.location_id)
        .single();
        
      if (!locationError && location) {
        console.log('   - location:', `${location.name} (${location.type})`);
        console.log('   - geographic_path:', location.geographic_path);
      } else {
        console.log('   ❌ location_id inválido ou não encontrado');
      }
    } else {
      console.log('   ⚠️ Sem location_id (pode afetar visibilidade)');
    }
  }
  
  // 4. Verificar se Bella aparece em queries de busca por texto
  console.log('\n4️⃣ Testando busca por texto...');
  
  const { data: searchResults, error: searchError } = await supabase
    .from('business_data')
    .select('business_name, slug, category')
    .eq('status', 'active')
    .ilike('business_name', '%bella%')
    .ilike('category', '%alimentacao%');
    
  if (!searchError) {
    console.log(`✅ Busca por "bella": ${searchResults?.length} resultados`);
    searchResults?.forEach(b => console.log(`   - ${b.business_name} (${b.category})`));
  }
  
  // 5. Simular query exata que o frontend usa
  console.log('\n5️⃣ Simulando query do frontend (gastronomy.queries.ts)...');
  
  const { data: frontendResults, error: frontendError } = await supabase
    .from('business_data')
    .select(`
      *,
      address:addresses!address_id(*),
      location:locations!location_id(*),
      gastronomy_profiles!inner(
        id,
        business_id,
        niche_key,
        cuisine_type,
        price_range,
        delivery_enabled,
        takeout_enabled,
        dine_in_enabled,
        delivery_fee,
        delivery_time_min,
        delivery_time_max,
        minimum_order,
        accepts_reservations,
        has_parking,
        has_wifi,
        has_accessibility,
        seating_capacity,
        status
      )
    `)
    .eq('status', 'active')
    .eq('gastronomy_profiles.status', 'active')
    .order('business_name');
    
  if (!frontendError) {
    console.log(`✅ Query frontend: ${frontendResults?.length} resultados`);
    const bellaFrontend = frontendResults?.find(b => b.slug === 'pizzaria-bella-napoli');
    
    if (bellaFrontend) {
      console.log('✅ Bella encontrada na query do frontend!');
      console.log('   Dados completos:', {
        name: bellaFrontend.business_name,
        location: bellaFrontend.location?.name,
        niche_key: bellaFrontend.gastronomy_profiles?.niche_key,
        status: bellaFrontend.status,
        gastro_status: bellaFrontend.gastronomy_profiles?.status
      });
    } else {
      console.log('❌ Bella NÃO encontrada na query do frontend');
      console.log('   Primeiros 5 resultados:', frontendResults?.slice(0, 5).map(b => b.business_name));
    }
  }
  
  // 6. Resumo do problema
  console.log('\n📋 RESUMO DA INVESTIGAÇÃO:');
  console.log('- Query principal gastronomia:', gastroBusinesses?.some(b => b.slug === 'pizzaria-bella-napoli') ? '✅ Encontra' : '❌ Não encontra');
  console.log('- Filtro cuisine_type=italiana:', italianBusinesses?.some(b => b.slug === 'pizzaria-bella-napoli') ? '✅ Encontra' : '❌ Não encontra');
  console.log('- Filtro niche_key=pizza:', pizzaBusinesses?.some(b => b.slug === 'pizzaria-bella-napoli') ? '✅ Encontra' : '❌ Não encontra');
  console.log('- Query frontend:', frontendResults?.some(b => b.slug === 'pizzaria-bella-napoli') ? '✅ Encontra' : '❌ Não encontra');
  
  if (!gastroBusinesses?.some(b => b.slug === 'pizzaria-bella-napoli')) {
    console.log('\n🚨 PROVÁVEL CAUSA: Bella não está sendo retornada pelas queries principais');
    console.log('   Verificar se há algum filtro ou condição impedindo a visualização');
  }
}

debugGastronomyVisibility();
