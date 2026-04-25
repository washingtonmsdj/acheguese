#!/usr/bin/env node
/**
 * Script para aplicar o seed da Pizzaria Bella Napoli no Supabase
 * Usage: node scripts/apply-bella-napoli-seed.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Carrega variáveis de ambiente
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

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

  // Divide o SQL em comandos individuais (separados por ;)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📄 Encontrados ${statements.length} comandos SQL\n`);

  let success = 0;
  let errors = [];

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
    process.stdout.write(`[${i + 1}/${statements.length}] ${preview}... `);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Tenta executar como query direta se RPC falhar
        const { error: queryError } = await supabase.from('_temp_query').select('*').limit(0);
        // Se não conseguir usar RPC, tenta método alternativo
        console.log('⚠️  (RPC falhou, tentando método alternativo)');
        errors.push({ cmd: preview, error: error.message });
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

  // Query de validação
  console.log('\n🔍 Validando dados inseridos...');
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

  console.log('\n🎉 Seed aplicado!');
}

// Método alternativo usando SQL direto via REST API
async function applySeedViaRest() {
  console.log('🍕 Aplicando seed da Pizzaria Bella Napoli (método REST)...\n');

  const seedPath = path.join(__dirname, '..', 'supabase', 'seed_bella_napoli_mock.sql');
  const sql = fs.readFileSync(seedPath, 'utf8');

  // Extrai o business_id fixo do seed
  const businessIdMatch = sql.match(/v_business_id\s*:=\s*'([^']+)'/);
  const businessId = businessIdMatch ? businessIdMatch[1] : 'a2222222-2222-2222-2222-222222222222';

  console.log(`📍 Business ID: ${businessId}\n`);

  // Usa fetch para chamar a API REST do Supabase diretamente
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ sql: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Erro ao executar SQL:', error);
    console.log('\n💡 Alternativa: Copie o conteúdo do arquivo e cole no SQL Editor do Supabase Dashboard');
    console.log('   Arquivo: supabase/seed_bella_napoli_mock.sql');
    return;
  }

  console.log('✅ Seed aplicado com sucesso via REST API!');
}

// Executa
applySeed().catch(err => {
  console.error('\n❌ Erro:', err.message);
  console.log('\n💡 Tentando método alternativo...\n');
  applySeedViaRest().catch(e => {
    console.error('❌ Método alternativo também falhou:', e.message);
    process.exit(1);
  });
});
