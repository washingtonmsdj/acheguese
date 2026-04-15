/**
 * Script para executar queries de validação e resolver bloqueios
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

// Cores
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

async function main() {
  logSection('🔍 EXECUTANDO QUERIES DE VALIDAÇÃO');

  // ============================================
  // 1. Verificar Pricing Rule
  // ============================================
  logSection('💰 VERIFICANDO PRICING RULE');

  try {
    const { data: pricingRules, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('mode', 'motoboy');

    if (error) {
      log('❌', `Erro ao buscar pricing rule: ${error.message}`, colors.red);
    } else if (!pricingRules || pricingRules.length === 0) {
      log('❌', 'Nenhuma pricing rule de motoboy encontrada', colors.red);
      log('⚠️', 'AÇÃO NECESSÁRIA: Aplicar migration add_motoboy_fields.sql', colors.yellow);
    } else {
      const rule = pricingRules[0];
      log('✅', 'Pricing rule encontrada!', colors.green);
      console.log(`${colors.blue}ID: ${rule.id}${colors.reset}`);
      console.log(`${colors.blue}Nome: ${rule.name}${colors.reset}`);
      console.log(`${colors.blue}Base fare: R$ ${rule.base_fare}${colors.reset}`);
      console.log(`${colors.blue}Price per km: R$ ${rule.price_per_km}${colors.reset}`);
      console.log(`${colors.blue}Price per minute: R$ ${rule.price_per_minute}${colors.reset}`);
      console.log(`${colors.blue}Minimum fare: R$ ${rule.minimum_fare}${colors.reset}`);
      console.log(`${colors.blue}Ativa: ${rule.is_active ? 'SIM' : 'NÃO'}${colors.reset}`);
      
      if (!rule.is_active) {
        log('⚠️', 'Pricing rule está INATIVA', colors.yellow);
        log('⚠️', 'AÇÃO NECESSÁRIA: Ativar pricing rule', colors.yellow);
      }
    }
  } catch (error) {
    log('❌', `Erro: ${error.message}`, colors.red);
  }

  // ============================================
  // 2. Verificar Motoristas
  // ============================================
  logSection('🚗 VERIFICANDO MOTORISTAS');

  try {
    // Buscar todos os motoristas
    const { data: allDrivers, error: allError } = await supabase
      .from('driver_data')
      .select('profile_id, can_do_delivery')
      .limit(10);

    if (allError) {
      log('❌', `Erro ao buscar motoristas: ${allError.message}`, colors.red);
    } else if (!allDrivers || allDrivers.length === 0) {
      log('❌', 'Nenhum motorista encontrado no sistema', colors.red);
      log('⚠️', 'AÇÃO NECESSÁRIA: Criar perfil de motorista', colors.yellow);
    } else {
      log('ℹ️', `Total de motoristas: ${allDrivers.length}`, colors.blue);
      
      const withDelivery = allDrivers.filter(d => d.can_do_delivery);
      const withoutDelivery = allDrivers.filter(d => !d.can_do_delivery);
      
      console.log(`${colors.green}Com can_do_delivery=true: ${withDelivery.length}${colors.reset}`);
      console.log(`${colors.yellow}Com can_do_delivery=false: ${withoutDelivery.length}${colors.reset}`);
      
      if (withDelivery.length > 0) {
        log('✅', 'Motoristas com can_do_delivery encontrados!', colors.green);
        withDelivery.forEach(d => {
          console.log(`${colors.blue}  - ${d.profile_id.slice(0, 8)}...${colors.reset}`);
        });
      } else {
        log('❌', 'Nenhum motorista com can_do_delivery=true', colors.red);
        
        if (withoutDelivery.length > 0) {
          log('💡', 'SOLUÇÃO: Atualizar motorista existente', colors.cyan);
          console.log(`\n${colors.yellow}Execute no SQL Editor:${colors.reset}`);
          console.log(`${colors.blue}UPDATE driver_data`);
          console.log(`SET can_do_delivery = true`);
          console.log(`WHERE profile_id = '${withoutDelivery[0].profile_id}';${colors.reset}\n`);
        }
      }
    }
  } catch (error) {
    log('❌', `Erro: ${error.message}`, colors.red);
  }

  // ============================================
  // 3. Verificar Entregas
  // ============================================
  logSection('📦 VERIFICANDO ENTREGAS');

  try {
    const { data: deliveries, error } = await supabase
      .from('ride_requests')
      .select('id, status, ride_mode, recipient_name, package_size, created_at')
      .eq('ride_mode', 'motoboy')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      log('❌', `Erro ao buscar entregas: ${error.message}`, colors.red);
    } else if (!deliveries || deliveries.length === 0) {
      log('ℹ️', 'Nenhuma entrega de motoboy encontrada (normal)', colors.blue);
      log('💡', 'Use a página de validação para criar entregas de teste', colors.cyan);
    } else {
      log('✅', `${deliveries.length} entrega(s) encontrada(s)`, colors.green);
      deliveries.forEach(d => {
        console.log(`${colors.blue}  - ${d.recipient_name} (${d.status}) - ${d.package_size}${colors.reset}`);
      });
    }
  } catch (error) {
    log('❌', `Erro: ${error.message}`, colors.red);
  }

  // ============================================
  // 4. Verificar Entregas Finalizadas
  // ============================================
  logSection('✅ VERIFICANDO ENTREGAS FINALIZADAS');

  try {
    const { data: completed, error } = await supabase
      .from('ride_requests')
      .select('id, status, pickup_confirmed_at, delivered_at, failed_delivery_at, proof_of_delivery')
      .eq('ride_mode', 'motoboy')
      .or('status.eq.delivered,status.eq.failed_delivery')
      .limit(5);

    if (error) {
      log('❌', `Erro ao buscar entregas finalizadas: ${error.message}`, colors.red);
    } else if (!completed || completed.length === 0) {
      log('ℹ️', 'Nenhuma entrega finalizada (normal - ainda não testado)', colors.blue);
      log('💡', 'Execute o fluxo completo na página de validação', colors.cyan);
    } else {
      log('✅', `${completed.length} entrega(s) finalizada(s)`, colors.green);
      completed.forEach(d => {
        console.log(`\n${colors.blue}Entrega ${d.id.slice(0, 8)}:${colors.reset}`);
        console.log(`  Status: ${d.status}`);
        if (d.pickup_confirmed_at) console.log(`  ✅ Coleta confirmada: ${d.pickup_confirmed_at}`);
        if (d.delivered_at) console.log(`  ✅ Entregue em: ${d.delivered_at}`);
        if (d.failed_delivery_at) console.log(`  ❌ Falhou em: ${d.failed_delivery_at}`);
        if (d.proof_of_delivery) {
          console.log(`  📸 Prova de entrega:`);
          if (d.proof_of_delivery.code) console.log(`    - Código: ${d.proof_of_delivery.code}`);
          if (d.proof_of_delivery.photo_url) console.log(`    - Foto: ${d.proof_of_delivery.photo_url}`);
          if (d.proof_of_delivery.observation) console.log(`    - Obs: ${d.proof_of_delivery.observation}`);
        }
      });
    }
  } catch (error) {
    log('❌', `Erro: ${error.message}`, colors.red);
  }

  // ============================================
  // 5. Verificar Auditoria
  // ============================================
  logSection('📝 VERIFICANDO AUDITORIA');

  try {
    const { data: audit, error } = await supabase
      .from('ride_state_audit')
      .select('ride_id, from_state, to_state, changed_by, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      log('❌', `Erro ao buscar auditoria: ${error.message}`, colors.red);
    } else if (!audit || audit.length === 0) {
      log('ℹ️', 'Nenhum registro de auditoria (normal se não houver entregas)', colors.blue);
    } else {
      log('✅', `${audit.length} registro(s) de auditoria`, colors.green);
      
      // Agrupar por ride_id
      const byRide = {};
      audit.forEach(a => {
        if (!byRide[a.ride_id]) byRide[a.ride_id] = [];
        byRide[a.ride_id].push(a);
      });
      
      Object.keys(byRide).slice(0, 3).forEach(rideId => {
        console.log(`\n${colors.blue}Entrega ${rideId.slice(0, 8)}:${colors.reset}`);
        byRide[rideId].forEach(a => {
          console.log(`  ${a.from_state} → ${a.to_state}`);
        });
      });
    }
  } catch (error) {
    log('❌', `Erro: ${error.message}`, colors.red);
  }

  // ============================================
  // RESUMO FINAL
  // ============================================
  logSection('📊 RESUMO');

  console.log(`\n${colors.cyan}Próximos passos:${colors.reset}\n`);
  console.log('1. Se pricing rule não foi encontrada ou está inativa:');
  console.log('   - Aplique a migration: src/modules/mobility/migrations/add_motoboy_fields.sql');
  console.log('');
  console.log('2. Se nenhum motorista com can_do_delivery=true:');
  console.log('   - Execute o UPDATE sugerido acima no SQL Editor');
  console.log('');
  console.log('3. Após resolver bloqueios:');
  console.log('   - Execute: node scripts/test/validate-motoboy-flow.mjs');
  console.log('   - Acesse: http://localhost:8082/dev/mobility/motoboy-validation');
  console.log('   - Teste o fluxo completo');
  console.log('');
}

main().catch(error => {
  console.error(`\n${colors.red}❌ Erro fatal:${colors.reset}`, error);
  process.exit(1);
});
