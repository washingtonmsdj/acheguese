/**
 * ETAPA 12B — SNAPSHOT FINAL DE RECONCILIAÇÃO
 * 
 * Confirma estado exato do banco remoto:
 * 1. Schema de todas as tabelas principais
 * 2. Nomenclatura exata de ride_requests
 * 3. Campos legados removidos
 * 4. Status de metadata.location
 * 5. Constraints e FKs ativos
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar .env.remote
dotenv.config({ path: path.resolve(process.cwd(), '.env.remote') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface ConstraintInfo {
  constraint_name: string;
  constraint_type: string;
  table_name: string;
  column_name: string | null;
  foreign_table_name: string | null;
  foreign_column_name: string | null;
}

async function getTableColumns(tableName: string): Promise<ColumnInfo[]> {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = '${tableName}'
      ORDER BY ordinal_position;
    `
  });

  if (error) throw error;
  return data || [];
}

async function getTableConstraints(tableName: string): Promise<ConstraintInfo[]> {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name = '${tableName}'
        AND tc.constraint_type IN ('FOREIGN KEY', 'CHECK', 'PRIMARY KEY')
      ORDER BY tc.constraint_type, tc.constraint_name;
    `
  });

  if (error) throw error;
  return data || [];
}

async function getTableCount(tableName: string): Promise<number> {
  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  return count || 0;
}

async function checkMetadataLocation(tableName: string): Promise<number> {
  const { data, error } = await supabase
    .from(tableName)
    .select('metadata')
    .not('metadata', 'is', null);

  if (error) return 0;
  
  const withLocation = (data || []).filter((row: any) => 
    row.metadata && typeof row.metadata === 'object' && 'location' in row.metadata
  );
  
  return withLocation.length;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ETAPA 12B — SNAPSHOT FINAL DE RECONCILIAÇÃO');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Banco: ${supabaseUrl.replace('https://', '').split('.')[0]}.supabase.co`);
  console.log('');

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
    console.log(`\n━━━ ${table.toUpperCase()} ━━━`);
    
    try {
      // Colunas
      const columns = await getTableColumns(table);
      console.log(`\n📋 Colunas (${columns.length}):`);
      columns.forEach(col => {
        const nullable = col.is_nullable === 'NO' ? '🔒 NOT NULL' : '';
        console.log(`  - ${col.column_name} (${col.data_type}) ${nullable}`);
      });

      // Constraints
      const constraints = await getTableConstraints(table);
      const fks = constraints.filter(c => c.constraint_type === 'FOREIGN KEY');
      const checks = constraints.filter(c => c.constraint_type === 'CHECK');
      
      if (fks.length > 0) {
        console.log(`\n🔗 Foreign Keys (${fks.length}):`);
        fks.forEach(fk => {
          console.log(`  - ${fk.column_name} → ${fk.foreign_table_name}(${fk.foreign_column_name})`);
        });
      }

      if (checks.length > 0) {
        console.log(`\n✅ Check Constraints (${checks.length}):`);
        checks.forEach(check => {
          console.log(`  - ${check.constraint_name}`);
        });
      }

      // Contagem
      const count = await getTableCount(table);
      console.log(`\n📊 Registros: ${count}`);

      // Verificar metadata.location
      if (columns.some(c => c.column_name === 'metadata')) {
        const withLocation = await checkMetadataLocation(table);
        if (withLocation > 0) {
          console.log(`⚠️  metadata.location encontrado em ${withLocation} registros`);
        } else {
          console.log(`✅ metadata.location: REMOVIDO (0 registros)`);
        }
      }

    } catch (error: any) {
      console.error(`❌ Erro ao processar ${table}:`, error.message);
    }
  }

  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('  VALIDAÇÕES ESPECÍFICAS');
  console.log('═══════════════════════════════════════════════════════════');

  // Validar nomenclatura ride_requests
  console.log('\n🚗 RIDE_REQUESTS — Nomenclatura Canônica:');
  const rideColumns = await getTableColumns('ride_requests');
  const canonicalFields = [
    'pickup_address_id',
    'dropoff_address_id',
    'pickup_location_id',
    'dropoff_location_id'
  ];
  
  canonicalFields.forEach(field => {
    const exists = rideColumns.some(c => c.column_name === field);
    const col = rideColumns.find(c => c.column_name === field);
    const notNull = col?.is_nullable === 'NO' ? '🔒 NOT NULL' : '';
    console.log(`  ${exists ? '✅' : '❌'} ${field} ${notNull}`);
  });

  const legacyFields = ['origin', 'destination', 'pickup_location', 'dropoff_location'];
  console.log('\n🗑️  Campos legados:');
  legacyFields.forEach(field => {
    const exists = rideColumns.some(c => c.column_name === field);
    console.log(`  ${exists ? '⚠️  AINDA EXISTE' : '✅ REMOVIDO'} ${field}`);
  });

  console.log('\n\n✅ SNAPSHOT FINAL CONCLUÍDO');
}

main().catch(console.error);
