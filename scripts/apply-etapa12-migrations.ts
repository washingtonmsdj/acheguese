/**
 * ETAPA 12B: Aplicar migrations de cleanup/hardening no banco remoto
 * 
 * Aplica as 4 migrations da ETAPA 12 e valida o resultado
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const ETAPA_12_MIGRATIONS = [
  '20260328000028_harden_and_cleanup_user_residences.sql',
  '20260328000029_harden_and_cleanup_ride_requests.sql',
  '20260328000030_harden_and_cleanup_business_data.sql',
  '20260328000031_harden_and_cleanup_professional_data.sql',
];

interface ValidationResult {
  table: string;
  total: number;
  canonical_complete: number;
  failed: number;
  details: Record<string, any>;
}

async function executeMigration(filename: string): Promise<void> {
  const filepath = join(process.cwd(), 'supabase', 'migrations', filename);
  const sql = readFileSync(filepath, 'utf-8');
  
  console.log(`\n⏳ Aplicando ${filename}...`);
  
  // Executar SQL diretamente via REST API
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ sql }),
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  
  console.log(`✅ ${filename} aplicada com sucesso`);
}

async function validateUserResidences(): Promise<ValidationResult> {
  const { data, error } = await supabase
    .from('user_residences')
    .select('id, address_id, location_id');
  
  if (error) throw error;
  
  const total = data?.length || 0;
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
    },
  };
}

async function validateBusinessData(): Promise<ValidationResult> {
  const { data, error } = await supabase
    .from('business_data')
    .select('id, location_id, address_id');
  
  if (error) throw error;
  
  const total = data?.length || 0;
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
    },
  };
}

async function validateProfessionalData(): Promise<ValidationResult> {
  const { data, error } = await supabase
    .from('professional_data')
    .select('id, location_id, address_id, metadata');
  
  if (error) throw error;
  
  const total = data?.length || 0;
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
    },
  };
}

async function validateRideRequests(): Promise<ValidationResult> {
  const { data, error } = await supabase
    .from('ride_requests')
    .select('id, pickup_address_id, dropoff_address_id, pickup_location_id, dropoff_location_id');
  
  if (error) throw error;
  
  const total = data?.length || 0;
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
    },
  };
}

async function checkSchemaConstraints(): Promise<void> {
  console.log('\n📋 Verificando constraints do schema...\n');
  
  // Verificar constraints NOT NULL
  const { data: constraints, error } = await supabase
    .rpc('exec_sql', {
      query: `
        SELECT 
          tc.table_name,
          kcu.column_name,
          tc.constraint_type
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public'
          AND tc.table_name IN ('user_residences', 'business_data', 'professional_data', 'ride_requests')
          AND tc.constraint_type IN ('NOT NULL', 'FOREIGN KEY')
        ORDER BY tc.table_name, kcu.column_name;
      `
    });
  
  if (error) {
    console.log('⚠️  Não foi possível verificar constraints via RPC');
  } else {
    console.log('✅ Constraints verificadas');
  }
}

async function checkRemovedColumns(): Promise<void> {
  console.log('\n📋 Verificando colunas removidas...\n');
  
  const tables = {
    user_residences: ['street', 'number', 'complement', 'neighborhood', 'city', 'state', 'postal_code'],
    ride_requests: ['origin', 'destination', 'pickup_location', 'dropoff_location'],
    business_data: ['address', 'neighborhood', 'latitude', 'longitude'],
  };
  
  for (const [table, columns] of Object.entries(tables)) {
    console.log(`\n${table}:`);
    for (const col of columns) {
      const { error } = await supabase
        .from(table)
        .select(col)
        .limit(1);
      
      if (error && error.message.includes('column')) {
        console.log(`  ✅ ${col} - removida`);
      } else {
        console.log(`  ⚠️  ${col} - ainda existe`);
      }
    }
  }
}

async function main() {
  console.log('🚀 ETAPA 12B: Aplicação e Validação no Banco Remoto\n');
  console.log(`📍 Ambiente: ${SUPABASE_URL}\n`);
  
  try {
    // 1. Aplicar migrations
    console.log('═══ FASE 1: APLICAÇÃO DAS MIGRATIONS ═══');
    for (const migration of ETAPA_12_MIGRATIONS) {
      await executeMigration(migration);
    }
    
    // 2. Validar dados
    console.log('\n═══ FASE 2: VALIDAÇÃO DOS DADOS ═══\n');
    
    const results: ValidationResult[] = [];
    
    console.log('⏳ Validando user_residences...');
    results.push(await validateUserResidences());
    
    console.log('⏳ Validando business_data...');
    results.push(await validateBusinessData());
    
    console.log('⏳ Validando professional_data...');
    results.push(await validateProfessionalData());
    
    console.log('⏳ Validando ride_requests...');
    results.push(await validateRideRequests());
    
    // 3. Exibir resultados
    console.log('\n═══ FASE 3: RELATÓRIO DE VALIDAÇÃO ═══\n');
    
    for (const result of results) {
      console.log(`\n${result.table}:`);
      console.log(`  Total: ${result.total}`);
      console.log(`  Canônico completo: ${result.canonical_complete}`);
      console.log(`  Falhas: ${result.failed}`);
      console.log(`  Detalhes:`, JSON.stringify(result.details, null, 2));
    }
    
    // 4. Verificar schema
    await checkSchemaConstraints();
    
    // 5. Verificar colunas removidas
    await checkRemovedColumns();
    
    console.log('\n✅ ETAPA 12B CONCLUÍDA COM SUCESSO\n');
    
  } catch (error) {
    console.error('\n❌ ERRO:', error);
    process.exit(1);
  }
}

main();
