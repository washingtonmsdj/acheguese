/**
 * GATE 2: Aplicar Migration via PostgreSQL direto
 * Usa conexão direta ao banco via postgres library
 */

import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_PROJECT_ID = process.env.VITE_SUPABASE_PROJECT_ID!;

// Construir connection string
// Formato: postgresql://postgres.[project-id]:[password]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD;

if (!DB_PASSWORD) {
  console.error('❌ Erro: SUPABASE_DB_PASSWORD não encontrada no .env');
  console.error('\n📝 Adicione ao .env:');
  console.error('   SUPABASE_DB_PASSWORD="sua_senha_aqui"');
  console.error('\n💡 Encontre a senha em:');
  console.error('   Supabase Dashboard > Settings > Database > Database password');
  process.exit(1);
}

const connectionString = `postgresql://postgres.${SUPABASE_PROJECT_ID}:${DB_PASSWORD}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`;

async function applyMigration() {
  console.log('🚀 GATE 2: Aplicando Migration via PostgreSQL\n');
  console.log('=' .repeat(60));
  console.log('\n');

  let sql: postgres.Sql | null = null;

  try {
    // Conectar ao banco
    console.log('🔌 Conectando ao banco...');
    sql = postgres(connectionString, {
      ssl: 'require',
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    console.log('✅ Conectado!\n');

    // Ler migration
    const migrationPath = path.join(
      process.cwd(),
      'supabase',
      'migrations',
      '20260407000002_gate2_driver_locations_minimal.sql'
    );

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration não encontrada: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log('📄 Migration carregada:', path.basename(migrationPath));
    console.log('📊 Tamanho:', migrationSQL.length, 'bytes\n');

    // Verificar colunas atuais
    console.log('🔍 Verificando colunas atuais...');
    const currentColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'driver_locations'
      ORDER BY ordinal_position
    `;

    const columnNames = currentColumns.map((c: any) => c.column_name);
    console.log('📋 Colunas existentes:', columnNames.join(', '));

    const requiredColumns = ['accuracy', 'heading', 'speed', 'altitude'];
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));

    if (missingColumns.length === 0) {
      console.log('\n✅ Todas as colunas GPS já existem!');
      console.log('\n📝 Próximos passos:');
      console.log('  npm run test tests/e2e/gate2-tracking-pipeline.test.ts');
      await sql.end();
      return;
    }

    console.log('⚠️  Colunas faltantes:', missingColumns.join(', '));
    console.log('\n⏳ Aplicando migration...\n');

    // Executar migration em transação
    await sql.begin(async (sql) => {
      // 1. Adicionar colunas
      console.log('  ⏳ Adicionando coluna accuracy...');
      await sql`ALTER TABLE driver_locations ADD COLUMN IF NOT EXISTS accuracy DECIMAL(10,2)`;
      console.log('  ✅ accuracy');

      console.log('  ⏳ Adicionando coluna heading...');
      await sql`ALTER TABLE driver_locations ADD COLUMN IF NOT EXISTS heading DECIMAL(5,2)`;
      console.log('  ✅ heading');

      console.log('  ⏳ Adicionando coluna speed...');
      await sql`ALTER TABLE driver_locations ADD COLUMN IF NOT EXISTS speed DECIMAL(6,2)`;
      console.log('  ✅ speed');

      console.log('  ⏳ Adicionando coluna altitude...');
      await sql`ALTER TABLE driver_locations ADD COLUMN IF NOT EXISTS altitude DECIMAL(8,2)`;
      console.log('  ✅ altitude');

      // 2. Adicionar comentários
      console.log('\n  ⏳ Adicionando comentários...');
      await sql`COMMENT ON COLUMN driver_locations.accuracy IS 'GPS accuracy in meters'`;
      await sql`COMMENT ON COLUMN driver_locations.heading IS 'Direction of movement in degrees (0-360)'`;
      await sql`COMMENT ON COLUMN driver_locations.speed IS 'Speed in km/h'`;
      await sql`COMMENT ON COLUMN driver_locations.altitude IS 'Altitude in meters'`;
      console.log('  ✅ Comentários');

      // 3. Criar índices
      console.log('\n  ⏳ Criando índices...');
      await sql`CREATE INDEX IF NOT EXISTS idx_driver_locations_updated_at ON driver_locations(updated_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_time ON driver_locations(driver_profile_id, updated_at DESC)`;
      console.log('  ✅ Índices');
    });

    console.log('\n✅ Migration aplicada com sucesso!\n');

    // Validar
    console.log('🔍 Validando schema...');
    const newColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'driver_locations'
      ORDER BY ordinal_position
    `;

    console.log('\n📋 Colunas de driver_locations:');
    newColumns.forEach((col: any) => {
      const isNew = requiredColumns.includes(col.column_name);
      const marker = isNew ? '✨' : '  ';
      console.log(`  ${marker} ${col.column_name} (${col.data_type})`);
    });

    // Verificar que todas as colunas foram criadas
    const finalColumnNames = newColumns.map((c: any) => c.column_name);
    const allCreated = requiredColumns.every(col => finalColumnNames.includes(col));

    if (allCreated) {
      console.log('\n🎉 GATE 2 Migration aplicada e validada com sucesso!\n');
      console.log('=' .repeat(60));
      console.log('\n📝 Próximos passos:\n');
      console.log('  1. Executar teste E2E:');
      console.log('     npm run test tests/e2e/gate2-tracking-pipeline.test.ts\n');
      console.log('  2. Validar persistência de dados completos');
      console.log('  3. Medir latência do pipeline (<5s requisito)');
      console.log('  4. Fechar Gate 2 baseado em evidência operacional\n');
      console.log('=' .repeat(60));
    } else {
      console.error('\n❌ Algumas colunas não foram criadas');
      process.exit(1);
    }

  } catch (error: any) {
    console.error('\n❌ Erro ao aplicar migration:', error.message);
    
    if (error.message?.includes('password authentication failed')) {
      console.error('\n💡 Dica: Verifique a senha do banco no .env');
      console.error('   Variável: SUPABASE_DB_PASSWORD');
    } else if (error.message?.includes('connect')) {
      console.error('\n💡 Dica: Verifique a conexão com o banco');
      console.error('   URL:', connectionString.replace(/:[^:@]+@/, ':***@'));
    }
    
    process.exit(1);
  } finally {
    if (sql) {
      await sql.end();
    }
  }
}

applyMigration();
