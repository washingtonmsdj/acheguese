import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkSchema() {
  console.log('🔍 Verificando schema do banco remoto...\n');

  // Verificar profiles
  console.log('📋 Tabela: profiles');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  
  if (profilesError) {
    console.log('  Erro:', profilesError.message);
  } else {
    console.log('  Colunas:', profiles && profiles[0] ? Object.keys(profiles[0]) : 'Tabela vazia');
  }

  // Verificar addresses
  console.log('\n📋 Tabela: addresses');
  const { data: addresses, error: addressesError } = await supabase
    .from('addresses')
    .select('*')
    .limit(1);
  
  if (addressesError) {
    console.log('  Erro:', addressesError.message);
  } else {
    console.log('  Colunas:', addresses && addresses[0] ? Object.keys(addresses[0]) : 'Tabela vazia');
  }

  // Verificar business_data
  console.log('\n📋 Tabela: business_data');
  const { data: business, error: businessError } = await supabase
    .from('business_data')
    .select('*')
    .limit(1);
  
  if (businessError) {
    console.log('  Erro:', businessError.message);
  } else {
    console.log('  Colunas:', business && business[0] ? Object.keys(business[0]) : 'Tabela vazia');
  }

  // Verificar gastronomy_profiles
  console.log('\n📋 Tabela: gastronomy_profiles');
  const { data: gastronomy, error: gastronomyError } = await supabase
    .from('gastronomy_profiles')
    .select('*')
    .limit(1);
  
  if (gastronomyError) {
    console.log('  Erro:', gastronomyError.message);
  } else {
    console.log('  Colunas:', gastronomy && gastronomy[0] ? Object.keys(gastronomy[0]) : 'Tabela vazia');
  }

  // Verificar locations
  console.log('\n📋 Tabela: locations (bairros de Salvador)');
  const { data: locations, error: locationsError } = await supabase
    .from('locations')
    .select('id, name, type, geographic_path')
    .eq('type', 'district')
    .ilike('geographic_path', '/br/ba/salvador/%')
    .limit(10);
  
  if (locationsError) {
    console.log('  Erro:', locationsError.message);
  } else {
    console.log('  Bairros encontrados:', locations?.length || 0);
    locations?.forEach(l => {
      console.log(`    - ${l.name} (${l.geographic_path})`);
    });
  }
}

checkSchema().catch(console.error);
