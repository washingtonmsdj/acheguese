/**
 * Script de validação do fluxo completo de motoboy
 * 
 * Executa testes end-to-end simulando o fluxo da página de validação
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
config({ path: join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(emoji, message, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.cyan}${'='.repeat(60)}`);
  console.log(`${title}`);
  console.log(`${'='.repeat(60)}${colors.reset}\n`);
}

// Resultados dos testes
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

function recordTest(name, passed, details = '') {
  results.tests.push({ name, passed, details });
  if (passed) {
    results.passed++;
    log('✅', name, colors.green);
  } else {
    results.failed++;
    log('❌', name, colors.red);
    if (details) log('  ', `Detalhes: ${details}`, colors.yellow);
  }
}

async function main() {
  logSection('🧪 VALIDAÇÃO DO FLUXO MOTOBOY - FASE 2.2');

  // ============================================
  // PASSO 1: Verificar estrutura do banco
  // ============================================
  logSection('📊 PASSO 1: Verificar Estrutura do Banco');

  try {
    // Verificar campos em ride_requests
    const { data: rideRequestsColumns, error: rideError } = await supabase
      .from('ride_requests')
      .select('ride_mode, source_type, source_id, recipient_name, package_size, proof_of_delivery, pickup_confirmed_at, delivered_at, failed_delivery_at')
      .limit(1);

    if (rideError && !rideError.message.includes('0 rows')) {
      recordTest('Campos de motoboy em ride_requests', false, rideError.message);
    } else {
      recordTest('Campos de motoboy em ride_requests', true);
    }

    // Verificar campos em driver_data
    const { data: driverDataColumns, error: driverError } = await supabase
      .from('driver_data')
      .select('can_do_delivery')
      .limit(1);

    if (driverError && !driverError.message.includes('0 rows')) {
      recordTest('Campo can_do_delivery em driver_data', false, driverError.message);
    } else {
      recordTest('Campo can_do_delivery em driver_data', true);
    }

    // Verificar pricing rule
    const { data: pricingRules, error: pricingError } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('mode', 'motoboy')
      .eq('is_active', true);

    if (pricingError) {
      recordTest('Pricing rule de motoboy ativa', false, pricingError.message);
    } else if (!pricingRules || pricingRules.length === 0) {
      recordTest('Pricing rule de motoboy ativa', false, 'Nenhuma pricing rule encontrada');
    } else {
      recordTest('Pricing rule de motoboy ativa', true, `ID: ${pricingRules[0].id}`);
      log('  ', `Base fare: R$ ${pricingRules[0].base_fare}`, colors.blue);
      log('  ', `Price per km: R$ ${pricingRules[0].price_per_km}`, colors.blue);
    }

  } catch (error) {
    recordTest('Verificação de estrutura do banco', false, error.message);
  }

  // ============================================
  // PASSO 2: Verificar usuários de teste
  // ============================================
  logSection('👥 PASSO 2: Verificar Usuários de Teste');

  try {
    // Buscar perfis de motorista com can_do_delivery
    const { data: drivers, error: driversError } = await supabase
      .from('driver_data')
      .select('profile_id, can_do_delivery')
      .eq('can_do_delivery', true)
      .limit(5);

    if (driversError) {
      recordTest('Motoristas com can_do_delivery', false, driversError.message);
    } else if (!drivers || drivers.length === 0) {
      recordTest('Motoristas com can_do_delivery', false, 'Nenhum motorista encontrado');
      log('  ', '⚠️  ATENÇÃO: Você precisa criar um perfil de motorista com can_do_delivery = true', colors.yellow);
    } else {
      recordTest('Motoristas com can_do_delivery', true, `${drivers.length} motorista(s) encontrado(s)`);
      log('  ', `IDs: ${drivers.map(d => d.profile_id.slice(0, 8)).join(', ')}`, colors.blue);
    }

  } catch (error) {
    recordTest('Verificação de usuários', false, error.message);
  }

  // ============================================
  // PASSO 3: Verificar entregas existentes
  // ============================================
  logSection('📦 PASSO 3: Verificar Entregas Existentes');

  try {
    // Buscar entregas de motoboy
    const { data: deliveries, error: deliveriesError } = await supabase
      .from('ride_requests')
      .select('id, status, ride_mode, recipient_name, package_size, created_at')
      .eq('ride_mode', 'motoboy')
      .order('created_at', { ascending: false })
      .limit(10);

    if (deliveriesError) {
      recordTest('Buscar entregas de motoboy', false, deliveriesError.message);
    } else {
      recordTest('Buscar entregas de motoboy', true, `${deliveries?.length || 0} entrega(s) encontrada(s)`);
      
      if (deliveries && deliveries.length > 0) {
        log('  ', 'Últimas entregas:', colors.blue);
        deliveries.slice(0, 3).forEach(d => {
          log('  ', `  - ${d.recipient_name} (${d.status}) - ${d.package_size}`, colors.blue);
        });
      }
    }

    // Buscar corridas normais
    const { data: rides, error: ridesError } = await supabase
      .from('ride_requests')
      .select('id, status, ride_mode')
      .eq('ride_mode', 'ride')
      .limit(5);

    if (ridesError) {
      recordTest('Buscar corridas normais', false, ridesError.message);
    } else {
      recordTest('Buscar corridas normais', true, `${rides?.length || 0} corrida(s) encontrada(s)`);
    }

  } catch (error) {
    recordTest('Verificação de entregas', false, error.message);
  }

  // ============================================
  // PASSO 4: Verificar auditoria
  // ============================================
  logSection('📝 PASSO 4: Verificar Sistema de Auditoria');

  try {
    // Verificar se ride_state_audit existe e tem dados
    const { data: auditRecords, error: auditError } = await supabase
      .from('ride_state_audit')
      .select('ride_id, from_state, to_state, changed_by, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (auditError) {
      recordTest('Tabela ride_state_audit', false, auditError.message);
    } else {
      recordTest('Tabela ride_state_audit', true, `${auditRecords?.length || 0} registro(s) encontrado(s)`);
      
      if (auditRecords && auditRecords.length > 0) {
        log('  ', 'Últimas transições:', colors.blue);
        auditRecords.slice(0, 3).forEach(a => {
          log('  ', `  - ${a.from_state} → ${a.to_state}`, colors.blue);
        });
      }
    }

  } catch (error) {
    recordTest('Verificação de auditoria', false, error.message);
  }

  // ============================================
  // PASSO 5: Verificar timestamps
  // ============================================
  logSection('⏰ PASSO 5: Verificar Timestamps');

  try {
    // Buscar entregas com timestamps preenchidos
    const { data: completedDeliveries, error: completedError } = await supabase
      .from('ride_requests')
      .select('id, status, pickup_confirmed_at, delivered_at, failed_delivery_at')
      .eq('ride_mode', 'motoboy')
      .or('status.eq.delivered,status.eq.failed_delivery')
      .limit(5);

    if (completedError) {
      recordTest('Entregas com timestamps', false, completedError.message);
    } else if (!completedDeliveries || completedDeliveries.length === 0) {
      recordTest('Entregas com timestamps', false, 'Nenhuma entrega finalizada encontrada');
      log('  ', '⚠️  Execute o fluxo completo na página de validação primeiro', colors.yellow);
    } else {
      recordTest('Entregas com timestamps', true, `${completedDeliveries.length} entrega(s) finalizada(s)`);
      
      completedDeliveries.forEach(d => {
        if (d.status === 'delivered' && d.delivered_at) {
          log('  ', `✅ Entrega ${d.id.slice(0, 8)}: delivered_at preenchido`, colors.green);
        }
        if (d.status === 'failed_delivery' && d.failed_delivery_at) {
          log('  ', `✅ Entrega ${d.id.slice(0, 8)}: failed_delivery_at preenchido`, colors.green);
        }
        if (d.pickup_confirmed_at) {
          log('  ', `✅ Entrega ${d.id.slice(0, 8)}: pickup_confirmed_at preenchido`, colors.green);
        }
      });
    }

  } catch (error) {
    recordTest('Verificação de timestamps', false, error.message);
  }

  // ============================================
  // PASSO 6: Verificar proof_of_delivery
  // ============================================
  logSection('📸 PASSO 6: Verificar Proof of Delivery');

  try {
    const { data: deliveriesWithProof, error: proofError } = await supabase
      .from('ride_requests')
      .select('id, proof_of_delivery')
      .eq('ride_mode', 'motoboy')
      .eq('status', 'delivered')
      .not('proof_of_delivery', 'is', null)
      .limit(5);

    if (proofError) {
      recordTest('Entregas com proof_of_delivery', false, proofError.message);
    } else if (!deliveriesWithProof || deliveriesWithProof.length === 0) {
      recordTest('Entregas com proof_of_delivery', false, 'Nenhuma entrega com prova encontrada');
      log('  ', '⚠️  Teste o fluxo de confirmação com prova de entrega', colors.yellow);
    } else {
      recordTest('Entregas com proof_of_delivery', true, `${deliveriesWithProof.length} entrega(s) com prova`);
      
      deliveriesWithProof.forEach(d => {
        const proof = d.proof_of_delivery;
        log('  ', `Entrega ${d.id.slice(0, 8)}:`, colors.blue);
        if (proof.code) log('  ', `  - Código: ${proof.code}`, colors.blue);
        if (proof.photo_url) log('  ', `  - Foto: ${proof.photo_url}`, colors.blue);
        if (proof.observation) log('  ', `  - Obs: ${proof.observation}`, colors.blue);
      });
    }

  } catch (error) {
    recordTest('Verificação de proof_of_delivery', false, error.message);
  }

  // ============================================
  // RELATÓRIO FINAL
  // ============================================
  logSection('📊 RELATÓRIO FINAL');

  console.log(`\n${colors.cyan}Testes executados: ${results.tests.length}${colors.reset}`);
  console.log(`${colors.green}✅ Passou: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Falhou: ${results.failed}${colors.reset}`);

  const successRate = ((results.passed / results.tests.length) * 100).toFixed(1);
  console.log(`\n${colors.cyan}Taxa de sucesso: ${successRate}%${colors.reset}`);

  // Classificação
  console.log(`\n${colors.cyan}${'='.repeat(60)}`);
  console.log('CLASSIFICAÇÃO');
  console.log(`${'='.repeat(60)}${colors.reset}\n`);

  if (results.failed === 0) {
    log('🟢', 'ESTRUTURALMENTE PRONTO', colors.green);
    log('  ', 'Todos os campos e estruturas estão corretos', colors.green);
  } else if (results.failed <= 2) {
    log('🟡', 'ESTRUTURALMENTE PRONTO COM RESSALVAS', colors.yellow);
    log('  ', 'Alguns testes falharam, mas estrutura básica está ok', colors.yellow);
  } else {
    log('🔴', 'ESTRUTURA INCOMPLETA', colors.red);
    log('  ', 'Vários testes falharam, revisar implementação', colors.red);
  }

  console.log('\n' + colors.cyan + '='.repeat(60) + colors.reset);
  console.log(colors.cyan + 'PRÓXIMOS PASSOS' + colors.reset);
  console.log(colors.cyan + '='.repeat(60) + colors.reset + '\n');

  log('1️⃣', 'Acesse: http://localhost:8082/dev/mobility/motoboy-validation');
  log('2️⃣', 'Execute o fluxo completo manualmente');
  log('3️⃣', 'Rode este script novamente para validar timestamps');
  log('4️⃣', 'Atualize STATUS_OPERACIONAL.md com resultados');

  console.log('');

  // Exit code baseado nos resultados
  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error(`\n${colors.red}❌ Erro fatal:${colors.reset}`, error);
  process.exit(1);
});
