/**
 * ETAPA 12B: Validação pós-aplicação das migrations no banco remoto
 * 
 * Valida que as migrations foram aplicadas corretamente e gera relatório
 */

import { createServiceRoleClient, getSupabaseConfig } from './supabase-client';

const supabaseConfig = getSupabaseConfig();

const supabase = createServiceRoleClient();

interface TableValidation {
  table: string;
  total: number;
  canonical_complete: number;
  failed: number;
  details: Record<string, unknown>;
}

async function validateUserResidences(): Promise<TableValidation> {
  console.log('\n⏳ Validando user_residences...');
  
  const { data, error, count } = await supabase
    .from('user_residences')
    .select('id, address_id, location_id', { count: 'exact' });
  
  if (error) {
    console.error('❌ Erro:', error.message);
    return {
      table: 'user_residences',
      total: 0,
      canonical_complete: 0,
      failed: 0,
      details: { error: error.message },
    };
  }
  
  const total = count || 0;
  const withAddressId = data?.filter(r => r.address_id).length || 0;
  const withLocationId = data?.filter(r => r.location_id).length || 0;
  const canonical_complete = data?.filter(r => r.address_id && r.location_id).length || 0;
  
  return {
    table: 'user_residences',
    total,
    canonical_complete,
    failed: total - canonical_complete,
    details: {
      with_address_id: withAddressId,
      with_location_id: withLocationId,
      percentage: total > 0 ? Math.round((canonical_complete / total) * 100) : 100,
    },
  };
}

async function validateBusinessData(): Promise<TableValidation> {
  console.log('\n⏳ Validando business_data...');
  
  const { data, error, count } = await supabase
    .from('business_data')
    .select('id, location_id, address_id', { count: 'exact' });
  
  if (error) {
    console.error('❌ Erro:', error.message);
    return {
      table: 'business_data',
      total: 0,
      canonical_complete: 0,
      failed: 0,
      details: { error: error.message },
    };
  }
  
  const total = count || 0;
  const withLocationId = data?.filter(b => b.location_id).length || 0;
  const withAddressId = data?.filter(b => b.address_id).length || 0;
  
  return {
    table: 'business_data',
    total,
    canonical_complete: withLocationId,
    failed: total - withLocationId,
    details: {
      with_location_id: withLocationId,
      with_address_id: withAddressId,
      percentage: total > 0 ? Math.round((withLocationId / total) * 100) : 100,
    },
  };
}

async function validateProfessionalData(): Promise<TableValidation> {
  console.log('\n⏳ Validando professional_data...');
  
  const { data, error, count } = await supabase
    .from('professional_data')
    .select('id, location_id, address_id, metadata', { count: 'exact' });
  
  if (error) {
    console.error('❌ Erro:', error.message);
    return {
      table: 'professional_data',
      total: 0,
      canonical_complete: 0,
      failed: 0,
      details: { error: error.message },
    };
  }
  
  const total = count || 0;
  const withLocationId = data?.filter(p => p.location_id).length || 0;
  const withAddressId = data?.filter(p => p.address_id).length || 0;
  const withMetadataLocation = data?.filter(p => p.metadata?.location).length || 0;
  
  return {
    table: 'professional_data',
    total,
    canonical_complete: withLocationId,
    failed: total - withLocationId,
    details: {
      with_location_id: withLocationId,
      with_address_id: withAddressId,
      with_metadata_location: withMetadataLocation,
      percentage: total > 0 ? Math.round((withLocationId / total) * 100) : 100,
    },
  };
}

async function validateRideRequests(): Promise<TableValidation> {
  console.log('\n⏳ Validando ride_requests...');
  
  const { data, error, count } = await supabase
    .from('ride_requests')
    .select('id, pickup_address_id, dropoff_address_id, pickup_location_id, dropoff_location_id', { count: 'exact' });
  
  if (error) {
    console.error('❌ Erro:', error.message);
    return {
      table: 'ride_requests',
      total: 0,
      canonical_complete: 0,
      failed: 0,
      details: { error: error.message },
    };
  }
  
  const total = count || 0;
  const canonical_complete = data?.filter(r => 
    r.pickup_address_id && r.dropoff_address_id && 
    r.pickup_location_id && r.dropoff_location_id
  ).length || 0;
  
  return {
    table: 'ride_requests',
    total,
    canonical_complete,
    failed: total - canonical_complete,
    details: {
      with_pickup_address_id: data?.filter(r => r.pickup_address_id).length || 0,
      with_dropoff_address_id: data?.filter(r => r.dropoff_address_id).length || 0,
      with_pickup_location_id: data?.filter(r => r.pickup_location_id).length || 0,
      with_dropoff_location_id: data?.filter(r => r.dropoff_location_id).length || 0,
      percentage: total > 0 ? Math.round((canonical_complete / total) * 100) : 100,
    },
  };
}

async function checkRemovedColumns(): Promise<Record<string, string[]>> {
  console.log('\n📋 Verificando colunas removidas...');
  
  const removed: Record<string, string[]> = {};
  
  const tables = {
    user_residences: ['street', 'number', 'complement', 'neighborhood', 'city', 'state', 'postal_code'],
    ride_requests: ['origin', 'destination', 'pickup_location', 'dropoff_location'],
    business_data: ['address', 'neighborhood', 'latitude', 'longitude'],
  };
  
  for (const [table, columns] of Object.entries(tables)) {
    removed[table] = [];
    for (const col of columns) {
      try {
        const { error } = await supabase
          .from(table)
          .select(col)
          .limit(1);
        
        if (error && (error.message.includes('column') || error.code === '42703')) {
          removed[table].push(col);
        }
      } catch (e) {
        removed[table].push(col);
      }
    }
  }
  
  return removed;
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  ETAPA 12B: VALIDAÇÃO NO BANCO REMOTO');
  console.log('═══════════════════════════════════════════════════');
  console.log(`\n📍 Ambiente: ${supabaseConfig.url ?? 'Supabase configurado'}\n`);
  
  try {
    console.log('═══ VALIDAÇÃO DOS DADOS ═══');
    
    const results: TableValidation[] = [];
    
    results.push(await validateUserResidences());
    results.push(await validateBusinessData());
    results.push(await validateProfessionalData());
    results.push(await validateRideRequests());
    
    console.log('\n═══ COLUNAS LEGADAS REMOVIDAS ═══');
    const removed = await checkRemovedColumns();
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  RELATÓRIO FINAL');
    console.log('═══════════════════════════════════════════════════\n');
    
    for (const result of results) {
      console.log(`\n${result.table.toUpperCase()}:`);
      console.log(`  Total de registros: ${result.total}`);
      console.log(`  Canônico completo: ${result.canonical_complete} (${result.details.percentage}%)`);
      console.log(`  Falhas: ${result.failed}`);
      console.log(`  Detalhes:`, JSON.stringify(result.details, null, 2));
    }
    
    console.log('\n\nCOLUNAS REMOVIDAS:');
    for (const [table, cols] of Object.entries(removed)) {
      console.log(`\n${table}:`);
      if (cols.length > 0) {
        cols.forEach(col => console.log(`  ✅ ${col}`));
      } else {
        console.log(`  ⚠️  Nenhuma coluna removida (migrations não aplicadas)`);
      }
    }
    
    const allComplete = results.every(r => r.failed === 0);
    const allColumnsRemoved = Object.values(removed).every(cols => cols.length > 0);
    
    if (allComplete && allColumnsRemoved) {
      console.log('\n✅ ETAPA 12B CONCLUÍDA COM SUCESSO\n');
    } else {
      console.log('\n⚠️  ETAPA 12B PARCIALMENTE CONCLUÍDA\n');
      if (!allComplete) {
        console.log('  - Alguns registros não estão 100% canônicos');
      }
      if (!allColumnsRemoved) {
        console.log('  - Algumas colunas legadas ainda existem (migrations não aplicadas)');
      }
    }
    
  } catch (error) {
    console.error('\n❌ ERRO:', error);
    process.exit(1);
  }
}

main();
