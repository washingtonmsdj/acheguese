/**
 * Script de Validao - Dispatch Automtico
 * 
 * Valida que todos os componentes do dispatch automtico esto funcionando
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { AutoDispatchService } from '@/core/mobility/core/AutoDispatchService';
import { RideOperationalService } from '@/core/mobility/core/RideOperationalService';
import { RideDispatchService } from '@/core/mobility/core/RideDispatchService';
import { getAllRideRequests } from '@/core/mobility/services/mobility.queries';

interface ValidationResult {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: unknown;
}

async function validateDispatchSystem(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  // 1. Verificar tabelas necessrias
  try {
    await getAllRideRequests();

    results.push({
      check: 'Tabela ride_requests',
      status: 'pass',
      message: 'Tabela acessvel',
    });
  } catch (error) {
    results.push({
      check: 'Tabela ride_requests',
      status: 'fail',
      message: (error as Error).message,
    });
  }

  try {
    const { error: auditError } = await supabase
      .from('ride_dispatch_audit')
      .select('id')
      .limit(1);

    results.push({
      check: 'Tabela ride_dispatch_audit',
      status: auditError ? 'fail' : 'pass',
      message: auditError ? auditError.message : 'Tabela acessvel',
    });
  } catch (error) {
    results.push({
      check: 'Tabela ride_dispatch_audit',
      status: 'fail',
      message: (error as Error).message,
    });
  }

  try {
    const { error: availError } = await supabase
      .from('driver_availability')
      .select('profile_id')
      .limit(1);

    results.push({
      check: 'Tabela driver_availability',
      status: availError ? 'fail' : 'pass',
      message: availError ? availError.message : 'Tabela acessvel',
    });
  } catch (error) {
    results.push({
      check: 'Tabela driver_availability',
      status: 'fail',
      message: (error as Error).message,
    });
  }

  // 2. Verificar motoristas disponveis
  try {
    const { data: drivers, error } = await supabase
      .from('driver_availability')
      .select('profile_id, is_online, is_available')
      .eq('is_online', true)
      .eq('is_available', true);

    const count = drivers?.length || 0;
    results.push({
      check: 'Motoristas disponveis',
      status: count > 0 ? 'pass' : 'warning',
      message: `${count} motorista(s) online e disponvel(is)`,
      details: { count },
    });
  } catch (error) {
    results.push({
      check: 'Motoristas disponveis',
      status: 'fail',
      message: (error as Error).message,
    });
  }

  // 3. Verificar corridas em busca
  try {
    const activeRides = await getAllRideRequests() as Array<{
      id?: string;
      status?: string;
      created_at?: string;
    }>;
    const rides = activeRides
      .filter((ride) => ['searching_driver', 'driver_assigned'].includes(ride.status || ''))
      .map((ride) => ({
        id: ride.id,
        status: ride.status,
        created_at: ride.created_at,
      }));

    const count = rides?.length || 0;
    results.push({
      check: 'Corridas em busca',
      status: 'pass',
      message: `${count} corrida(s) aguardando motorista`,
      details: { count, rides: rides?.slice(0, 3) },
    });
  } catch (error) {
    results.push({
      check: 'Corridas em busca',
      status: 'fail',
      message: (error as Error).message,
    });
  }

  // 4. Verificar auditoria de dispatch
  try {
    const { data: audits, error } = await supabase
      .from('ride_dispatch_audit')
      .select('ride_id, driver_profile_id, status, attempt_number')
      .order('created_at', { ascending: false })
      .limit(10);

    const count = audits?.length || 0;
    results.push({
      check: 'Auditoria de dispatch',
      status: 'pass',
      message: `${count} registro(s) de auditoria encontrados`,
      details: { count, recent: audits?.slice(0, 3) },
    });
  } catch (error) {
    results.push({
      check: 'Auditoria de dispatch',
      status: 'warning',
      message: 'Tabela no existe ou sem dados (normal se nunca rodou)',
    });
  }

  // 5. Verificar servios carregados
  results.push({
    check: 'AutoDispatchService',
    status: typeof AutoDispatchService.startDispatch === 'function' ? 'pass' : 'fail',
    message: 'Servio carregado corretamente',
  });

  results.push({
    check: 'RideOperationalService',
    status: typeof RideOperationalService.createRide === 'function' ? 'pass' : 'fail',
    message: 'Servio carregado corretamente',
  });

  results.push({
    check: 'RideDispatchService',
    status: typeof RideDispatchService.findEligibleDrivers === 'function' ? 'pass' : 'fail',
    message: 'Servio carregado corretamente',
  });

  return results;
}

// Executar validao
export async function runValidation() {
  console.log(' Validando sistema de dispatch automtico...\n');

  const results = await validateDispatchSystem();

  let passCount = 0;
  let failCount = 0;
  let warnCount = 0;

  results.forEach((result) => {
    const icon = result.status === 'pass' ? '' : result.status === 'fail' ? '' : '';
    console.log(`${icon} ${result.check}: ${result.message}`);
    
    if (result.details) {
      console.log(`   Detalhes:`, JSON.stringify(result.details, null, 2));
    }

    if (result.status === 'pass') passCount++;
    else if (result.status === 'fail') failCount++;
    else warnCount++;
  });

  console.log('\n Resumo:');
  console.log(`    Passou: ${passCount}`);
  console.log(`     Avisos: ${warnCount}`);
  console.log(`    Falhou: ${failCount}`);

  if (failCount === 0) {
    console.log('\n Sistema de dispatch automtico validado com sucesso!');
  } else {
    console.log('\n  Alguns checks falharam. Verifique os erros acima.');
  }

  return { results, passCount, failCount, warnCount };
}

// Se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runValidation().catch(console.error);
}


