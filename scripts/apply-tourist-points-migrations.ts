/**
 * Script para aplicar migrations de tourist_points_v2
 * 
 * Uso: tsx scripts/apply-tourist-points-migrations.ts
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';

// Carregar variáveis de ambiente
config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

// Extrair host do URL do Supabase
const projectRef = supabaseUrl!.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('❌ URL do Supabase inválida:', supabaseUrl);
  process.exit(1);
}

// Construir connection string do Postgres (Pooler mode - porta 6543)
const connectionString = `postgresql://postgres.${projectRef}:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

// Nota: A service role key não é a senha do postgres
// Vamos usar a API REST do Supabase ao invés de conexão direta

async function applyMigration(sql: postgres.Sql, filename: string): Promise<void> {
  console.log(`\n📄 Aplicando: ${filename}`);
  
  const filepath = join(process.cwd(), 'supabase', 'migrations', filename);
  const sqlContent = readFileSync(filepath, 'utf-8');
  
  try {
    // Executar o SQL completo de uma vez
    await sql.unsafe(sqlContent);
    console.log('   ✅ Migration aplicada com sucesso!');
  } catch (err: any) {
    console.error(`   ❌ Erro ao aplicar migration:`, err.message);
    throw err;
  }
}

async function checkTableExists(sql: postgres.Sql, tableName: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      ) as exists
    `;
    return result[0]?.exists || false;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🚀 Aplicando migrations de tourist_points_v2\n');
  console.log('📍 Projeto:', projectRef);
  
  const sql = postgres(connectionString, {
    max: 1,
    ssl: 'require'
  });
  
  try {
    // Verificar se a tabela já existe
    const tableExists = await checkTableExists(sql, 'tourist_points_v2');
    
    if (tableExists) {
      console.log('\n⚠️  A tabela tourist_points_v2 já existe!');
      console.log('   As migrations podem falhar se já foram aplicadas.');
      console.log('   Continuando...\n');
    }
    
    // Migration 1: Criar tabelas
    await applyMigration(sql, '20260331100001_create_guide_tourist_points_v2.sql');
    
    // Migration 2: Seed de dados
    await applyMigration(sql, '20260331100002_seed_guide_tourist_points_salvador.sql');
    
    console.log('\n✅ Todas as migrations foram aplicadas com sucesso!');
    console.log('\n📊 Verificando dados...');
    
    // Verificar dados inseridos
    const pointsCount = await sql`SELECT COUNT(*) as count FROM tourist_points_v2`;
    const mediaCount = await sql`SELECT COUNT(*) as count FROM tourist_point_media`;
    
    console.log(`   Pontos turísticos: ${pointsCount[0]?.count || 0}`);
    console.log(`   Fotos: ${mediaCount[0]?.count || 0}`);
    
    if (pointsCount[0]?.count === '10' && mediaCount[0]?.count === '30') {
      console.log('\n🎉 Tudo certo! As migrations foram aplicadas corretamente.');
    } else {
      console.log('\n⚠️  Números inesperados. Verifique os dados manualmente.');
    }
    
  } catch (error: any) {
    console.error('\n❌ Erro ao aplicar migrations:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
