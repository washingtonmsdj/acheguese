#!/usr/bin/env node
/**
 * Script para aplicar migration de alcance de classificados
 * Executa: node scripts/apply-migration.mjs
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  console.error('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  // Obter caminho da migration do argumento ou usar padrão
  const migrationArg = process.argv[2];
  const migrationPath = migrationArg 
    ? join(__dirname, '..', migrationArg)
    : join(__dirname, '../supabase/migrations/20240102000000_add_classified_reach_fields.sql');

  console.log(`🚀 Aplicando migration: ${migrationPath}\n`);

  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  try {
    console.log('📝 Executando migration SQL completa...\n');

    // Executar a migration completa de uma vez
    const { error } = await supabase.rpc('exec', { sql: migrationSQL });
    
    if (error) {
      console.log('⚠️  Método RPC não disponível, usando abordagem alternativa...\n');
      
      // Dividir em comandos individuais e executar cada um
      const commands = migrationSQL
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));

      console.log(`📝 Executando ${commands.length} comandos SQL...\n`);

      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        
        if (command.toLowerCase().startsWith('comment on')) {
          console.log(`⏭️  [${i + 1}/${commands.length}] Pulando comentário...`);
          continue;
        }

        console.log(`▶️  [${i + 1}/${commands.length}] Executando: ${command.substring(0, 60)}...`);
        
        // Usar REST API diretamente para executar SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ sql: command + ';' })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Erro no comando ${i + 1}: ${errorText}`);
          throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
        }
        
        console.log(`✅ [${i + 1}/${commands.length}] Comando executado com sucesso\n`);
      }
    } else {
      console.log('✅ Migration executada com sucesso!\n');
    }

    console.log('📊 Verificando colunas adicionadas...');

    // Verificar se as colunas foram criadas
    const { data, error: testError } = await supabase
      .from('classifieds')
      .select('reach, is_featured')
      .limit(1);

    if (testError) {
      console.error('❌ Erro ao verificar colunas:', testError.message);
      console.log('\n⚠️  A migration pode ter sido aplicada, mas não foi possível verificar.');
      console.log('Verifique manualmente no Supabase Dashboard.');
    } else {
      console.log('✅ Colunas verificadas com sucesso!');
      console.log('   ✓ reach');
      console.log('   ✓ is_featured');
      if (data && data.length > 0) {
        console.log(`   ✓ Dados de teste: reach="${data[0].reach}", is_featured=${data[0].is_featured}`);
      }
      console.log('\n🎉 Tudo pronto! A funcionalidade de alcance global está ativa.');
    }

  } catch (error) {
    console.error('\n❌ Erro ao aplicar migration:', error.message);
    console.log('\n📋 Aplique manualmente no Supabase Dashboard:');
    console.log('1. Acesse: Supabase Dashboard > SQL Editor');
    console.log('2. Clique em "New Query"');
    console.log('3. Cole o conteúdo de: supabase/migrations/20240102000000_add_classified_reach_fields.sql');
    console.log('4. Clique em "Run"');
    process.exit(1);
  }
}

applyMigration();
