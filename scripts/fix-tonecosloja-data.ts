/**
 * Script para corrigir dados da Tone Cos Loja
 * Adiciona slug e geographic_path necessários
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTonesCosLoja() {
  console.log('🔧 Iniciando correção da Tone Cos Loja...\n');

  // 1. Buscar o profile pelo nome
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, username')
    .ilike('name', '%Tone Cos%')
    .limit(5);

  if (profileError || !profiles || profiles.length === 0) {
    console.error('❌ Profile não encontrado:', profileError?.message);
    console.log('Tentando buscar todos os profiles de business...');
    
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, name, username, type')
      .eq('type', 'business')
      .limit(10);
    
    console.log('Profiles de business encontrados:', allProfiles);
    return;
  }

  console.log('✅ Profiles encontrados:', profiles.length);
  profiles.forEach(p => console.log(`   - ${p.name} (${p.username})`));
  
  const profile = profiles[0];
  console.log('\n📌 Usando profile:', profile.id, '-', profile.name);

  // 2. Buscar o business
  const { data: business, error: businessError } = await (supabase as any)
    .from('business_data')
    .select('id, profile_id, business_name, slug, location_id')
    .eq('profile_id', profile.id)
    .single();

  if (businessError || !business) {
    console.error('❌ Business não encontrado:', businessError?.message);
    return;
  }

  console.log('✅ Business encontrado:', business.id);
  console.log('   Nome:', business.business_name);
  console.log('   Slug atual:', business.slug || '(vazio)');
  console.log('   Location ID atual:', business.location_id || '(vazio)');

  // 3. Buscar Salvador
  const { data: salvador, error: salvadorError } = await supabase
    .from('locations')
    .select('id, name, geographic_path')
    .eq('type', 'city')
    .eq('name', 'Salvador')
    .eq('geographic_path', '/br/ba/salvador')
    .single();

  if (salvadorError || !salvador) {
    console.error('❌ Salvador não encontrado:', salvadorError?.message);
    return;
  }

  console.log('✅ Salvador encontrado:', salvador.id);

  // 4. Buscar ou criar o bairro "Nordeste de Amaralina"
  let { data: district, error: districtError } = await supabase
    .from('locations')
    .select('id, name, geographic_path')
    .eq('type', 'district')
    .eq('name', 'Nordeste de Amaralina')
    .eq('parent_id', salvador.id)
    .maybeSingle();

  if (!district) {
    console.log('📍 Criando bairro Nordeste de Amaralina...');
    
    const { data: newDistrict, error: createError } = await supabase
      .from('locations')
      .insert({
        name: 'Nordeste de Amaralina',
        full_name: 'Nordeste de Amaralina, Salvador, BA',
        type: 'district',
        parent_id: salvador.id,
        geographic_path: '/br/ba/salvador/nordeste-de-amaralina',
        slug: 'nordeste-de-amaralina',
        metadata: {},
      })
      .select()
      .single();

    if (createError || !newDistrict) {
      console.error('❌ Erro ao criar bairro:', createError?.message);
      return;
    }

    district = newDistrict;
    console.log('✅ Bairro criado:', district.id);
  } else {
    console.log('✅ Bairro encontrado:', district.id, '-', district.name);
  }

  // 5. Atualizar business_data
  console.log('\n🔄 Atualizando business_data...');
  
  const { error: updateError } = await (supabase as any)
    .from('business_data')
    .update({
      slug: 'tone-cos-loja',
      location_id: district.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', business.id);

  if (updateError) {
    console.error('❌ Erro ao atualizar business:', updateError.message);
    return;
  }

  console.log('✅ Business atualizado com sucesso!');

  // 6. Verificar o resultado
  console.log('\n📊 Verificação final:');
  
  const { data: updated, error: verifyError } = await (supabase as any)
    .from('business_data')
    .select(`
      id,
      profile_id,
      business_name,
      slug,
      location_id,
      location:locations!location_id(
        id,
        name,
        geographic_path
      )
    `)
    .eq('id', business.id)
    .single();

  if (verifyError || !updated) {
    console.error('❌ Erro na verificação:', verifyError?.message);
    return;
  }

  console.log('✅ Dados atualizados:');
  console.log('   Business:', updated.business_name);
  console.log('   Slug:', updated.slug);
  console.log('   Location:', updated.location?.name);
  console.log('   Geographic Path:', updated.location?.geographic_path);
  console.log('\n🎉 URL canônica: /empresas/ba/salvador/nordeste-de-amaralina/tone-cos-loja');
}

fixTonesCosLoja()
  .then(() => {
    console.log('\n✅ Script concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro no script:', error);
    process.exit(1);
  });
