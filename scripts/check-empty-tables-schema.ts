/**
 * ETAPA 12B — VERIFICAR SCHEMA DE TABELAS VAZIAS
 * 
 * Usa tentativa de INSERT inválido para inferir schema
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.remote') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Usar service role para bypass RLS

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmptyTableSchema(tableName: string, testPayload: any) {
  console.log(`\n━━━ ${tableName.toUpperCase()} ━━━`);
  
  try {
    // Tentar INSERT com payload inválido para ver erro de schema
    const { error } = await supabase
      .from(tableName)
      .insert([testPayload])
      .select();

    if (error) {
      console.log(`📋 Erro de validação (esperado):`);
      console.log(`   ${error.message}`);
      
      // Analisar erro para inferir campos
      if (error.message.includes('null value in column')) {
        const match = error.message.match(/null value in column "([^"]+)"/);
        if (match) {
          console.log(`\n🔒 Campo NOT NULL detectado: ${match[1]}`);
        }
      }
      
      if (error.message.includes('violates foreign key constraint')) {
        const match = error.message.match(/on table "([^"]+)"/);
        if (match) {
          console.log(`\n🔗 FK constraint detectada para: ${match[1]}`);
        }
      }

      if (error.message.includes('column') && error.message.includes('does not exist')) {
        const match = error.message.match(/column "([^"]+)" of relation/);
        if (match) {
          console.log(`\n❌ Coluna NÃO EXISTE: ${match[1]}`);
        }
      }
    } else {
      console.log(`⚠️  INSERT sucedeu (inesperado)`);
    }

  } catch (error: any) {
    console.error(`❌ Erro: ${error.message}`);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  VERIFICAÇÃO DE SCHEMA - TABELAS VAZIAS');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  // user_residences
  await checkEmptyTableSchema('user_residences', {
    user_id: '00000000-0000-0000-0000-000000000000',
    // Campos canônicos
    address_id: '00000000-0000-0000-0000-000000000000',
    location_id: '00000000-0000-0000-0000-000000000000',
  });

  // ride_requests - testar campos canônicos
  console.log('\n\n🚗 RIDE_REQUESTS — Campos Canônicos:');
  await checkEmptyTableSchema('ride_requests', {
    passenger_profile_id: '00000000-0000-0000-0000-000000000000',
    pickup_address_id: '00000000-0000-0000-0000-000000000000',
    dropoff_address_id: '00000000-0000-0000-0000-000000000000',
    pickup_location_id: '00000000-0000-0000-0000-000000000000',
    dropoff_location_id: '00000000-0000-0000-0000-000000000000',
    status: 'pending'
  });

  // ride_requests - testar campos legados
  console.log('\n\n🗑️  RIDE_REQUESTS — Campos Legados:');
  await checkEmptyTableSchema('ride_requests', {
    passenger_profile_id: '00000000-0000-0000-0000-000000000000',
    origin: 'Test Origin',
    destination: 'Test Destination',
    pickup_location: 'Test Pickup',
    dropoff_location: 'Test Dropoff',
    status: 'pending'
  });

  // addresses
  await checkEmptyTableSchema('addresses', {
    location_id: '00000000-0000-0000-0000-000000000000',
    street: 'Test Street',
    precision_type: 'exact'
  });

  console.log('\n\n✅ VERIFICAÇÃO CONCLUÍDA');
}

main().catch(console.error);
