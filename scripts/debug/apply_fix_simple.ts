import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function applyFix() {
  console.log('🔧 Aplicando fix de gastronomia...\n');

  // 0. Buscar ou criar usuário admin
  console.log('👤 Verificando usuário admin...');
  const { data: adminUser } = await supabase.auth.admin.listUsers();
  let userId = adminUser?.users?.[0]?.id;
  
  if (!userId) {
    console.log('⚠️  Nenhum usuário encontrado. Usando ID genérico.');
    // Usar um UUID genérico para o sistema
    userId = '00000000-0000-0000-0000-000000000000';
  } else {
    console.log('✅ Usuário encontrado:', userId);
  }

  // 1. Limpar dados antigos
  console.log('🧹 Limpando dados antigos...');
  
  const slugs = [
    'restaurante-barra-mar',
    'bar-do-rio',
    'casa-da-moqueca',
    'pizzaria-bella-napoli',
    'sushi-house-pituba'
  ];

  // Buscar business_data IDs
  const { data: businesses } = await supabase
    .from('business_data')
    .select('id')
    .in('slug', slugs);

  if (businesses && businesses.length > 0) {
    const businessIds = businesses.map(b => b.id);
    
    // Deletar gastronomy_profiles
    await supabase.from('gastronomy_profiles').delete().in('business_id', businessIds);
    
    // Deletar business_data
    await supabase.from('business_data').delete().in('id', businessIds);
  }

  // Deletar addresses
  const addressIds = [
    'e1111111-1111-1111-1111-111111111111',
    'e2222222-2222-2222-2222-222222222222',
    'e3333333-3333-3333-3333-333333333333',
    'e4444444-4444-4444-4444-444444444444',
    'e5555555-5555-5555-5555-555555555555'
  ];
  await supabase.from('addresses').delete().in('id', addressIds);

  // Deletar profiles
  const profileIds = [
    'p1111111-1111-1111-1111-111111111111',
    'p2222222-2222-2222-2222-222222222222',
    'p3333333-3333-3333-3333-333333333333',
    'p4444444-4444-4444-4444-444444444444',
    'p5555555-5555-5555-5555-555555555555'
  ];
  await supabase.from('profiles').delete().in('id', profileIds);

  console.log('✅ Dados antigos removidos\n');

  // 2. Criar profiles
  console.log('👤 Criando profiles...');
  const { data: newProfiles, error: profilesError } = await supabase.from('profiles').insert([
    { user_id: userId, name: 'Restaurante Barra Mar', profile_type: 'business', is_active: true },
    { user_id: userId, name: 'Bar do Rio', profile_type: 'business', is_active: true },
    { user_id: userId, name: 'Casa da Moqueca', profile_type: 'business', is_active: true },
    { user_id: userId, name: 'Pizzaria Bella Napoli', profile_type: 'business', is_active: true },
    { user_id: userId, name: 'Sushi House Pituba', profile_type: 'business', is_active: true }
  ]).select('id, name');
  
  if (profilesError) {
    console.error('Erro profiles:', profilesError);
    return;
  }
  console.log('✅ Profiles criados:', newProfiles?.length);
  
  const profileMap = new Map(newProfiles?.map(p => [p.name, p.id]) || []);

  // 3. Buscar IDs dos bairros
  console.log('📍 Buscando IDs dos bairros...');
  const { data: barraLoc } = await supabase.from('locations').select('id').eq('geographic_path', '/br/ba/salvador/barra').single();
  const { data: rioLoc } = await supabase.from('locations').select('id').eq('geographic_path', '/br/ba/salvador/rio-vermelho').single();
  const { data: peloLoc } = await supabase.from('locations').select('id').ilike('geographic_path', '/br/ba/salvador/%').ilike('name', '%centro%').limit(1).single();
  const { data: itaiLoc } = await supabase.from('locations').select('id').eq('geographic_path', '/br/ba/salvador/itaigara').single();
  const { data: pituLoc } = await supabase.from('locations').select('id').eq('geographic_path', '/br/ba/salvador/pituba').single();

  console.log('✅ IDs encontrados\n');

  // 4. Criar addresses
  console.log('📍 Criando endereços...');
  const { data: newAddresses, error: addressesError } = await supabase.from('addresses').insert([
    { street: 'Av. Oceânica', number: '123', postal_code: '40140-000', location_id: barraLoc?.id },
    { street: 'Rua da Paciência', number: '456', postal_code: '41940-000', location_id: rioLoc?.id },
    { street: 'Largo do Pelourinho', number: '789', postal_code: '40026-280', location_id: peloLoc?.id },
    { street: 'Av. Paulo VI', number: '321', postal_code: '41810-001', location_id: itaiLoc?.id },
    { street: 'Rua das Hortênsias', number: '654', postal_code: '41830-020', location_id: pituLoc?.id }
  ]).select('id, street');
  
  if (addressesError) {
    console.error('Erro addresses:', addressesError);
    return;
  }
  console.log('✅ Endereços criados:', newAddresses?.length);
  
  const addressMap = new Map([
    ['Av. Oceânica', newAddresses?.[0]?.id],
    ['Rua da Paciência', newAddresses?.[1]?.id],
    ['Largo do Pelourinho', newAddresses?.[2]?.id],
    ['Av. Paulo VI', newAddresses?.[3]?.id],
    ['Rua das Hortênsias', newAddresses?.[4]?.id]
  ]);

  // 5. Criar business_data
  console.log('🏢 Criando business_data...');
  const { data: newBusinesses, error: businessError } = await supabase.from('business_data').insert([
    {
      profile_id: profileMap.get('Restaurante Barra Mar'),
      business_name: 'Restaurante Barra Mar',
      slug: 'restaurante-barra-mar',
      description: 'Restaurante especializado em frutos do mar com vista privilegiada para o Farol da Barra',
      location_id: barraLoc?.id,
      address_id: addressMap.get('Av. Oceânica'),
      email: 'contato@barramar.com.br',
      website: 'https://barramar.com.br',
      business_role: 'standalone',
      status: 'active',
      is_premium: false,
      rating: 4.5,
      total_reviews: 127
    },
    {
      profile_id: profileMap.get('Bar do Rio'),
      business_name: 'Bar do Rio',
      slug: 'bar-do-rio',
      description: 'Bar tradicional do Rio Vermelho com música ao vivo e petiscos',
      location_id: rioLoc?.id,
      address_id: addressMap.get('Rua da Paciência'),
      email: 'contato@bardorio.com.br',
      website: 'https://bardorio.com.br',
      business_role: 'standalone',
      status: 'active',
      is_premium: false,
      rating: 4.3,
      total_reviews: 89
    },
    {
      profile_id: profileMap.get('Casa da Moqueca'),
      business_name: 'Casa da Moqueca',
      slug: 'casa-da-moqueca',
      description: 'Culinária baiana autêntica no coração do Pelourinho',
      location_id: peloLoc?.id,
      address_id: addressMap.get('Largo do Pelourinho'),
      email: 'contato@casadamoqueca.com.br',
      website: 'https://casadamoqueca.com.br',
      business_role: 'standalone',
      status: 'active',
      is_premium: true,
      rating: 4.7,
      total_reviews: 203
    },
    {
      profile_id: profileMap.get('Pizzaria Bella Napoli'),
      business_name: 'Pizzaria Bella Napoli',
      slug: 'pizzaria-bella-napoli',
      description: 'Pizzas artesanais em forno a lenha com receitas tradicionais italianas',
      location_id: itaiLoc?.id,
      address_id: addressMap.get('Av. Paulo VI'),
      email: 'contato@bellanapoli.com.br',
      website: 'https://bellanapoli.com.br',
      business_role: 'standalone',
      status: 'active',
      is_premium: false,
      rating: 4.6,
      total_reviews: 156
    },
    {
      profile_id: profileMap.get('Sushi House Pituba'),
      business_name: 'Sushi House Pituba',
      slug: 'sushi-house-pituba',
      description: 'Culinária japonesa contemporânea com rodízio e à la carte',
      location_id: pituLoc?.id,
      address_id: addressMap.get('Rua das Hortênsias'),
      email: 'contato@sushihouse.com.br',
      website: 'https://sushihouse.com.br',
      business_role: 'standalone',
      status: 'active',
      is_premium: false,
      rating: 4.4,
      total_reviews: 98
    }
  ]).select('id, business_name');
  
  if (businessError) {
    console.error('Erro business_data:', businessError);
    return;
  }
  console.log('✅ Business_data criados:', newBusinesses?.length);

  // 6. Criar gastronomy_profiles
  console.log('🍽️  Criando gastronomy_profiles...');
  const { error: gastronomyError } = await supabase.from('gastronomy_profiles').insert([
    {
      business_id: newBusinesses?.[0]?.id,
      cuisine_type: 'Frutos do Mar',
      price_range: '$$$',
      delivery_enabled: false,
      takeout_enabled: true,
      dine_in_enabled: true,
      accepts_reservations: true,
      has_parking: true,
      has_wifi: true,
      has_accessibility: false,
      has_live_music: true,
      status: 'active'
    },
    {
      business_id: newBusinesses?.[1]?.id,
      cuisine_type: 'Brasileira',
      price_range: '$$',
      delivery_enabled: false,
      takeout_enabled: true,
      dine_in_enabled: true,
      accepts_reservations: false,
      has_parking: false,
      has_wifi: true,
      has_accessibility: false,
      has_live_music: true,
      status: 'active'
    },
    {
      business_id: newBusinesses?.[2]?.id,
      cuisine_type: 'Baiana',
      price_range: '$$',
      delivery_enabled: false,
      takeout_enabled: true,
      dine_in_enabled: true,
      accepts_reservations: true,
      has_parking: false,
      has_wifi: true,
      has_accessibility: false,
      has_live_music: true,
      status: 'active'
    },
    {
      business_id: newBusinesses?.[3]?.id,
      cuisine_type: 'Italiana',
      price_range: '$$',
      delivery_enabled: true,
      takeout_enabled: true,
      dine_in_enabled: true,
      accepts_reservations: false,
      has_parking: true,
      has_wifi: true,
      has_accessibility: false,
      has_live_music: false,
      status: 'active'
    },
    {
      business_id: newBusinesses?.[4]?.id,
      cuisine_type: 'Japonesa',
      price_range: '$$$',
      delivery_enabled: true,
      takeout_enabled: true,
      dine_in_enabled: true,
      accepts_reservations: true,
      has_parking: true,
      has_wifi: true,
      has_accessibility: false,
      has_live_music: false,
      status: 'active'
    }
  ]);
  if (gastronomyError) console.error('Erro gastronomy_profiles:', gastronomyError);
  else console.log('✅ Gastronomy_profiles criados\n');

  // 7. Validar
  console.log('📊 Validando...');
  const { data, error } = await supabase
    .from('business_data')
    .select(`
      business_name,
      slug,
      location:locations!location_id(geographic_path),
      gastronomy_profile:gastronomy_profiles!business_id(cuisine_type, price_range)
    `)
    .in('slug', slugs);

  if (error) {
    console.error('❌ Erro na validação:', error);
  } else {
    console.log(`\n✅ ${data.length} empresas de gastronomia criadas:\n`);
    data.forEach((b: any) => {
      console.log(`  - ${b.business_name}`);
      console.log(`    Slug: ${b.slug}`);
      console.log(`    Path: ${b.location?.geographic_path}`);
      console.log(`    Tipo: ${b.gastronomy_profile?.[0]?.cuisine_type} (${b.gastronomy_profile?.[0]?.price_range})\n`);
    });
  }

  console.log('🎉 Fix aplicado com sucesso!');
}

applyFix().catch(console.error);
