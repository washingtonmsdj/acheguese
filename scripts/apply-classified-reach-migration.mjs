#!/usr/bin/env node
/**
 * Script para aplicar migration de alcance de classificados
 * Executa: node scripts/apply-classified-reach-migration.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  console.error('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local');
  process.exit(1);
}

console.log('🔧 Configuração:');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Service Key: ${supabaseServiceKey.substring(0, 20)}...`);
console.log('');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Aplicando migration de alcance de classificados...\n');

  const migrationPath = join(__dirname, '../supabase/migrations/20240102000000_add_classified_reach_fields.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  try {
    console.log('📝 Executando comandos SQL...\n');

    // Comandos individuais para executar
    const commands = [
      {
        name: 'Adicionar coluna reach',
        sql: `ALTER TABLE classifieds ADD COLUMN IF NOT EXISTS reach TEXT DEFAULT 'district' CHECK (reach IN ('district', 'city', 'state'))`
      },
      {
        name: 'Adicionar coluna is_featured',
        sql: `ALTER TABLE classifieds ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE`
      },
      {
        name: 'Criar índice reach',
        sql: `CREATE INDEX IF NOT EXISTS idx_classifieds_reach ON classifieds(reach) WHERE reach != 'district'`
      },
      {
        name: 'Criar índice featured',
        sql: `CREATE INDEX IF NOT EXISTS idx_classifieds_featured ON classifieds(is_featured) WHERE is_featured = TRUE`
      },
      {
        name: 'Atualizar registros existentes',
        sql: `UPDATE classifieds SET reach = 'district' WHERE reach IS NULL`
      }
    ];

    for (let i = 0; i < commands.length; i++) {
      const { name, sql } = commands[i];
      console.log(`▶️  [${i + 1}/${commands.length}] ${name}...`);
      
      try {
        // Usar a API REST do Supabase diretamente para executar SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ query: sql })
        });

        // Se o endpoint exec não existir, tentar executar via query direta
        if (response.status === 404) {
          console.log(`   ⚠️  Endpoint RPC não disponível, usando método alternativo...`);
          
          // Para ALTER TABLE e CREATE INDEX, podemos usar o client do Supabase
          // mas precisamos de uma função RPC no banco. Vamos tentar via SQL direto.
          const { error } = await supabase.rpc('exec', { sql });
          
          if (error && error.code === '42883') {
            // Função não existe, precisamos aplicar manualmente
            console.log(`   ❌ Não foi possível executar automaticamente.`);
            console.log(`   📋 Execute manualmente no Supabase Dashboard:\n`);
            console.log(`   ${sql}\n`);
            continue;
          } else if (error) {
            throw error;
          }
        } else if (!response.ok) {
          const errorText = await response.text();
          console.log(`   ⚠️  Erro: ${errorText}`);
          console.log(`   📋 Execute manualmente no Supabase Dashboard:\n`);
          console.log(`   ${sql}\n`);
          continue;
        }
        
        console.log(`   ✅ Executado com sucesso\n`);
      } catch (cmdError) {
        console.log(`   ⚠️  Erro: ${cmdError.message}`);
        console.log(`   📋 Execute manualmente no Supabase Dashboard:\n`);
        console.log(`   ${sql}\n`);
      }
    }

    console.log('\n📊 Verificando colunas adicionadas...');

    // Verificar se as colunas foram criadas
    const { data, error: testError } = await supabase
      .from('classifieds')
      .select('reach, is_featured')
      .limit(1);

    if (testError) {
      console.error('\n❌ Erro ao verificar colunas:', testError.message);
      console.log('\n⚠️  As colunas ainda não existem no banco de dados.');
      console.log('\n📋 APLIQUE MANUALMENTE NO SUPABASE DASHBOARD:');
      console.log('1. Acesse: https://xhdowzacfujckjelqhtd.supabase.co/project/xhdowzacfujckjelqhtd/sql');
      console.log('2. Clique em "New Query"');
      console.log('3. Cole o SQL abaixo:\n');
      console.log(migrationSQL);
      console.log('\n4. Clique em "Run" (ou pressione Ctrl+Enter)');
      process.exit(1);
    } else {
      console.log('✅ Colunas verificadas com sucesso!');
      console.log('   ✓ reach');
      console.log('   ✓ is_featured');
      if (data && data.length > 0) {
        console.log(`   ✓ Exemplo: reach="${data[0].reach}", is_featured=${data[0].is_featured}`);
      }
      console.log('\n🎉 Tudo pronto! A funcionalidade de alcance global está ativa.');
      console.log('\n📝 Próximos passos:');
      console.log('   1. Remova a rota temporária /admin/apply-migration do App.tsx');
      console.log('   2. Teste a funcionalidade navegando para um bairro sem anúncios');
      console.log('   3. Crie anúncios com reach="city" para testar alcance global');
    }

  } catch (error) {
    console.error('\n❌ Erro ao aplicar migration:', error.message);
    console.log('\n📋 APLIQUE MANUALMENTE NO SUPABASE DASHBOARD:');
    console.log('1. Acesse: https://xhdowzacfujckjelqhtd.supabase.co/project/xhdowzacfujckjelqhtd/sql');
    console.log('2. Clique em "New Query"');
    console.log('3. Cole o conteúdo de: supabase/migrations/20240102000000_add_classified_reach_fields.sql');
    console.log('4. Clique em "Run"'
);
    process.exit(1);
  }
}

applyMigration();
