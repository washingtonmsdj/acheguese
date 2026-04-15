#!/usr/bin/env node

/**
 * Verificar regras de pricing no banco
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarRegras() {
  console.log('\n='.repeat(60));
  console.log('VERIFICAÇÃO DE REGRAS DE PRICING NO BANCO');
  console.log('='.repeat(60));

  try {
    // Buscar todas as regras
    const { data: allRules, error: allError } = await supabase
      .from('pricing_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('\n❌ Erro ao buscar regras:', allError.message);
      return;
    }

    console.log(`\n📊 Total de regras no banco: ${allRules?.length || 0}`);

    if (!allRules || allRules.length === 0) {
      console.log('\n⚠️  Nenhuma regra encontrada no banco!');
      console.log('\nPossíveis causas:');
      console.log('1. Migrations não foram aplicadas');
      console.log('2. Seed não foi executado');
      console.log('3. RLS está bloqueando acesso');
      return;
    }

    // Agrupar por status
    const ativas = allRules.filter(r => r.is_active);
    const inativas = allRules.filter(r => !r.is_active);

    console.log(`\n✅ Regras ativas: ${ativas.length}`);
    console.log(`⏸️  Regras inativas: ${inativas.length}`);

    // Mostrar regras ativas
    if (ativas.length > 0) {
      console.log('\n📋 REGRAS ATIVAS:');
      ativas.forEach(rule => {
        console.log(`\n  • ${rule.name} (${rule.mode})`);
        console.log(`    ID: ${rule.id}`);
        console.log(`    Base: R$ ${rule.base_fare}`);
        console.log(`    Por km: R$ ${rule.price_per_km}`);
        console.log(`    Por min: R$ ${rule.price_per_minute}`);
        console.log(`    Mínimo: R$ ${rule.minimum_fare}`);
      });
    }

    // Mostrar regras inativas
    if (inativas.length > 0) {
      console.log('\n📋 REGRAS INATIVAS:');
      inativas.forEach(rule => {
        console.log(`\n  • ${rule.name} (${rule.mode})`);
        console.log(`    ID: ${rule.id}`);
      });
    }

    // Verificar RLS
    console.log('\n🔒 VERIFICANDO RLS:');
    const { data: rlsCheck, error: rlsError } = await supabase
      .rpc('check_rls_status', { table_name: 'pricing_rules' })
      .single();

    if (rlsError) {
      console.log('   ⚠️  Não foi possível verificar RLS (função não existe)');
    } else {
      console.log(`   RLS habilitado: ${rlsCheck ? 'Sim' : 'Não'}`);
    }

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

verificarRegras();
