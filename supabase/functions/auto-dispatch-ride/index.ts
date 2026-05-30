// Supabase Edge Function - Auto Dispatch Ride
// Deploy: supabase functions deploy auto-dispatch-ride

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  getAllSecurityHeaders,
  isOriginAllowed,
  jsonResponse,
  rateLimitMiddleware,
  readJsonBody,
  requireCronSecret,
  requireHttpMethod,
} from '../_shared/security.ts';
import { validateBody, dispatchRideSchema, type DispatchRideBody } from '../_shared/validation.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ALLOWED_METHODS = 'POST, OPTIONS';

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

function dispatchJson(req: Request, body: unknown, status = 200): Response {
  return jsonResponse(body, status, ALLOWED_METHODS, req);
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  if (origin && !isOriginAllowed(origin)) {
    return dispatchJson(req, { error: 'Origin not allowed' }, 403);
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 204,
      headers: getAllSecurityHeaders(ALLOWED_METHODS, req),
    });
  }

  const methodError = requireHttpMethod(req, ['POST'], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 30, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return dispatchJson(req, { error: 'Function misconfigured: missing Supabase credentials' }, 500);
  }

  const cronAuthError = requireCronSecret(req, ALLOWED_METHODS);
  if (cronAuthError) return cronAuthError;

  try {
    const rawBody = await readJsonBody<DispatchRideBody>(req, {
      maxBytes: 4096,
      methods: ALLOWED_METHODS,
    });
    if (!rawBody.ok) return rawBody.response;

    const validation = validateBody<DispatchRideBody>(rawBody.data, dispatchRideSchema);
    if (!validation.ok) {
      return dispatchJson(req, { error: 'Validation failed', details: validation.errors }, 400);
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
      return dispatchJson(req, { error: 'Ride not found' }, 404);
    }

    // Validar estado
    if (ride.status !== 'searching_driver') {
      console.log(`[AutoDispatch] Invalid state: ${ride.status}`);
      return dispatchJson(req, { error: `Invalid state: ${ride.status}` }, 400);
    }

    // Verificar timeout total
    const createdAt = new Date(ride.created_at);
    const now = new Date();
    const minutesElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    
    if (minutesElapsed > CONFIG.TOTAL_TIMEOUT_MINUTES) {
      await expireRide(supabase, rideId, 'Total timeout exceeded');
      return dispatchJson(req, { success: false, reason: 'expired' });
    }

    // Buscar coordenadas - addresses é um array, pegar o primeiro elemento
    const addressData = Array.isArray(ride.addresses) ? ride.addresses[0] : ride.addresses;
    const pickupLat = addressData?.latitude;
    const pickupLng = addressData?.longitude;

    if (!pickupLat || !pickupLng) {
      console.error('[AutoDispatch] Missing coordinates');
      return dispatchJson(req, { error: 'Missing pickup coordinates' }, 400);
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
      return dispatchJson(req, { success: false, reason: 'no_drivers' });
    }

    console.log(`[AutoDispatch] Found ${eligibleDrivers.length} eligible drivers`);

    // Tentar oferecer para motoristas sequencialmente
    const maxAttempts = Math.min(eligibleDrivers.length, CONFIG.MAX_RETRY_ATTEMPTS);
    
    for (const [index, driver] of eligibleDrivers.slice(0, maxAttempts).entries()) {
      const attemptNumber = index + 1;

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

        return dispatchJson(
          req,
          {
            success: true,
            driverProfileId: driver.profileId,
            totalAttempts: attemptNumber,
            reason: 'accepted',
          },
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
    
    return dispatchJson(
      req,
      {
        success: false,
        totalAttempts: maxAttempts,
        reason: 'expired',
      },
    );

  } catch (error) {
    console.error('[AutoDispatch] Error:', error);
    return dispatchJson(req, { error: 'Internal server error' }, 500);
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

