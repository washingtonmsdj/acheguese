/**
 * HELPERS DE DISPATCH PARA TESTES
 * 
 * Wrappers que usam service_role para operações de dispatch/sistema.
 */

import { getAdminClient } from './supabase-test-client';

/**
 * Busca motoristas disponíveis usando service_role (bypass RLS)
 */
export async function findAvailableDriversAdmin(
  lat: number,
  lng: number,
  radiusKm: number,
  rideMode?: 'ride' | 'motoboy'
) {
  const supabase = getAdminClient();
  
  try {
    // Buscar driver_availability
    const { data: drivers, error } = await supabase
      .from('driver_availability')
      .select('profile_id, current_lat, current_lng, last_seen_at')
      .eq('is_online', true)
      .eq('is_available', true)
      .is('active_ride_id', null)
      .not('current_lat', 'is', null)
      .not('current_lng', 'is', null);

    if (error) throw error;
    if (!drivers || drivers.length === 0) return [];

    // Buscar driver_data
    const profileIds = drivers.map(d => d.profile_id);
    const { data: driverData, error: dataError } = await supabase
      .from('driver_data')
      .select('profile_id, rating, can_do_delivery')
      .in('profile_id', profileIds);

    if (dataError) throw dataError;

    const dataMap = new Map(driverData?.map(d => [d.profile_id, d]) || []);

    // Calcular distância e filtrar
    const available = [];

    for (const d of drivers) {
      const data = dataMap.get(d.profile_id);
      if (!data) continue;

      if (rideMode === 'motoboy' && !data.can_do_delivery) continue;

      const distance = calculateDistance(lat, lng, d.current_lat, d.current_lng);

      if (distance <= radiusKm) {
        available.push({
          profileId: d.profile_id,
          distance,
          rating: data.rating || 0,
          isAvailable: true,
          hasActiveRide: false,
        });
      }
    }

    // Ordenar por distância
    available.sort((a, b) => a.distance - b.distance);

    return available;
  } catch (error) {
    console.error('❌ findAvailableDriversAdmin error:', error);
    return [];
  }
}

/**
 * Atribui motorista a uma corrida usando service_role
 */
export async function assignDriverAdmin(
  rideId: string,
  driverProfileId: string,
  currentState: string
) {
  const supabase = getAdminClient();
  
  try {
    // Atualizar corrida
    const { data: ride, error } = await supabase
      .from('ride_requests')
      .update({
        driver_profile_id: driverProfileId,
        status: 'driver_assigned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', rideId)
      .eq('status', currentState)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      rideId: ride.id,
      driverProfileId: ride.driver_profile_id,
    };
  } catch (error) {
    console.error('❌ assignDriverAdmin error:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Calcula distância entre dois pontos (Haversine)
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
