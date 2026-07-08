/**
 * Validates that active businesses use a district location, not a city.
 *
 * Businesses without a district-level location cannot generate canonical
 * public URLs safely.
 */

import { createAnonClient } from './lib/supabase-client';

const supabase = createAnonClient();

interface InvalidBusiness {
  profile_id: string;
  name: string;
  slug: string;
  location_id: string;
  location_name: string;
  location_level: string;
  geographic_path: string;
}

interface BusinessLocationRow {
  name?: string | null;
  type?: string | null;
  geographic_path?: string | null;
}

interface ActiveBusinessRow {
  profile_id: string;
  business_name: string;
  slug: string;
  location_id: string;
  location?: BusinessLocationRow | BusinessLocationRow[] | null;
}

function resolveBusinessLocation(row: ActiveBusinessRow): BusinessLocationRow | null {
  if (!row.location) return null;
  return Array.isArray(row.location) ? (row.location[0] ?? null) : row.location;
}

async function validateBusinessDistrict() {
  console.log('Validando empresas com bairro obrigatorio...\n');

  const { data: businesses, error } = await supabase
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
    .eq('status', 'active');

  if (error) {
    console.error('Erro ao buscar empresas:', error);
    process.exit(1);
  }

  if (!businesses || businesses.length === 0) {
    console.log('Nenhuma empresa encontrada.\n');
    return;
  }

  const businessRows = (businesses ?? []) as ActiveBusinessRow[];
  const invalidBusinesses = businessRows.filter((business) => {
    const location = resolveBusinessLocation(business);
    return !location || location.type !== 'district';
  });

  if (invalidBusinesses.length === 0) {
    console.log('Todas as empresas ativas tem location_id apontando para bairro/district.\n');
    console.log(`Validacao completa: ${businesses.length} empresas validas, 0 invalidas`);
    return;
  }

  const invalid: InvalidBusiness[] = invalidBusinesses.map((business) => {
    const location = resolveBusinessLocation(business);
    return {
      profile_id: business.profile_id,
      name: business.business_name,
      slug: business.slug,
      location_id: business.location_id,
      location_name: location?.name || 'N/A',
      location_level: location?.type || 'N/A',
      geographic_path: location?.geographic_path || 'N/A',
    };
  });

  console.log(`ATENCAO: ${invalid.length} empresas ativas com location_id invalido\n`);
  console.log(
    'Empresas devem ter location_id apontando para bairro/district (type=district), nao cidade (type=city)\n',
  );

  console.log('='.repeat(72));
  invalid.forEach((business, index) => {
    console.log(`\n${index + 1}. ${business.name}`);
    console.log(`   Profile ID: ${business.profile_id}`);
    console.log(`   Slug: ${business.slug}`);
    console.log(`   Location: ${business.location_name} (type: ${business.location_level})`);
    console.log(`   Geographic Path: ${business.geographic_path}`);
    console.log(`   Problema: Location e ${business.location_level}, deveria ser district`);
  });
  console.log(`\n${'='.repeat(72)}`);

  console.log('\nACAO NECESSARIA:');
  console.log('1. Atualizar location_id de cada empresa para apontar para um bairro especifico');
  console.log('2. Exemplo SQL:');
  console.log(`
UPDATE business_data
   SET location_id = (
         SELECT id
           FROM locations
          WHERE parent_id = business_data.location_id
            AND level = 4
            AND status = 'active'
          LIMIT 1
       )
 WHERE profile_id = '<profile_id>';
  `);
  console.log('\n3. Ou criar bairro padrao se nao existir:');
  console.log(`
-- Criar bairro "Centro" para cidade sem bairros
INSERT INTO locations (name, full_name, geographic_path, parent_id, level, status)
VALUES (
  'Centro',
  'Centro, <Cidade>, <Estado>, Brasil',
  '/br/<uf>/<cidade>/centro',
  '<city_location_id>',
  4,
  'active'
);
  `);

  console.log(`\nResumo: ${invalid.length} empresas precisam de correcao`);
  process.exit(1);
}

void validateBusinessDistrict();
