/**
 * GATE 6: HELPERS DE SETUP DETERMINÍSTICO
 *
 * Garante que motoristas estão REALMENTE disponíveis antes de criar corrida.
 * Valida estado no banco, não confia apenas em retorno de API.
 */

import { DriverAvailabilityService } from '@/core/mobility/services/DriverAvailabilityService';
import { authenticateAsProfile } from './auth-helper';
import { validateDriverAvailable } from './gate6-polling-helpers';
import { createOperationalAdminClient } from './operational-env';

let supabaseAdmin: ReturnType<typeof createOperationalAdminClient> | undefined;

function getSupabaseAdmin() {
  supabaseAdmin ??= createOperationalAdminClient();
  return supabaseAdmin;
}

interface SetupDriverResult {
  success: boolean;
  driverProfileId: string;
  error?: string;
  state?: DriverAvailabilityState;
}

interface DriverAvailabilityState {
  is_online: boolean;
  is_available: boolean;
  active_ride_id: string | null;
  current_lat: number | null;
  current_lng: number | null;
}

/**
 * Setup completo de motorista disponível com validação no banco
 *
 * Executa:
 * 0. Limpa estado anterior (goOffline se necessário)
 * 1. Autentica como motorista
 * 2. goOnline()
 * 3. setAvailable() com coordenadas
 * 4. VALIDA no banco que está realmente disponível
 *
 * Falha imediatamente se qualquer etapa falhar
 */
export async function setupDriverAvailable(
  driverProfileId: string,
  lat: number,
  lng: number
): Promise<SetupDriverResult> {
  try {
    const { error: capabilityError } = await getSupabaseAdmin()
      .from('driver_data')
      .upsert({
        profile_id: driverProfileId,
        is_verified: true,
        subscription_active: true,
        can_do_delivery: true,
        can_do_rides: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id' });

    if (capabilityError) {
      return {
        success: false,
        driverProfileId,
        error: `driver_data fixture falhou: ${capabilityError.message}`,
      };
    }

    // 0. Autenticar e limpar estado anterior
    await authenticateAsProfile(driverProfileId);

    // Tentar ir offline primeiro (ignora erro se já estiver offline)
    try {
      await DriverAvailabilityService.goOffline(driverProfileId);
      // Aguardar propagação do estado
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      // Ignorar erro se já estiver offline
      console.log(`Driver ${driverProfileId} já estava offline ou sem registro`);
    }

    // 1. goOnline()
    const onlineResult = await DriverAvailabilityService.goOnline(driverProfileId);
    if (!onlineResult.success) {
      return {
        success: false,
        driverProfileId,
        error: `goOnline() falhou: ${onlineResult.error}`,
      };
    }

    // 2. setAvailable() com coordenadas
    const availableResult = await DriverAvailabilityService.setAvailable(
      driverProfileId,
      { lat, lng }
    );
    if (!availableResult.success) {
      return {
        success: false,
        driverProfileId,
        error: `setAvailable() falhou: ${availableResult.error}`,
      };
    }

    // 3. VALIDAR no banco que está realmente disponível
    const validation = await validateDriverAvailable(driverProfileId);
    if (!validation.valid) {
      return {
        success: false,
        driverProfileId,
        error: `Validação no banco falhou: ${validation.error}`,
        state: validation.state,
      };
    }

    return {
      success: true,
      driverProfileId,
      state: validation.state,
    };
  } catch (error) {
    return {
      success: false,
      driverProfileId,
      error: `Exceção durante setup: ${(error as Error).message}`,
    };
  }
}

/**
 * Setup de múltiplos motoristas disponíveis
 * Falha se qualquer motorista não ficar disponível
 */
export async function setupMultipleDriversAvailable(
  drivers: Array<{ id: string; lat: number; lng: number }>
): Promise<{ success: boolean; results: SetupDriverResult[] }> {
  const results: SetupDriverResult[] = [];

  for (const driver of drivers) {
    const result = await setupDriverAvailable(driver.id, driver.lat, driver.lng);
    results.push(result);

    if (!result.success) {
      // Falha imediata no primeiro erro
      return {
        success: false,
        results,
      };
    }
  }

  return {
    success: true,
    results,
  };
}

/**
 * Limpa estado de motorista (offline)
 * Útil para testes de expiração (sem motoristas disponíveis)
 */
export async function cleanupDriver(driverProfileId: string): Promise<void> {
  try {
    await authenticateAsProfile(driverProfileId);
    await DriverAvailabilityService.goOffline(driverProfileId);
  } catch (error) {
    // Ignorar erros de cleanup
    console.warn(`Cleanup de motorista ${driverProfileId} falhou:`, error);
  }
}

/**
 * Limpa múltiplos motoristas
 */
export async function cleanupMultipleDrivers(driverProfileIds: string[]): Promise<void> {
  await Promise.all(
    driverProfileIds.map(id => cleanupDriver(id))
  );
}
