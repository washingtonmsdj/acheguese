/**
 * ETAPA 12B — SNAPSHOT FINAL DE RECONCILIAÇÃO (DIRETO)
 * 
 * Confirma estado exato do banco remoto usando queries diretas
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar .env.remote
dotenv.config({ path: path.resolve(process.cwd(), '.env.remote') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName: string) {
  console.log(`\n━━━ ${tableName.toUpperCase()} ━━━`);
  
  try {
    // Buscar 1 registro para ver schema
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: false })
      .limit(1);

    if (error) {
      console.error(`❌ Erro: ${error.message}`);
      return;
    }

    // Contagem
    const { count: totalCount } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Registros: ${totalCount || 0}`);

    // Schema (colunas do primeiro registro)
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log(`📋 Colunas (${columns.length}):`);
      columns.forEach(col => console.log(`  - ${col}`));

      // Verificar metadata.location
      if ('metadata' in data[0] && data[0].metadata) {
        const hasLocation = 'location' in data[0].metadata;
        if (hasLocation) {
          console.log(`⚠️  metadata.location: ENCONTRADO`);
        } else {
          console.log(`✅ metadata.location: REMOVIDO`);
        }
      }
    } else {
      console.log(`⚠️  Tabela vazia, não é possível inferir schema completo`);
    }

  } catch (error: any) {
    console.error(`❌ Erro ao processar ${tableName}:`, error.message);
  }
}

async function checkRideRequestsNomenclature() {
  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('  VALIDAÇÃO: NOMENCLATURA RIDE_REQUESTS');
  console.log('═══════════════════════════════════════════════════════════');

  try {
    // Tentar inserir com campos canônicos (vai falhar por NOT NULL, mas confirma que campos existem)
    const testPayload = {
      passenger_profile_id: '00000000-0000-0000-0000-000000000000',
      pickup_address_id: '00000000-0000-0000-0000-000000000000',
      dropoff_address_id: '00000000-0000-0000-0000-000000000000',
      pickup_location_id: '00000000-0000-0000-0000-000000000000',
      dropoff_location_id: '00000000-0000-0000-0000-000000000000',
      status: 'pending'
    };

    const { error } = await supabase
      .from('ride_requests')
      .insert([testPayload])
      .select();

    if (error) {
      // Esperamos erro de FK ou NOT NULL, não de coluna inexistente
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log(`❌ ERRO: Coluna não existe - ${error.message}`);
      } else if (error.message.includes('violates foreign key constraint') || 
                 error.message.includes('null value')) {
        console.log(`✅ Campos canônicos existem (erro esperado de FK/NOT NULL)`);
        console.log(`   Mensagem: ${error.message.substring(0, 100)}...`);
      } else {
        console.log(`⚠️  Erro inesperado: ${error.message}`);
      }
    } else {
      console.log(`⚠️  INSERT sucedeu (inesperado, deveria falhar por FK)`);
    }

    // Tentar com campos legados (deve falhar se não existem)
    const legacyPayload = {
      passenger_profile_id: '00000000-0000-0000-0000-000000000000',
      origin: 'Test',
      destination: 'Test',
      status: 'pending'
    };

    const { error: legacyError } = await supabase
      .from('ride_requests')
      .insert([legacyPayload])
      .select();

    if (legacyError) {
      if (legacyError.message.includes('column') && legacyError.message.includes('does not exist')) {
        console.log(`✅ Campos legados removidos (origin/destination não existem)`);
      } else {
        console.log(`⚠️  Erro inesperado com campos legados: ${legacyError.message}`);
      }
    } else {
      console.log(`❌ PROBLEMA: Campos legados ainda existem!`);
    }

  } catch (error: any) {
    console.error(`❌ Erro na validação:`, error.message);
  }
}

async function checkMetadataLocationAll() {
  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('  VALIDAÇÃO: metadata.location EM TODAS AS TABELAS');
  console.log('═══════════════════════════════════════════════════════════');

  const tablesWithMetadata = [
    'business_data',
    'professional_data',
    'locations',
    'territorial_groups'
  ];

  for (const table of tablesWithMetadata) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id, metadata')
        .not('metadata', 'is', null)
        .limit(100);

      if (error) {
        console.log(`❌ ${table}: Erro - ${error.message}`);
        continue;
      }

      const withLocation = (data || []).filter((row: any) => 
        row.metadata && typeof row.metadata === 'object' && 'location' in row.metadata
      );

      if (withLocation.length > 0) {
        console.log(`⚠️  ${table}: ${withLocation.length} registros COM metadata.location`);
        console.log(`   IDs: ${withLocation.map((r: any) => r.id).join(', ')}`);
      } else {
        console.log(`✅ ${table}: metadata.location REMOVIDO (${data?.length || 0} registros verificados)`);
      }

    } catch (error: any) {
      console.error(`❌ ${table}: ${error.message}`);
    }
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ETAPA 12B — SNAPSHOT FINAL DE RECONCILIAÇÃO');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Banco: ${supabaseUrl.replace('https://', '').split('.')[0]}.supabase.co`);

  const tables = [
    'user_residences',
    'business_data',
    'professional_data',
    'ride_requests',
    'addresses',
    'locations',
    'territorial_groups',
    'territorial_group_members',
    'community_issues'
  ];

  for (const table of tables) {
    await checkTable(table);
  }

  await checkRideRequestsNomenclature();
  await checkMetadataLocationAll();

  console.log('\n\n✅ SNAPSHOT FINAL CONCLUÍDO');
}

main().catch(console.error);
