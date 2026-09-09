// Supabase Edge Function - Auto Dispatch Ride
// Deploy: supabase functions deploy auto-dispatch-ride

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
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

interface DriverProfileRatingRow {
  rating?: number | null;
}

interface DriverCapabilityRow {
  can_do_delivery?: boolean | null;
  can_do_rides?: boolean | null;
  is_verified?: boolean | null;
  subscription_active?: boolean | null;
}

interface DriverAvailabilityRow {
  profile_id: string;
  current_lat: number | null;
  current_lng: number | null;
  profiles?: DriverProfileRatingRow | DriverProfileRatingRow[] | null;
  driver_data?: DriverCapabilityRow | DriverCapabilityRow[] | null;
}

interface ActiveRideDriverRow {
  driver_profile_id: string | null;
}

interface AtomicDispatchResult {
  success?: boolean;
  reason?: string;
  status?: string;
  driver_profile_id?: string | null;
}

function getDriverRating(profileData: DriverAvailabilityRow['profiles']): number {
  const profile = Array.isArray(profileData) ? profileData[0] : profileData;
  return typeof profile?.rating === 'number' ? profile.rating : 0;
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

      const timeoutAt = new Date(
        Date.now() + CONFIG.OFFER_TIMEOUT_SECONDS * 1000,
      ).toISOString();

      // Assignment + dispatch audit + state audit pertencem ao mesmo command
      // server-side. Se outro dispatch reservar o motorista primeiro, este
      // candidato falha fechado e o loop tenta o próximo.
      const assignment = await offerDriverAtomic(
        supabase,
        rideId,
        driver.profileId,
        attemptNumber,
        timeoutAt,
      );

      if (!assignment.success) {
        console.log(
          `[AutoDispatch] Failed to atomically assign driver ${driver.profileId}: ${assignment.reason ?? 'unknown'}`,
        );
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
        // O accept_ride_atomic já fecha offer + availability + estado + audit
        // na mesma transação.
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

      // Timeout: somente libera a oferta se ela ainda pertencer a este
      // motorista e continuar em driver_assigned. Nunca sobrescreve um aceite
      // ou cancelamento concorrente.
      const timeoutResult = await timeoutDriverOfferAtomic(
        supabase,
        rideId,
        driver.profileId,
      );

      if (!timeoutResult.success) {
        console.log(
          `[AutoDispatch] Offer changed before timeout release: ${timeoutResult.reason ?? 'state_changed'}`,
        );
        return dispatchJson(req, {
          success: false,
          reason: timeoutResult.reason ?? 'state_changed',
        });
      }

      console.log(`[AutoDispatch] Driver ${driver.profileId} timeout, trying next`);
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
  supabase: SupabaseClient,
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
      driver_data!inner(
        can_do_delivery,
        can_do_rides,
        is_verified,
        subscription_active
      )
    `)
    .eq('is_online', true)
    .eq('is_available', true)
    .eq('driver_data.is_verified', true)
    .eq('driver_data.subscription_active', true);
  
  // Pré-filtro para evitar candidatos inviáveis. A autorização definitiva
  // continua no command atômico, sob lock.
  if (rideMode === 'motoboy') {
    query = query.eq('driver_data.can_do_delivery', true);
  } else {
    query = query.eq('driver_data.can_do_rides', true);
  }

  const { data: drivers, error } = await query;

  if (error || !drivers) {
    console.error('[AutoDispatch] Error finding drivers:', error);
    return [];
  }

  // Verificar motoristas com corrida ativa
  const driverRows = drivers as DriverAvailabilityRow[];
  const profileIds = driverRows.map((driver) => driver.profile_id);
  const { data: activeRides } = await supabase
    .from('ride_requests')
    .select('driver_profile_id')
    .in('driver_profile_id', profileIds)
    .in('status', [
      'driver_assigned',
      'driver_accepted',
      'driver_arriving',
      'driver_on_the_way',
      'driver_arrived',
      'passenger_on_board',
      'passenger_boarded',
      'in_progress',
      'pickup_confirmed',
      'in_delivery',
      'delivered',
    ]);

  const activeRideRows = (activeRides ?? []) as ActiveRideDriverRow[];
  const busyDrivers = new Set(
    activeRideRows
      .map((ride) => ride.driver_profile_id)
      .filter((profileId): profileId is string => typeof profileId === 'string' && profileId.length > 0),
  );

  // Calcular distância e filtrar
  const eligible: DriverEligibility[] = driverRows
    .filter((driver) => !busyDrivers.has(driver.profile_id))
    .map((driver) => {
      const distance = calculateDistance(
        originLat,
        originLng,
        driver.current_lat || 0,
        driver.current_lng || 0
      );

      return {
        profileId: driver.profile_id,
        distance,
        rating: getDriverRating(driver.profiles),
      };
    })
    .filter((d: DriverEligibility) => d.distance <= CONFIG.SEARCH_RADIUS_KM)
    .sort((a: DriverEligibility, b: DriverEligibility) => a.distance - b.distance);

  return eligible;
}

async function offerDriverAtomic(
  supabase: SupabaseClient,
  rideId: string,
  driverProfileId: string,
  attemptNumber: number,
  timeoutAt: string,
): Promise<AtomicDispatchResult> {
  const { data, error } = await supabase.rpc('mobility_offer_driver_atomic', {
    p_ride_id: rideId,
    p_driver_profile_id: driverProfileId,
    p_attempt_number: attemptNumber,
    p_timeout_at: timeoutAt,
    p_reason: 'Driver assigned by auto-dispatch',
  });

  if (error) {
    console.error('[AutoDispatch] Atomic driver assignment failed:', error);
    return { success: false, reason: 'command_error' };
  }

  return (data ?? { success: false, reason: 'empty_response' }) as AtomicDispatchResult;
}

async function timeoutDriverOfferAtomic(
  supabase: SupabaseClient,
  rideId: string,
  driverProfileId: string,
): Promise<AtomicDispatchResult> {
  const { data, error } = await supabase.rpc(
    'mobility_timeout_driver_offer_atomic',
    {
      p_ride_id: rideId,
      p_driver_profile_id: driverProfileId,
      p_reason: 'Driver offer timed out in auto-dispatch',
    },
  );

  if (error) {
    console.error('[AutoDispatch] Atomic timeout release failed:', error);
    return { success: false, reason: 'command_error' };
  }

  return (data ?? { success: false, reason: 'empty_response' }) as AtomicDispatchResult;
}

async function waitForAcceptance(
  supabase: SupabaseClient,
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

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return false;
}

async function expireRide(
  supabase: SupabaseClient,
  rideId: string,
  reason: string,
): Promise<AtomicDispatchResult> {
  const { data, error } = await supabase.rpc('mobility_expire_dispatch_atomic', {
    p_ride_id: rideId,
    p_reason: reason,
  });

  if (error) {
    console.error('[AutoDispatch] Atomic dispatch expiration failed:', error);
    return { success: false, reason: 'command_error' };
  }

  const result = (data ?? { success: false, reason: 'empty_response' }) as AtomicDispatchResult;
  if (result.success) {
    console.log(`[AutoDispatch] Ride expired: ${reason}`);
  }
  return result;
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

