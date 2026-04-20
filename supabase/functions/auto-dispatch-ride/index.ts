// Supabase Edge Function - Auto Dispatch Ride
// Deploy: supabase functions deploy auto-dispatch-ride

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAllSecurityHeaders, isOriginAllowed, errorResponse } from '../_shared/security.ts';
import { validateBody, dispatchRideSchema, validationErrorResponse, type DispatchRideBody } from '../_shared/validation.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

/**
 * CRON_SECRET: segredo dedicado para autenticação de chamadas internas/cron.
 *
 * SSOT: mesmo padrão de `process-timeouts/index.ts`.
 *
 * NUNCA use SUPABASE_SERVICE_ROLE_KEY como token de autenticação HTTP —
 * essa chave tem acesso irrestrito ao banco e não deve trafegar em headers.
 * Configure CRON_SECRET como variável de ambiente separada no Supabase Dashboard.
 */
const CRON_SECRET = Deno.env.get('CRON_SECRET') || '';

// Configurações
const CONFIG = {
  OFFER_TIMEOUT_SECONDS: 30,
  MAX_RETRY_ATTEMPTS: 5,
  TOTAL_TIMEOUT_MINUTES: 10,
  SEARCH_RADIUS_KM: 10,
};

interface DriverEligibility {
  profileId: string;
  distance: number;
  rating: number;
}

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7).trim();
}

/**
 * Valida autenticação da requisição.
 *
 * Aceita:
 * 1. Header `x-cron-secret` com o valor de CRON_SECRET (preferencial)
 * 2. Bearer token igual a CRON_SECRET (compatibilidade com schedulers que
 *    só suportam Authorization header)
 *
 * SSOT: mesmo padrão de `process-timeouts/index.ts`.
 */
function isAuthorized(req: Request): boolean {
  if (!CRON_SECRET) return false;

  const cronHeader = req.headers.get('x-cron-secret') || '';
  const bearerToken = extractBearerToken(req);

  return cronHeader === CRON_SECRET || bearerToken === CRON_SECRET;
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  if (origin && !isOriginAllowed(origin)) {
    return new Response(
      JSON.stringify({ error: 'Origin not allowed' }),
      {
        status: 403,
        headers: {
          ...getAllSecurityHeaders('POST, OPTIONS'),
          'Content-Type': 'application/json',
        },
      },
    );
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 204,
      headers: getAllSecurityHeaders('POST, OPTIONS'),
    });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: 'Function misconfigured: missing Supabase credentials' }),
      { status: 500, headers: getAllSecurityHeaders('POST, OPTIONS') },
    );
  }

  if (!CRON_SECRET) {
    console.error('[AutoDispatch] CRON_SECRET não configurado — requisição bloqueada');
    return new Response(
      JSON.stringify({ error: 'Function misconfigured: CRON_SECRET not set' }),
      { status: 500, headers: getAllSecurityHeaders('POST, OPTIONS') },
    );
  }

  if (!isAuthorized(req)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      {
        status: 401,
        headers: {
          ...getAllSecurityHeaders('POST, OPTIONS'),
          'Content-Type': 'application/json',
        },
      },
    );
  }

  try {
    const rawBody = await req.json();
    const validation = validateBody<DispatchRideBody>(rawBody, dispatchRideSchema);
    if (!validation.ok) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validation.errors }),
        { status: 400, headers: getAllSecurityHeaders() }
      );
    }
    const { rideId } = validation.data!;

    console.log(`[AutoDispatch] Starting for ride: ${rideId}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Buscar dados da corrida
    const { data: ride, error: rideError } = await supabase
      .from('ride_requests')
      .select(`
        id,
        status,
        created_at,
        ride_mode,
        pickup_address_id,
        addresses!pickup_address_id(latitude, longitude)
      `)
      .eq('id', rideId)
      .single();

    if (rideError || !ride) {
      console.error('[AutoDispatch] Ride not found:', rideError);
      return new Response(
        JSON.stringify({ error: 'Ride not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar estado
    if (ride.status !== 'searching_driver') {
      console.log(`[AutoDispatch] Invalid state: ${ride.status}`);
      return new Response(
        JSON.stringify({ error: `Invalid state: ${ride.status}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar timeout total
    const createdAt = new Date(ride.created_at);
    const now = new Date();
    const minutesElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    
    if (minutesElapsed > CONFIG.TOTAL_TIMEOUT_MINUTES) {
      await expireRide(supabase, rideId, 'Total timeout exceeded');
      return new Response(
        JSON.stringify({ success: false, reason: 'expired' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Buscar coordenadas - addresses é um array, pegar o primeiro elemento
    const addressData = Array.isArray(ride.addresses) ? ride.addresses[0] : ride.addresses;
    const pickupLat = addressData?.latitude;
    const pickupLng = addressData?.longitude;

    if (!pickupLat || !pickupLng) {
      console.error('[AutoDispatch] Missing coordinates');
      return new Response(
        JSON.stringify({ error: 'Missing pickup coordinates' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Buscar motoristas elegíveis
    const eligibleDrivers = await findEligibleDrivers(
      supabase,
      rideId,
      pickupLat,
      pickupLng,
      ride.ride_mode || 'ride' // Passar ride_mode para filtrar motoristas
    );

    if (eligibleDrivers.length === 0) {
      await expireRide(supabase, rideId, 'No eligible drivers found');
      return new Response(
        JSON.stringify({ success: false, reason: 'no_drivers' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[AutoDispatch] Found ${eligibleDrivers.length} eligible drivers`);

    // Tentar oferecer para motoristas sequencialmente
    const maxAttempts = Math.min(eligibleDrivers.length, CONFIG.MAX_RETRY_ATTEMPTS);
    
    for (let i = 0; i < maxAttempts; i++) {
      const driver = eligibleDrivers[i];
      const attemptNumber = i + 1;

      console.log(`[AutoDispatch] Attempt ${attemptNumber}: offering to ${driver.profileId}`);

      // Registrar tentativa
      await logDispatchAttempt(supabase, {
        rideId,
        driverProfileId: driver.profileId,
        attemptNumber,
        offeredAt: new Date().toISOString(),
        timeoutAt: new Date(Date.now() + CONFIG.OFFER_TIMEOUT_SECONDS * 1000).toISOString(),
        status: 'pending',
      });

      // Atribuir motorista
      const assigned = await assignDriver(supabase, rideId, driver.profileId);

      if (!assigned) {
        console.log(`[AutoDispatch] Failed to assign driver ${driver.profileId}`);
        continue;
      }

      // Aguardar aceite ou timeout
      const accepted = await waitForAcceptance(
        supabase,
        rideId,
        driver.profileId,
        CONFIG.OFFER_TIMEOUT_SECONDS
      );

      if (accepted) {
        // Sucesso!
        await updateDispatchAttempt(supabase, rideId, driver.profileId, {
          status: 'accepted',
          respondedAt: new Date().toISOString(),
        });

        console.log(`[AutoDispatch] Driver ${driver.profileId} accepted`);

        return new Response(
          JSON.stringify({
            success: true,
            driverProfileId: driver.profileId,
            totalAttempts: attemptNumber,
            reason: 'accepted',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Timeout - tentar próximo
      await updateDispatchAttempt(supabase, rideId, driver.profileId, {
        status: 'timeout',
        respondedAt: new Date().toISOString(),
      });

      console.log(`[AutoDispatch] Driver ${driver.profileId} timeout, trying next`);

      // Voltar para searching_driver
      await supabase
        .from('ride_requests')
        .update({
          status: 'searching_driver',
          driver_profile_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', rideId);
    }

    // Nenhum motorista aceitou
    await expireRide(supabase, rideId, 'No driver accepted after all attempts');
    
    return new Response(
      JSON.stringify({
        success: false,
        totalAttempts: maxAttempts,
        reason: 'expired',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AutoDispatch] Error:', error);
    return errorResponse('Internal server error', 500, error);
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function findEligibleDrivers(
  supabase: any,
  rideId: string,
  originLat: number,
  originLng: number,
  rideMode: string = 'ride'
): Promise<DriverEligibility[]> {
  // Buscar motoristas online e disponíveis
  // Se ride_mode = 'motoboy', filtrar apenas motoristas com can_do_delivery = true
  let query = supabase
    .from('driver_availability')
    .select(`
      profile_id,
      current_lat,
      current_lng,
      profiles!inner(rating),
      driver_data!inner(can_do_delivery)
    `)
    .eq('is_online', true)
    .eq('is_available', true);
  
  // Filtrar por tipo de corrida
  if (rideMode === 'motoboy') {
    query = query.eq('driver_data.can_do_delivery', true);
  }

  const { data: drivers, error } = await query;

  if (error || !drivers) {
    console.error('[AutoDispatch] Error finding drivers:', error);
    return [];
  }

  // Verificar motoristas com corrida ativa
  const profileIds = drivers.map((d: any) => d.profile_id);
  const { data: activeRides } = await supabase
    .from('ride_requests')
    .select('driver_profile_id')
    .in('driver_profile_id', profileIds)
    .in('status', ['driver_accepted', 'driver_arriving', 'passenger_boarded', 'in_progress']);

  const busyDrivers = new Set(activeRides?.map((r: any) => r.driver_profile_id) || []);

  // Calcular distância e filtrar
  const eligible: DriverEligibility[] = drivers
    .filter((d: any) => !busyDrivers.has(d.profile_id))
    .map((d: any) => {
      const distance = calculateDistance(
        originLat,
        originLng,
        d.current_lat || 0,
        d.current_lng || 0
      );

      return {
        profileId: d.profile_id,
        distance,
        rating: d.profiles?.rating || 0,
      };
    })
    .filter((d: DriverEligibility) => d.distance <= CONFIG.SEARCH_RADIUS_KM)
    .sort((a: DriverEligibility, b: DriverEligibility) => a.distance - b.distance);

  return eligible;
}

async function assignDriver(
  supabase: any,
  rideId: string,
  driverProfileId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('ride_requests')
    .update({
      driver_profile_id: driverProfileId,
      status: 'driver_assigned',
      updated_at: new Date().toISOString(),
    })
    .eq('id', rideId)
    .eq('status', 'searching_driver');

  if (error) {
    console.error('[AutoDispatch] Error assigning driver:', error);
    return false;
  }

  // Registrar auditoria de estado
  await supabase.from('ride_state_audit').insert({
    ride_id: rideId,
    from_state: 'searching_driver',
    to_state: 'driver_assigned',
    changed_by: 'system',
    reason: 'Driver assigned by auto-dispatch',
    created_at: new Date().toISOString(),
  });

  return true;
}

async function waitForAcceptance(
  supabase: any,
  rideId: string,
  driverProfileId: string,
  timeoutSeconds: number
): Promise<boolean> {
  const startTime = Date.now();
  const timeoutMs = timeoutSeconds * 1000;

  while (Date.now() - startTime < timeoutMs) {
    const { data: ride } = await supabase
      .from('ride_requests')
      .select('status, driver_profile_id')
      .eq('id', rideId)
      .single();

    if (ride?.status === 'driver_accepted' && ride?.driver_profile_id === driverProfileId) {
      return true;
    }

    if (ride?.status !== 'driver_assigned') {
      return false;
    }

    // Aguardar 1 segundo antes de verificar novamente
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return false;
}

async function expireRide(supabase: any, rideId: string, reason: string): Promise<void> {
  await supabase
    .from('ride_requests')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString(),
    })
    .eq('id', rideId)
    .in('status', ['searching_driver', 'driver_assigned']);

  await supabase.from('ride_state_audit').insert({
    ride_id: rideId,
    from_state: 'searching_driver',
    to_state: 'expired',
    changed_by: 'system',
    reason,
    created_at: new Date().toISOString(),
  });

  console.log(`[AutoDispatch] Ride expired: ${reason}`);
}

async function logDispatchAttempt(supabase: any, attempt: any): Promise<void> {
  await supabase.from('ride_dispatch_audit').insert({
    ride_id: attempt.rideId,
    driver_profile_id: attempt.driverProfileId,
    attempt_number: attempt.attemptNumber,
    offered_at: attempt.offeredAt,
    timeout_at: attempt.timeoutAt,
    status: attempt.status,
    created_at: new Date().toISOString(),
  });
}

async function updateDispatchAttempt(
  supabase: any,
  rideId: string,
  driverProfileId: string,
  updates: any
): Promise<void> {
  const { data: attempts } = await supabase
    .from('ride_dispatch_audit')
    .select('id')
    .eq('ride_id', rideId)
    .eq('driver_profile_id', driverProfileId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (attempts && attempts.length > 0) {
    await supabase
      .from('ride_dispatch_audit')
      .update(updates)
      .eq('id', attempts[0].id);
  }
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

