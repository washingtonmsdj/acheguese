/**
 * RideCanonicalAdapter
 * 
 * Adapter canonico para leitura de localizacao em ride_requests
 * Combina FKs canonicas (address_id/location_id) com snapshots JSONB da propria corrida
 * 
 * Mantem a formatacao de rota centralizada fora de pages/hooks
 */

import type { Address } from '@/core/address/types';
import type { Location } from '@/core/location/types';
import type { RideRequest } from "../types/types";
import type { Tables } from "@/integrations/supabase";

type RideRequestRecord = Tables<"ride_requests">;
type RideRequestWithRelations = RideRequestRecord & {
  pickup_address?: Address | null;
  dropoff_address?: Address | null;
  pickup_location?: Location | Record<string, unknown> | null;
  dropoff_location?: Location | Record<string, unknown> | null;
};

type SerializedRideLocation = {
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  lon?: number;
};

type RideRequestSerializedRoute = {
  origin?: SerializedRideLocation;
  destination?: SerializedRideLocation;
};

const RIDE_REQUEST_STATUSES: readonly RideRequest["status"][] = [
  "pending",
  "requested",
  "searching_driver",
  "driver_assigned",
  "driver_accepted",
  "driver_arriving",
  "driver_on_the_way",
  "driver_arrived",
  "passenger_boarded",
  "passenger_on_board",
  "pickup_confirmed",
  "in_progress",
  "in_delivery",
  "delivered",
  "completed",
  "cancelled",
  "failed",
  "expired",
  "cancelled_by_passenger",
  "cancelled_by_driver",
];

function normalizeRideStatus(status: string | null | undefined): RideRequest["status"] {
  if (status && RIDE_REQUEST_STATUSES.includes(status as RideRequest["status"])) {
    return status as RideRequest["status"];
  }

  return "pending";
}

function normalizeRideMode(rideMode: string | null | undefined): RideRequest["ride_mode"] {
  if (rideMode === "ride" || rideMode === "motoboy") return rideMode;
  return null;
}

export function toRideRequestContract(ride: RideRequestRecord): RideRequest {
  const rideMode = normalizeRideMode(ride.ride_mode);
  const originAddress = ride.origin ?? "";
  const destinationAddress = ride.destination ?? "";

  return {
    id: ride.id,
    passenger_profile_id: ride.passenger_profile_id,
    driver_profile_id: ride.driver_profile_id ?? undefined,
    source_id: ride.source_id ?? null,
    ride_mode: rideMode,
    type: rideMode === "motoboy" ? "delivery" : rideMode === "ride" ? "ride" : null,
    origin: ride.origin ?? null,
    destination: ride.destination ?? null,
    pickup_address: originAddress || null,
    dropoff_address: destinationAddress || null,
    origin_address: originAddress,
    destination_address: destinationAddress,
    origin_lat: ride.origin_lat ?? 0,
    origin_lng: ride.origin_lng ?? 0,
    destination_lat: ride.destination_lat ?? 0,
    destination_lng: ride.destination_lng ?? 0,
    status: normalizeRideStatus(ride.status),
    estimated_price: ride.suggested_price ?? undefined,
    suggested_price: ride.suggested_price ?? undefined,
    final_price: ride.final_price ?? undefined,
    share_token: ride.share_token ?? null,
    share_expires_at: null,
    share_is_active: ride.share_token ? true : null,
    driver_assigned_at: ride.driver_assigned_at ?? null,
    driver_on_the_way_at: null,
    driver_arrived_at: null,
    passenger_on_board_at: ride.passenger_boarded_at ?? null,
    payment_method: ride.payment_method ?? "",
    departure_time: ride.departure_time ?? null,
    observation: ride.observation ?? null,
    payment_status: "pending",
    accepted_at: ride.driver_accepted_at ?? null,
    started_at: ride.started_at ?? null,
    completed_at: ride.completed_at ?? null,
    cancelled_at: ride.cancelled_at ?? null,
    created_at: ride.created_at,
    updated_at: ride.updated_at,
  };
}

/**
 * Verificar se corrida está migrada para modelo canônico
 */
export function isRideMigrated(ride: RideRequestRecord): boolean {
  return (
    ride.pickup_location_id !== null &&
    ride.pickup_location_id !== undefined &&
    ride.dropoff_location_id !== null &&
    ride.dropoff_location_id !== undefined
  );
}

/**
 * Verificar se origem tem endereço físico
 */
export function hasPickupAddress(ride: RideRequestRecord): boolean {
  return ride.pickup_address_id !== null && ride.pickup_address_id !== undefined;
}

/**
 * Verificar se destino tem endereço físico
 */
export function hasDropoffAddress(ride: RideRequestRecord): boolean {
  return ride.dropoff_address_id !== null && ride.dropoff_address_id !== undefined;
}

/**
 * Obter endereço formatado de origem (snapshot de rota)
 */
export function getFormattedPickupAddress(ride: RideRequestRecord): string {
  const serializedRide = ride as unknown as RideRequestSerializedRoute & Record<string, unknown>;
  const parts: string[] = [];
  
  // Tentar pickup_location primeiro
  const pickup = serializedRide.pickup_location as SerializedRideLocation | null | undefined;
  if (pickup && typeof pickup === 'object') {
    if (pickup.address) parts.push(pickup.address);
    if (pickup.neighborhood) parts.push(pickup.neighborhood);
    if (pickup.city) parts.push(pickup.city);
    if (pickup.state) parts.push(pickup.state);
    if (pickup.cep) parts.push(`CEP ${pickup.cep}`);
  }
  
  // Fallback para origin serializado
  const origin = serializedRide.origin;
  if (parts.length === 0 && origin && typeof origin === 'object') {
    if (origin.address) parts.push(origin.address);
    if (origin.neighborhood) parts.push(origin.neighborhood);
    if (origin.city) parts.push(origin.city);
    if (origin.state) parts.push(origin.state);
  }

  return parts.join(', ');
}

/**
 * Obter endereço formatado de destino (snapshot de rota)
 */
export function getFormattedDropoffAddress(ride: RideRequestRecord): string {
  const serializedRide = ride as unknown as RideRequestSerializedRoute & Record<string, unknown>;
  const parts: string[] = [];
  
  // Tentar dropoff_location primeiro
  const dropoff = serializedRide.dropoff_location as SerializedRideLocation | null | undefined;
  if (dropoff && typeof dropoff === 'object') {
    if (dropoff.address) parts.push(dropoff.address);
    if (dropoff.neighborhood) parts.push(dropoff.neighborhood);
    if (dropoff.city) parts.push(dropoff.city);
    if (dropoff.state) parts.push(dropoff.state);
    if (dropoff.cep) parts.push(`CEP ${dropoff.cep}`);
  }
  
  // Fallback para destination serializado
  const destination = serializedRide.destination;
  if (parts.length === 0 && destination && typeof destination === 'object') {
    if (destination.address) parts.push(destination.address);
    if (destination.neighborhood) parts.push(destination.neighborhood);
    if (destination.city) parts.push(destination.city);
    if (destination.state) parts.push(destination.state);
  }

  return parts.join(', ');
}

/**
 * Obter coordenadas de origem (preferindo address canônico, fallback para snapshot)
 */
export function getPickupCoordinates(
  ride: RideRequestWithRelations
): { latitude: number; longitude: number } | null {
  // Preferir coordenadas do address canônico
  if (ride.pickup_address?.latitude && ride.pickup_address?.longitude) {
    return {
      latitude: ride.pickup_address.latitude,
      longitude: ride.pickup_address.longitude,
    };
  }

  // Fallback para pickup_location serializado
  const pickup = ride.pickup_location as SerializedRideLocation | null;
  if (pickup && typeof pickup === 'object') {
    const lat = pickup.latitude || pickup.lat;
    const lng = pickup.longitude || pickup.lng || pickup.lon;
    if (lat && lng) {
      return { latitude: lat, longitude: lng };
    }
  }

  // Fallback para origin serializado serializado
  const origin = (ride as RideRequestSerializedRoute).origin;
  if (origin && typeof origin === 'object') {
    const lat = origin.latitude || origin.lat;
    const lng = origin.longitude || origin.lng || origin.lon;
    if (lat && lng) {
      return { latitude: lat, longitude: lng };
    }
  }

  return null;
}

/**
 * Obter coordenadas de destino (preferindo address canônico, fallback para snapshot)
 */
export function getDropoffCoordinates(
  ride: RideRequestWithRelations
): { latitude: number; longitude: number } | null {
  // Preferir coordenadas do address canônico
  if (ride.dropoff_address?.latitude && ride.dropoff_address?.longitude) {
    return {
      latitude: ride.dropoff_address.latitude,
      longitude: ride.dropoff_address.longitude,
    };
  }

  // Fallback para dropoff_location serializado
  const dropoff = ride.dropoff_location as SerializedRideLocation | null;
  if (dropoff && typeof dropoff === 'object') {
    const lat = dropoff.latitude || dropoff.lat;
    const lng = dropoff.longitude || dropoff.lng || dropoff.lon;
    if (lat && lng) {
      return { latitude: lat, longitude: lng };
    }
  }

  // Fallback para destination serializado serializado
  const destination = (ride as RideRequestSerializedRoute).destination;
  if (destination && typeof destination === 'object') {
    const lat = destination.latitude || destination.lat;
    const lng = destination.longitude || destination.lng || destination.lon;
    if (lat && lng) {
      return { latitude: lat, longitude: lng };
    }
  }

  return null;
}

/**
 * Obter território de origem
 */
export function getPickupTerritory(ride: RideRequestRecord): string | null {
  return ride.pickup_location_id || null;
}

/**
 * Obter território de destino
 */
export function getDropoffTerritory(ride: RideRequestRecord): string | null {
  return ride.dropoff_location_id || null;
}

/**
 * Obter nome do território de origem (preferindo location canônico, fallback para snapshot)
 */
export function getPickupTerritoryName(
  ride: RideRequestWithRelations
): string | null {
  // Preferir location canônico
  if (ride.pickup_location && typeof ride.pickup_location === 'object' && 'name' in ride.pickup_location) {
    return (ride.pickup_location as Location).name;
  }

  // Fallback para pickup_location serializado
  const pickup = ride.pickup_location as SerializedRideLocation | null;
  if (pickup && typeof pickup === 'object') {
    if (pickup.city) return pickup.city;
    if (pickup.neighborhood) return pickup.neighborhood;
  }

  // Fallback para origin serializado serializado
  const origin = (ride as RideRequestSerializedRoute).origin;
  if (origin && typeof origin === 'object') {
    if (origin.city) return origin.city;
    if (origin.neighborhood) return origin.neighborhood;
  }

  return null;
}

/**
 * Obter nome do território de destino (preferindo location canônico, fallback para snapshot)
 */
export function getDropoffTerritoryName(
  ride: RideRequestWithRelations
): string | null {
  // Preferir location canônico
  if (ride.dropoff_location && typeof ride.dropoff_location === 'object' && 'name' in ride.dropoff_location) {
    return (ride.dropoff_location as Location).name;
  }

  // Fallback para dropoff_location serializado
  const dropoff = ride.dropoff_location as SerializedRideLocation | null;
  if (dropoff && typeof dropoff === 'object') {
    if (dropoff.city) return dropoff.city;
    if (dropoff.neighborhood) return dropoff.neighborhood;
  }

  // Fallback para destination serializado serializado
  const destination = (ride as RideRequestSerializedRoute).destination;
  if (destination && typeof destination === 'object') {
    if (destination.city) return destination.city;
    if (destination.neighborhood) return destination.neighborhood;
  }

  return null;
}
