/**
 * Script de Validação: Empresas Devem Ter Bairro Obrigatório
 * 
 * Valida que todas as empresas ativas têm location_id apontando para
 * bairro/district (level=4), não para cidade (level=3).
 * 
 * Empresas sem bairro são inválidas e não podem gerar URL canônica.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente do .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
  console.log('🔍 Validando empresas com bairro obrigatório...\n');

  // Buscar todas as empresas ativas com suas locations
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
    console.error('❌ Erro ao buscar empresas:', error);
    process.exit(1);
  }

  if (!businesses || businesses.length === 0) {
    console.log('✅ Nenhuma empresa encontrada.\n');
    return;
  }

  // Filtrar empresas inválidas (sem location ou location não é district)
  const businessRows = (businesses ?? []) as ActiveBusinessRow[];
  const invalidBusinesses = businessRows.filter((business) => {
    const location = resolveBusinessLocation(business);
    return !location || location.type !== 'district';
  });

  if (invalidBusinesses.length === 0) {
    console.log('✅ Todas as empresas ativas têm location_id apontando para bairro/district.\n');
    console.log(`📊 Validação completa: ${businesses.length} empresas válidas, 0 inválidas`);
    return;
  }

  // Formatar dados
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

  console.log(`❌ ATENÇÃO: ${invalid.length} empresas ativas com location_id inválido\n`);
  console.log('Empresas devem ter location_id apontando para bairro/district (type=district), não cidade (type=city)\n');

  console.log('═══════════════════════════════════════════════════════════════════════════');
  invalid.forEach((b, i) => {
    console.log(`\n${i + 1}. ${b.name}`);
    console.log(`   Profile ID: ${b.profile_id}`);
    console.log(`   Slug: ${b.slug}`);
    console.log(`   Location: ${b.location_name} (type: ${b.location_level})`);
    console.log(`   Geographic Path: ${b.geographic_path}`);
    console.log(`   ❌ Problema: Location é ${b.location_level}, deveria ser district`);
  });
  console.log('\n═══════════════════════════════════════════════════════════════════════════');

  console.log('\n📋 AÇÃO NECESSÁRIA:');
  console.log('1. Atualizar location_id de cada empresa para apontar para um bairro específico');
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
  console.log('\n3. Ou criar bairro padrão se não existir:');
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

  console.log(`\n📊 Resumo: ${invalid.length} empresas precisam de correção`);
  process.exit(1);
}

validateBusinessDistrict();
