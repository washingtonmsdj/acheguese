#!/usr/bin/env node

/**
 * GATE 5: Aplicar RLS Fix via PostgreSQL direto
 */

import pg from 'pg';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: variáveis de ambiente não definidas');
  process.exit(1);
}

// Extrair project ref
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('❌ Erro: não foi possível extrair project ref');
  process.exit(1);
}

console.log('🔧 Configuração:');
console.log(`  Project: ${projectRef}`);
console.log('');

// SQL statements individuais
const statements = [
  {
    name: 'Habilitar RLS',
    sql: 'ALTER TABLE driver_availability ENABLE ROW LEVEL SECURITY;',
  },
  {
    name: 'Remover policy antiga 1',
    sql: 'DROP POLICY IF EXISTS "Service role full access" ON driver_availability;',
  },
  {
    name: 'Remover policy antiga 2',
    sql: 'DROP POLICY IF EXISTS "Drivers can manage own availability" ON driver_availability;',
  },
  {
    name: 'Remover policy antiga 3',
    sql: 'DROP POLICY IF EXISTS "Public can read online drivers" ON driver_availability;',
  },
  {
    name: 'Criar policy: Service role full access',
    sql: `CREATE POLICY "Service role full access"
  ON driver_availability
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);`,
  },
  {
    name: 'Criar policy: Drivers can manage own availability',
    sql: `CREATE POLICY "Drivers can manage own availability"
  ON driver_availability
  FOR ALL
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles 
      WHERE user_id = auth.uid() 
      AND profile_type = 'driver'
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles 
      WHERE user_id = auth.uid() 
      AND profile_type = 'driver'
    )
  );`,
  },
  {
    name: 'Criar policy: Public can read online drivers',
    sql: `CREATE POLICY "Public can read online drivers"
  ON driver_availability
  FOR SELECT
  TO authenticated
  USING (is_online = true);`,
  },
  {
    name: 'Verificar policies criadas',
    sql: `SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'driver_availability'
ORDER BY policyname;`,
  },
];

async function applyRlsFix() {
  console.log('🚀 GATE 5: Aplicando RLS Fix\n');

  // Tentar diferentes connection strings
  const connectionStrings = [
    // Pooler (porta 6543)
    `postgresql://postgres.${projectRef}:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
    // Direct (porta 5432)
    `postgresql://postgres.${projectRef}:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
    // IPv6
    `postgresql://postgres.${projectRef}:[YOUR-PASSWORD]@db.${projectRef}.supabase.co:5432/postgres`,
  ];

  // Usar service key como password
  const password = supabaseServiceKey;

  for (const connStr of connectionStrings) {
    const connectionString = connStr.replace('[YOUR-PASSWORD]', password);
    
    console.log(`🔄 Tentando conexão: ${connStr.substring(0, 50)}...`);

    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await client.connect();
      console.log('✅ Conectado!\n');

      // Executar statements
      for (let i = 0; i < statements.length; i++) {
        const { name, sql } = statements[i];
        console.log(`${i + 1}/${statements.length}. ${name}`);

        try {
          const result = await client.query(sql);
          
          if (result.rows && result.rows.length > 0) {
            console.log('   ✅ OK - Resultado:');
            console.table(result.rows);
          } else {
            console.log('   ✅ OK');
          }
        } catch (error) {
          console.error(`   ❌ Erro: ${error.message}`);
          
          // Continuar mesmo com erro (pode ser policy que não existe)
          if (!error.message.includes('does not exist')) {
            throw error;
          }
        }
      }

      await client.end();
      console.log('\n✅ RLS Fix aplicado com sucesso!');
      return true;
    } catch (error) {
      console.error(`   ❌ Falhou: ${error.message}\n`);
      try {
        await client.end();
      } catch {}
    }
  }

  console.error('❌ Todas as tentativas de conexão falharam');
  return false;
}

applyRlsFix().catch(console.error);
