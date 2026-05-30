/**
 * GATE 6: HELPERS DE POLLING DETERMINÍSTICO
 * 
 * Substitui sleeps frágeis por polling com validação objetiva.
 * Valida estados no banco e auditoria com timeout configurável.
 */

import { createOperationalAdminClient } from './operational-env';
import type { RideState } from '@/modules/mobility/core/RideStateMachine';

let supabaseAdmin: ReturnType<typeof createOperationalAdminClient> | undefined;

function getSupabaseAdmin() {
  supabaseAdmin ??= createOperationalAdminClient();
  return supabaseAdmin;
}

interface PollResult {
  success: boolean;
  currentStatus?: string;
  error?: string;
  elapsedMs?: number;
}

interface AuditTransition {
  from_state: string;
  to_state: string;
  changed_by: string;
  reason: string;
  created_at: string;
}

/**
 * Aguarda corrida atingir um dos estados esperados
 * Polling com intervalo de 500ms
 */
export async function waitForRideStatus(
  rideId: string,
  expectedStatuses: RideState[],
  timeoutMs: number = 10000
): Promise<PollResult> {
  const startTime = Date.now();
  const pollInterval = 500; // 500ms entre verificações
  
  while (Date.now() - startTime < timeoutMs) {
    const { data: ride, error } = await getSupabaseAdmin()
      .from('ride_requests')
      .select('status')
      .eq('id', rideId)
      .single();
    
    if (error) {
      return {
        success: false,
        error: `Erro ao buscar corrida: ${error.message}`,
        elapsedMs: Date.now() - startTime,
      };
    }
    
    if (!ride) {
      return {
        success: false,
        error: 'Corrida não encontrada',
        elapsedMs: Date.now() - startTime,
      };
    }
    
    if (expectedStatuses.includes(ride.status as RideState)) {
      return {
        success: true,
        currentStatus: ride.status,
        elapsedMs: Date.now() - startTime,
      };
    }
    
    // Aguardar antes da próxima verificação
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  // Timeout - buscar status atual para mensagem de erro
  const { data: ride } = await getSupabaseAdmin()
    .from('ride_requests')
    .select('status')
    .eq('id', rideId)
    .single();
  
  return {
    success: false,
    currentStatus: ride?.status,
    error: `Timeout após ${timeoutMs}ms. Status atual: ${ride?.status}. Esperado: ${expectedStatuses.join(', ')}`,
    elapsedMs: Date.now() - startTime,
  };
}

/**
 * Aguarda transição específica aparecer na auditoria
 * Polling com intervalo de 500ms
 */
export async function waitForAuditTransition(
  rideId: string,
  toStatus: RideState,
  timeoutMs: number = 10000
): Promise<PollResult & { transition?: AuditTransition }> {
  const startTime = Date.now();
  const pollInterval = 500;
  
  while (Date.now() - startTime < timeoutMs) {
    const { data: transitions, error } = await getSupabaseAdmin()
      .from('ride_state_audit')
      .select('from_state, to_state, changed_by, reason, created_at')
      .eq('ride_id', rideId)
      .eq('to_state', toStatus)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      return {
        success: false,
        error: `Erro ao buscar auditoria: ${error.message}`,
        elapsedMs: Date.now() - startTime,
      };
    }
    
    if (transitions && transitions.length > 0) {
      return {
        success: true,
        transition: transitions[0] as AuditTransition,
        elapsedMs: Date.now() - startTime,
      };
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  return {
    success: false,
    error: `Timeout após ${timeoutMs}ms. Transição para '${toStatus}' não encontrada na auditoria`,
    elapsedMs: Date.now() - startTime,
  };
}

/**
 * Valida que motorista está realmente disponível no banco
 * Retorna erro explícito se não estiver
 */
export async function validateDriverAvailable(
  driverProfileId: string
): Promise<{ valid: boolean; error?: string; state?: any }> {
  const { data: driver, error } = await getSupabaseAdmin()
    .from('driver_availability')
    .select('is_online, is_available, active_ride_id, current_lat, current_lng')
    .eq('profile_id', driverProfileId)
    .single();
  
  if (error) {
    return {
      valid: false,
      error: `Erro ao buscar motorista: ${error.message}`,
    };
  }
  
  if (!driver) {
    return {
      valid: false,
      error: `Motorista ${driverProfileId} não encontrado em driver_availability`,
    };
  }
  
  if (!driver.is_online) {
    return {
      valid: false,
      error: `Motorista ${driverProfileId} não está online (is_online = false)`,
      state: driver,
    };
  }
  
  if (!driver.is_available) {
    return {
      valid: false,
      error: `Motorista ${driverProfileId} não está disponível (is_available = false)`,
      state: driver,
    };
  }
  
  if (driver.active_ride_id) {
    return {
      valid: false,
      error: `Motorista ${driverProfileId} tem corrida ativa (active_ride_id = ${driver.active_ride_id})`,
      state: driver,
    };
  }
  
  if (!driver.current_lat || !driver.current_lng) {
    return {
      valid: false,
      error: `Motorista ${driverProfileId} não tem coordenadas (current_lat/lng = null)`,
      state: driver,
    };
  }
  
  return {
    valid: true,
    state: driver,
  };
}

/**
 * Valida que NÃO há motoristas disponíveis
 * Retorna erro se encontrar algum disponível
 */
export async function validateNoDriversAvailable(
  driverProfileIds?: string[]
): Promise<{ valid: boolean; error?: string; count?: number; driverIds?: string[] }> {
  let query = getSupabaseAdmin()
    .from('driver_availability')
    .select('profile_id')
    .eq('is_online', true)
    .eq('is_available', true)
    .is('active_ride_id', null);

  if (driverProfileIds && driverProfileIds.length > 0) {
    query = query.in('profile_id', driverProfileIds);
  }

  const { data: drivers, error } = await query;
  
  if (error) {
    return {
      valid: false,
      error: `Erro ao buscar motoristas: ${error.message}`,
    };
  }
  
  const count = drivers?.length || 0;
  
  if (count > 0) {
    const driverIds = (drivers || []).map(d => d.profile_id);
    return {
      valid: false,
      error: `PRÉ-CONDIÇÃO FALHOU: Encontrados ${count} motoristas disponíveis. Esperado: 0. IDs: ${driverIds.join(', ')}`,
      count,
      driverIds,
    };
  }
  
  return {
    valid: true,
    count: 0,
  };
}

/**
 * Aguarda motorista atingir status específico
 * Polling com intervalo de 500ms
 */
export async function waitForDriverStatus(
  driverProfileId: string,
  expectedStatus: 'online_available' | 'busy' | 'online_warming_up' | 'offline',
  timeoutMs: number = 10000
): Promise<PollResult> {
  const startTime = Date.now();
  const pollInterval = 500;
  
  while (Date.now() - startTime < timeoutMs) {
    const { data: driver, error } = await getSupabaseAdmin()
      .from('driver_availability')
      .select('is_online, is_available, active_ride_id')
      .eq('profile_id', driverProfileId)
      .single();
    
    if (error || !driver) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      continue;
    }
    
    // Calcular status atual
    let currentStatus: string;
    if (!driver.is_online) {
      currentStatus = 'offline';
    } else if (driver.active_ride_id) {
      currentStatus = 'busy';
    } else if (driver.is_available) {
      currentStatus = 'online_available';
    } else {
      currentStatus = 'online_warming_up';
    }
    
    if (currentStatus === expectedStatus) {
      return {
        success: true,
        currentStatus,
        elapsedMs: Date.now() - startTime,
      };
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  // Timeout - buscar status atual
  const { data: driver } = await getSupabaseAdmin()
    .from('driver_availability')
    .select('is_online, is_available, active_ride_id')
    .eq('profile_id', driverProfileId)
    .single();
  
  let currentStatus = 'unknown';
  if (driver) {
    if (!driver.is_online) currentStatus = 'offline';
    else if (driver.active_ride_id) currentStatus = 'busy';
    else if (driver.is_available) currentStatus = 'online_available';
    else currentStatus = 'online_warming_up';
  }
  
  return {
    success: false,
    currentStatus,
    error: `Timeout após ${timeoutMs}ms. Status atual: ${currentStatus}. Esperado: ${expectedStatus}`,
    elapsedMs: Date.now() - startTime,
  };
}

/**
 * Aguarda múltiplos motoristas estarem disponíveis
 * Útil para testes de concorrência
 */
export async function waitForDriversAvailable(
  driverProfileIds: string[],
  timeoutMs: number = 10000
): Promise<{ success: boolean; errors: string[] }> {
  const startTime = Date.now();
  const pollInterval = 500;
  
  while (Date.now() - startTime < timeoutMs) {
    const validations = await Promise.all(
      driverProfileIds.map(id => validateDriverAvailable(id))
    );
    
    const allValid = validations.every(v => v.valid);
    
    if (allValid) {
      return { success: true, errors: [] };
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  // Timeout - coletar erros
  const validations = await Promise.all(
    driverProfileIds.map(id => validateDriverAvailable(id))
  );
  
  const errors = validations
    .filter(v => !v.valid)
    .map(v => v.error!);
  
  return {
    success: false,
    errors,
  };
}

/**
 * Busca todas transições de uma corrida na auditoria
 * Útil para validação completa do fluxo
 */
export async function getRideAuditTrail(
  rideId: string
): Promise<AuditTransition[]> {
  const { data: transitions, error } = await getSupabaseAdmin()
    .from('ride_state_audit')
    .select('from_state, to_state, changed_by, reason, created_at')
    .eq('ride_id', rideId)
    .order('created_at', { ascending: true });
  
  if (error) {
    throw new Error(`Erro ao buscar auditoria: ${error.message}`);
  }
  
  return (transitions || []) as AuditTransition[];
}
