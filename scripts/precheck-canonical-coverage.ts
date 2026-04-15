/**
 * Pré-check ETAPA 12: Validação de Cobertura Canônica
 * 
 * Executa análise dos dados para determinar se é seguro:
 * - Endurecer constraints (NOT NULL)
 * - Remover campos legados
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar .env.remote
dotenv.config({ path: path.resolve(process.cwd(), '.env.remote') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.error('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.remote');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TableStats {
  table: string;
  total: number;
  canonical: number;
  legacy: number;
  percentage: number;
  details: Record<string, number>;
}

async function checkUserResidences(): Promise<TableStats> {
  const { data: all } = await supabase.from('user_residences').select('id, address_id, location_id');
  
  const total = all?.length || 0;
  const withAddressId = all?.filter(r => r.address_id).length || 0;
  const withLocationId = all?.filter(r => r.location_id).length || 0;
  const withBoth = all?.filter(r => r.address_id && r.location_id).length || 0;
  const onlyLegacy = all?.filter(r => !r.address_id && !r.location_id).length || 0;

  return {
    table: 'user_residences',
    total,
    canonical: withBoth,
    legacy: onlyLegacy,
    percentage: total > 0 ? Math.round((withBoth / total) * 100) : 0,
    details: {
      with_address_id: withAddressId,
      with_location_id: withLocationId,
      with_both: withBoth,
      only_legacy: onlyLegacy,
    }
  };
}

async function checkBusinessData(): Promise<TableStats> {
  const { data: all } = await supabase.from('business_data').select('id, location_id, address_id, address, latitude, longitude');
  
  const total = all?.length || 0;
  const withLocationId = all?.filter(b => b.location_id).length || 0;
  const withAddressId = all?.filter(b => b.address_id).length || 0;
  const withBoth = all?.filter(b => b.location_id && b.address_id).length || 0;
  const onlyLegacy = all?.filter(b => !b.location_id && (b.address || b.latitude)).length || 0;

  return {
    table: 'business_data',
    total,
    canonical: withLocationId, // location_id é o mínimo
    legacy: onlyLegacy,
    percentage: total > 0 ? Math.round((withLocationId / total) * 100) : 0,
    details: {
      with_location_id: withLocationId,
      with_address_id: withAddressId,
      with_both: withBoth,
      only_legacy: onlyLegacy,
    }
  };
}

async function checkProfessionalData(): Promise<TableStats> {
  const { data: all } = await supabase.from('professional_data').select('id, location_id, address_id, metadata');
  
  const total = all?.length || 0;
  const withLocationId = all?.filter(p => p.location_id).length || 0;
  const withAddressId = all?.filter(p => p.address_id).length || 0;
  const withBoth = all?.filter(p => p.location_id && p.address_id).length || 0;
  const withMetadataLocation = all?.filter(p => p.metadata?.location && !p.location_id).length || 0;

  return {
    table: 'professional_data',
    total,
    canonical: withLocationId,
    legacy: withMetadataLocation,
    percentage: total > 0 ? Math.round((withLocationId / total) * 100) : 0,
    details: {
      with_location_id: withLocationId,
      with_address_id: withAddressId,
      with_both: withBoth,
      with_metadata_location_legacy: withMetadataLocation,
    }
  };
}

async function checkRideRequests(): Promise<TableStats> {
  const { data: all } = await supabase
    .from('ride_requests')
    .select('id, pickup_address_id, dropoff_address_id, pickup_location_id, dropoff_location_id, origin, destination');
  
  const total = all?.length || 0;
  const withPickupAddressId = all?.filter(r => r.pickup_address_id).length || 0;
  const withDropoffAddressId = all?.filter(r => r.dropoff_address_id).length || 0;
  const withPickupLocationId = all?.filter(r => r.pickup_location_id).length || 0;
  const withDropoffLocationId = all?.filter(r => r.dropoff_location_id).length || 0;
  const withAll4 = all?.filter(r => 
    r.pickup_address_id && r.dropoff_address_id && 
    r.pickup_location_id && r.dropoff_location_id
  ).length || 0;
  const onlyLegacy = all?.filter(r => 
    !r.pickup_address_id && (r.origin || r.pickup_location)
  ).length || 0;

  return {
    table: 'ride_requests',
    total,
    canonical: withAll4,
    legacy: onlyLegacy,
    percentage: total > 0 ? Math.round((withAll4 / total) * 100) : 0,
    details: {
      with_pickup_address_id: withPickupAddressId,
      with_dropoff_address_id: withDropoffAddressId,
      with_pickup_location_id: withPickupLocationId,
      with_dropoff_location_id: withDropoffLocationId,
      with_all_4_canonical: withAll4,
      only_legacy: onlyLegacy,
    }
  };
}

async function main() {
  console.log('\n🔍 ETAPA 12 — PRÉ-CHECK DE COBERTURA CANÔNICA\n');
  console.log('Analisando estado atual dos dados...\n');

  try {
    const [residences, business, professional, rides] = await Promise.all([
      checkUserResidences(),
      checkBusinessData(),
      checkProfessionalData(),
      checkRideRequests(),
    ]);

    const stats = [residences, business, professional, rides];

    // Exibir resultados
    stats.forEach(stat => {
      console.log(`\n━━━ ${stat.table.toUpperCase()} ━━━`);
      console.log(`Total: ${stat.total}`);
      console.log(`Canônico: ${stat.canonical} (${stat.percentage}%)`);
      console.log(`Legado: ${stat.legacy}`);
      console.log('\nDetalhes:');
      Object.entries(stat.details).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    });

    // Recomendações
    console.log('\n\n━━━ RECOMENDAÇÕES ━━━\n');

    if (residences.percentage === 100) {
      console.log('✅ user_residences: SEGURO para hardening');
      console.log('   → Pode tornar address_id e location_id NOT NULL');
      console.log('   → Pode remover campos legados (street, number, etc.)');
    } else {
      console.log('⚠️  user_residences: NÃO SEGURO para hardening');
      console.log(`   → Apenas ${residences.percentage}% migrados`);
      console.log('   → Executar migração antes de endurecer');
    }

    if (rides.percentage === 100) {
      console.log('\n✅ ride_requests: SEGURO para hardening');
      console.log('   → Pode tornar 4 campos canônicos NOT NULL');
      console.log('   → Pode remover campos legados (origin, destination, etc.)');
    } else {
      console.log('\n⚠️  ride_requests: NÃO SEGURO para hardening');
      console.log(`   → Apenas ${rides.percentage}% migrados`);
      console.log('   → Executar migração antes de endurecer');
    }

    if (business.percentage >= 95) {
      console.log('\n✅ business_data: location_id bem coberto');
      console.log('   → Pode tornar location_id NOT NULL');
      console.log('   → address_id continua opcional (correto)');
      console.log('   → Pode remover campos legados (address, lat, lng)');
    } else {
      console.log('\n⚠️  business_data: location_id precisa atenção');
      console.log(`   → Apenas ${business.percentage}% migrados`);
    }

    if (professional.percentage >= 95) {
      console.log('\n✅ professional_data: location_id bem coberto');
      console.log('   → Pode tornar location_id NOT NULL');
      console.log('   → address_id continua opcional (correto)');
      console.log('   → Pode limpar metadata.location legado');
    } else {
      console.log('\n⚠️  professional_data: location_id precisa atenção');
      console.log(`   → Apenas ${professional.percentage}% migrados`);
    }

    console.log('\n');

    // Exit code baseado em segurança
    const allSafe = 
      residences.percentage === 100 &&
      rides.percentage === 100 &&
      business.percentage >= 95 &&
      professional.percentage >= 95;

    if (allSafe) {
      console.log('✅ SEGURO PARA PROSSEGUIR COM CLEANUP\n');
      process.exit(0);
    } else {
      console.log('⚠️  EXECUTAR MIGRAÇÕES ANTES DO CLEANUP\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Erro ao executar pré-check:', error);
    process.exit(1);
  }
}

main();
