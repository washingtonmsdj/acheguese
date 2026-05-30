/**
 * TEST CLEANUP HELPERS
 * 
 * Helpers para garantir cleanup seguro após testes assíncronos
 * com edge functions e processamento em background.
 */

import { createOperationalAdminClient } from './operational-env';

let supabaseAdmin: ReturnType<typeof createOperationalAdminClient> | undefined;

function getSupabaseAdmin() {
  supabaseAdmin ??= createOperationalAdminClient();
  return supabaseAdmin;
}

/**
 * Aguarda ride chegar em estado terminal ou timeout
 * 
 * Estados terminais: completed, cancelled_by_passenger, cancelled_by_driver, expired, failed_delivery
 */
export async function waitForRideQuiescence(
  rideId: string,
  timeoutMs: number = 10000
): Promise<{ success: boolean; finalState?: string; error?: string }> {
  const terminalStates = [
    'completed',
    'cancelled_by_passenger',
    'cancelled_by_driver',
    'expired',
    'failed_delivery',
  ];

  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const { data: ride } = await getSupabaseAdmin()
      .from('ride_requests')
      .select('status')
      .eq('id', rideId)
      .maybeSingle();

    if (!ride) {
      // Ride foi deletada, considerar quiescente
      return { success: true, finalState: 'deleted' };
    }

    if (terminalStates.includes(ride.status)) {
      return { success: true, finalState: ride.status };
    }

    // Aguardar 500ms antes de checar novamente
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Timeout
  const { data: ride } = await getSupabaseAdmin()
    .from('ride_requests')
    .select('status')
    .eq('id', rideId)
    .maybeSingle();

  return {
    success: false,
    finalState: ride?.status,
    error: `Timeout waiting for ride quiescence. Current state: ${ride?.status}`,
  };
}

/**
 * Aguarda múltiplas rides chegarem em estado terminal
 */
export async function waitForMultipleRidesQuiescence(
  rideIds: string[],
  timeoutMs: number = 10000
): Promise<{ success: boolean; results: Record<string, string>; error?: string }> {
  const results: Record<string, string> = {};

  for (const rideId of rideIds) {
    const result = await waitForRideQuiescence(rideId, timeoutMs);
    results[rideId] = result.finalState || 'unknown';

    if (!result.success) {
      return {
        success: false,
        results,
        error: result.error,
      };
    }
  }

  return { success: true, results };
}

/**
 * Cleanup seguro de rides criadas no teste
 * 
 * Aguarda quiescência antes de deletar
 */
export async function safeCleanupRides(
  rideIds: string[],
  timeoutMs: number = 10000
): Promise<void> {
  // Aguardar quiescência
  await waitForMultipleRidesQuiescence(rideIds, timeoutMs);

  // Deletar rides
  if (rideIds.length > 0) {
    await getSupabaseAdmin()
      .from('ride_requests')
      .delete()
      .in('id', rideIds);
  }
}

/**
 * Cleanup seguro de verificações operacionais
 */
export async function safeCleanupVerifications(
  rideIds: string[]
): Promise<void> {
  if (rideIds.length > 0) {
    await getSupabaseAdmin()
      .from('operational_verifications')
      .delete()
      .in('ride_id', rideIds);
  }
}
