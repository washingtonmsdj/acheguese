#!/usr/bin/env node
/**
 * Script para aplicar o seed da Pizzaria Bella Napoli no Supabase
 * Usage: node scripts/apply-bella-napoli-seed.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas');
  console.error('   Certifique-se de que VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas');
  console.error('   Você pode usar o .env.local para definir essas variáveis');
  process.exit(1);
}

async function applySeed() {
  console.log('🍕 Aplicando seed da Pizzaria Bella Napoli...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Lê o arquivo SQL
  const seedPath = path.join(__dirname, '..', 'supabase', 'seed_bella_napoli_mock.sql');
  const sql = fs.readFileSync(seedPath, 'utf8');

  // Executa o SQL completo de uma vez
  console.log('📄 Executando SQL completo...');
  
  try {
    // Remove a definição da função e o bloco DO, executa apenas o conteúdo
    const sqlContent = sql.replace(/DO\s+\$seed\$\s+BEGIN\s+/, '').replace(/END\s+\$seed\$\s*;$/, '');
    
    // Divide em comandos individuais
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('DECLARE'));

    console.log(`📄 Encontrados ${statements.length} comandos SQL\n`);

    let success = 0;
    let errors = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
      process.stdout.write(`[${i + 1}/${statements.length}] ${preview}... `);

      try {
        // Tenta executar via RPC se existir, ou via SQL direto
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          // Se RPC não funcionar, tenta método alternativo com POST direto
          console.log('⚠️  (tentando método alternativo)');
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ sql: statement })
          });

          if (response.ok) {
            console.log('✅');
            success++;
          } else {
            const errorText = await response.text();
            console.log('❌');
            errors.push({ cmd: preview, error: errorText });
          }
        } else {
          console.log('✅');
          success++;
        }
      } catch (err) {
        console.log('❌');
        errors.push({ cmd: preview, error: err.message });
      }
    }

    console.log(`\n📊 Resultado: ${success}/${statements.length} comandos executados com sucesso`);

    if (errors.length > 0) {
      console.log(`\n⚠️  ${errors.length} erro(s) encontrado(s):`);
      errors.forEach((e, i) => {
        console.log(`   ${i + 1}. ${e.cmd}...`);
        console.log(`      → ${e.error}`);
      });
    }

  } catch (err) {
    console.error('❌ Erro ao processar SQL:', err.message);
  }

  // Query de validação
  console.log('\n🔍 Validando dados inseridos...');
  try {
    const { data: validation, error: valError } = await supabase
      .from('business_data')
      .select(`
        id,
        business_name,
        slug,
        gastronomy_profiles!inner(niche_key),
        menus(
          id,
          menu_categories(count),
          menu_items(count)
        ),
        pizza_sizes(count),
        pizza_flavors(count),
        pizza_edges(count),
        pizza_doughs(count)
      `)
      .eq('slug', 'pizzaria-bella-napoli')
      .single();

    if (valError) {
      console.log('⚠️  Erro na validação:', valError.message);
    } else if (validation) {
      console.log('\n✅ Pizzaria Bella Napoli encontrada:');
      console.log(`   Nome: ${validation.business_name}`);
      console.log(`   Niche: ${validation.gastronomy_profiles?.niche_key || 'N/A'}`);
      console.log(`   Menus: ${validation.menus?.length || 0}`);
      console.log(`   Tamanhos de pizza: ${validation.pizza_sizes?.[0]?.count || 0}`);
      console.log(`   Sabores: ${validation.pizza_flavors?.[0]?.count || 0}`);
      console.log(`   Bordas: ${validation.pizza_edges?.[0]?.count || 0}`);
      console.log(`   Massas: ${validation.pizza_doughs?.[0]?.count || 0}`);
    }
  } catch (err) {
    console.log('⚠️  Erro na validação:', err.message);
  }

  console.log('\n🎉 Seed aplicado!');
}

// Executa
applySeed().catch(err => {
  console.error('\n❌ Erro:', err.message);
  console.log('\n💡 Alternativa: Copie o conteúdo do arquivo e cole no SQL Editor do Supabase Dashboard');
  console.log('   Arquivo: supabase/seed_bella_napoli_mock.sql');
  process.exit(1);
});
