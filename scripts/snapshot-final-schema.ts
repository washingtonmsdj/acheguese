/**
 * Script: Snapshot exato do schema final no banco remoto
 * Sem resumos, sem interpretação - apenas fatos
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = resolve(process.cwd(), '.env.remote');
const envContent = readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const match = trimmed.match(/^([A-Z_]+)=(.+)$/);
    if (match) {
      envVars[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Env não configurado');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function getTableSchema(tableName: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TABELA: ${tableName}`);
  console.log('='.repeat(80));

  // Buscar 1 registro para ver colunas existentes
  const { data: sample, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);

  if (error) {
    console.log(`❌ Erro ao acessar: ${error.message}`);
    return;
  }

  const columns = sample && sample.length > 0 ? Object.keys(sample[0]) : [];
  
  console.log(`\nCOLUNAS EXISTENTES (${columns.length}):`);
  columns.forEach(col => console.log(`  - ${col}`));

  // Contar registros
  const { count } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  console.log(`\nREGISTROS: ${count ?? 0}`);

  // Verificar metadata.location se tabela tem metadata
  if (columns.includes('metadata')) {
    const { data: withLocation } = await supabase
      .from(tableName)
      .select('id, metadata')
      .not('metadata', 'is', null);

    const hasLocation = withLocation?.some((row: any) => 
      row.metadata && typeof row.metadata === 'object' && 'location' in row.metadata
    );

    console.log(`\nmetadata.location: ${hasLocation ? '❌ EXISTE' : '✅ REMOVIDO'}`);
  }
}

async function snapshotFinal() {
  console.log('📸 SNAPSHOT FINAL DO SCHEMA REMOTO');
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  const tables = [
    'user_residences',
    'business_data',
    'professional_data',
    'ride_requests',
    'addresses',
    'locations',
    'territorial_groups',
    'territorial_group_members'
  ];

  for (const table of tables) {
    await getTableSchema(table);
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('FIM DO SNAPSHOT');
  console.log('='.repeat(80));
}

snapshotFinal().catch(console.error);
