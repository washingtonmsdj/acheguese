/**
 * Script de Correção: Atualizar Empresas para Ter Bairro Obrigatório
 * 
 * Corrige empresas com location_id apontando para cidade,
 * movendo-as para um bairro padrão "Centro" da mesma cidade.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente do .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBusinessDistrict() {
  console.log('🔧 Corrigindo empresas sem bairro...\n');

  // 1. Buscar empresas inválidas
  const { data: invalidBusinesses, error: fetchError } = await supabase
    .from('business_data')
    .select(`
      profile_id,
      business_name,
      slug,
      location_id,
      location:locations!location_id(
        id,
        name,
        type,
        geographic_path
      )
    `)
    .eq('status', 'active')
    .neq('location.type', 'district') as any;

  if (fetchError) {
    console.error('❌ Erro ao buscar empresas:', fetchError);
    process.exit(1);
  }

  if (!invalidBusinesses || invalidBusinesses.length === 0) {
    console.log('✅ Nenhuma empresa precisa de correção.\n');
    return;
  }

  console.log(`📋 Encontradas ${invalidBusinesses.length} empresas para corrigir:\n`);

  for (const business of invalidBusinesses) {
    console.log(`\n🏢 ${business.business_name}`);
    console.log(`   Profile ID: ${business.profile_id}`);
    console.log(`   Slug: ${business.slug || 'N/A'}`);
    console.log(`   Location atual: ${business.location?.name || 'N/A'} (${business.location?.type || 'N/A'})`);

    // Se não tem location_id, pular
    if (!business.location_id) {
      console.log(`   ⚠️  Sem location_id, pulando...`);
      continue;
    }

    // Se location é cidade, buscar ou criar bairro "Centro"
    if (business.location?.type === 'city') {
      const cityId = business.location_id;
      const cityPath = business.location.geographic_path;

      // Buscar bairro "Centro" existente
      const { data: centroDistrict } = await supabase
        .from('locations')
        .select('id, name, geographic_path')
        .eq('parent_id', cityId)
        .eq('type', 'district')
        .eq('slug', 'centro')
        .eq('status', 'active')
        .maybeSingle();

      let districtId: string;

      if (centroDistrict) {
        console.log(`   ✓ Bairro "Centro" já existe: ${centroDistrict.geographic_path}`);
        districtId = centroDistrict.id;
      } else {
        // Criar bairro "Centro"
        const centroPath = `${cityPath}/centro`;
        const cityName = business.location.name;

        const { data: newDistrict, error: createError } = await supabase
          .from('locations')
          .insert({
            parent_id: cityId,
            type: 'district',
            slug: 'centro',
            name: 'Centro',
            full_name: `Centro, ${cityName}, Bahia, Brasil`,
            geographic_path: centroPath,
            status: 'active',
            metadata: {},
          })
          .select('id, geographic_path')
          .single();

        if (createError || !newDistrict) {
          console.log(`   ❌ Erro ao criar bairro "Centro":`, createError);
          continue;
        }

        console.log(`   ✓ Bairro "Centro" criado: ${newDistrict.geographic_path}`);
        districtId = newDistrict.id;
      }

      // Atualizar empresa para apontar para o bairro
      const { error: updateError } = await supabase
        .from('business_data')
        .update({ location_id: districtId })
        .eq('profile_id', business.profile_id);

      if (updateError) {
        console.log(`   ❌ Erro ao atualizar empresa:`, updateError);
        continue;
      }

      console.log(`   ✅ Empresa atualizada para bairro "Centro"`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════════════════');
  console.log(`\n✅ Correção concluída! ${invalidBusinesses.length} empresas processadas.`);
  console.log('\n📋 Execute o script de validação novamente para confirmar:');
  console.log('   npx tsx scripts/validate-business-district-required.ts\n');
}

fixBusinessDistrict();
