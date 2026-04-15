/**
 * Script para aplicar pricing rule de motoboy
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xhdowzacfujckjelqhtd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZG93emFjZnVqY2tqZWxxaHRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MDQwODksImV4cCI6MjA5MDA4MDA4OX0.Dn7uIaD0CTpVBi-qM_L4JYH_YXlc6T9tpR0KxO4nzSA";

const supabase = createClient(supabaseUrl, supabaseKey);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(emoji, message, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

async function main() {
  console.log(`\n${colors.cyan}${'='.repeat(60)}`);
  console.log('APLICANDO PRICING RULE DE MOTOBOY');
  console.log(`${'='.repeat(60)}${colors.reset}\n`);

  // Verificar se já existe
  log('🔍', 'Verificando pricing rule existente...');
  
  const { data: existing, error: checkError } = await supabase
    .from('pricing_rules')
    .select('*')
    .eq('mode', 'motoboy');

  if (checkError) {
    log('❌', `Erro ao verificar: ${checkError.message}`, colors.red);
    process.exit(1);
  }

  if (existing && existing.length > 0) {
    log('✅', 'Pricing rule já existe!', colors.green);
    const rule = existing[0];
    console.log(`${colors.cyan}ID: ${rule.id}${colors.reset}`);
    console.log(`${colors.cyan}Nome: ${rule.name}${colors.reset}`);
    console.log(`${colors.cyan}Base fare: R$ ${rule.base_fare}${colors.reset}`);
    console.log(`${colors.cyan}Ativa: ${rule.is_active ? 'SIM' : 'NÃO'}${colors.reset}`);
    
    if (!rule.is_active) {
      log('⚠️', 'Pricing rule está INATIVA. Tentando ativar...', colors.yellow);
      
      const { error: updateError } = await supabase
        .from('pricing_rules')
        .update({ is_active: true })
        .eq('id', rule.id);

      if (updateError) {
        log('❌', `Erro ao ativar: ${updateError.message}`, colors.red);
        log('💡', 'Execute manualmente no SQL Editor:', colors.cyan);
        console.log(`UPDATE pricing_rules SET is_active = true WHERE id = '${rule.id}';`);
      } else {
        log('✅', 'Pricing rule ativada com sucesso!', colors.green);
      }
    }
    
    process.exit(0);
  }

  // Criar pricing rule
  log('📝', 'Criando pricing rule de motoboy...', colors.cyan);

  const { data, error } = await supabase
    .from('pricing_rules')
    .insert({
      mode: 'motoboy',
      name: 'Motoboy Padrão',
      base_fare: 3.50,
      price_per_km: 1.80,
      price_per_minute: 0.30,
      minimum_fare: 6.00,
      is_active: true,
      metadata: { description: 'Regra padrão para entregas motoboy' }
    })
    .select();

  if (error) {
    log('❌', `Erro ao criar: ${error.message}`, colors.red);
    log('💡', 'Possíveis causas:', colors.yellow);
    console.log('  - Permissões insuficientes (precisa de service role key)');
    console.log('  - RLS bloqueando insert');
    console.log('');
    log('💡', 'Execute manualmente no SQL Editor:', colors.cyan);
    console.log(`
INSERT INTO pricing_rules (
  mode, name, base_fare, price_per_km, price_per_minute, 
  minimum_fare, is_active, metadata
) VALUES (
  'motoboy',
  'Motoboy Padrão',
  3.50,
  1.80,
  0.30,
  6.00,
  true,
  '{"description": "Regra padrão para entregas motoboy"}'::jsonb
);
`);
    process.exit(1);
  }

  log('✅', 'Pricing rule criada com sucesso!', colors.green);
  console.log(`${colors.cyan}ID: ${data[0].id}${colors.reset}`);
  console.log(`${colors.cyan}Nome: ${data[0].name}${colors.reset}`);
  console.log(`${colors.cyan}Base fare: R$ ${data[0].base_fare}${colors.reset}`);
}

main().catch(error => {
  console.error(`\n${colors.red}❌ Erro fatal:${colors.reset}`, error);
  process.exit(1);
});
