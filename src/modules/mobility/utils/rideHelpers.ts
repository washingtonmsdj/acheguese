/**
 * 🚗 RIDE HELPERS - Funções auxiliares para corridas
 * 
 * ✅ Helpers reutilizáveis para lógica de corridas
 * ✅ Verificações de status e modo
 * ✅ Cálculos de preço, distância e duração
 * 
 * @module mobility/utils/rideHelpers
 */

import type { RideStatus, RideMode } from '@/core/mobility/services/validators';

/**
 * Interface mínima de RideRequest para helpers
 */
export interface RideRequest {
  id: string;
  status: string;
  ride_mode?: string;
  driver_profile_id?: string | null;
  final_price?: number | null;
  suggested_price?: number | null;
  distance_meters?: number | null;
  duration_minutes?: number | null;
  created_at?: string;
  completed_at?: string | null;
  pickup_location?: unknown;
  dropoff_location?: unknown;
}

// ==================== STATUS ====================

/**
 * Verifica se corrida está pendente (aguardando motorista)
 */
export function isRidePending(ride: RideRequest): boolean {
  return ['pending', 'requested', 'searching', 'searching_driver'].includes(ride.status);
}

/**
 * Verifica se corrida está ativa (em andamento)
 */
export function isRideActive(ride: RideRequest): boolean {
  return [
    'driver_assigned',
    'driver_accepted',
    'driver_arriving',
    'driver_on_the_way',
    'driver_arrived',
    'passenger_boarded',
    'passenger_on_board',
    'in_progress',
    'pickup_confirmed',
    'in_delivery',
  ].includes(ride.status);
}

/**
 * Verifica se corrida foi completada
 */
export function isRideCompleted(ride: RideRequest): boolean {
  return ride.status === 'completed' || ride.status === 'delivered';
}

/**
 * Verifica se corrida foi cancelada
 */
export function isRideCancelled(ride: RideRequest): boolean {
  return ['cancelled', 'cancelled_by_driver', 'cancelled_by_passenger'].includes(ride.status);
}

/**
 * Verifica se corrida está finalizada (completa ou cancelada)
 */
export function isRideFinished(ride: RideRequest): boolean {
  return isRideCompleted(ride) || isRideCancelled(ride) || ride.status === 'failed_delivery' || ride.status === 'failed' || ride.status === 'expired';
}

/**
 * Verifica se corrida pode ser cancelada
 */
export function canCancelRide(ride: RideRequest): boolean {
  return !isRideFinished(ride);
}

// ==================== MODO ====================

/**
 * Verifica se é entrega motoboy
 */
export function isMotoboyDelivery(ride: RideRequest): boolean {
  return ride.ride_mode === 'motoboy';
}

/**
 * Verifica se é corrida de passageiro
 */
export function isPassengerRide(ride: RideRequest): boolean {
  return ride.ride_mode === 'ride' || !ride.ride_mode;
}

/**
 * Verifica se é corrida compartilhada
 */
export function isSharedRide(ride: RideRequest): boolean {
  return ride.ride_mode === 'shared';
}

// ==================== VERIFICAÇÕES ====================

/**
 * Verifica se corrida tem motorista atribuído
 */
export function hasDriver(ride: RideRequest): boolean {
  return !!ride.driver_profile_id;
}

/**
 * Verifica se corrida tem preço definido
 */
export function hasPrice(ride: RideRequest): boolean {
  return (ride.final_price !== null && ride.final_price !== undefined) ||
         (ride.suggested_price !== null && ride.suggested_price !== undefined);
}

/**
 * Verifica se corrida tem rota definida
 */
export function hasRoute(ride: RideRequest): boolean {
  return !!ride.pickup_location && !!ride.dropoff_location;
}

/**
 * Verifica se corrida tem distância calculada
 */
export function hasDistance(ride: RideRequest): boolean {
  return ride.distance_meters !== null && ride.distance_meters !== undefined && ride.distance_meters > 0;
}

/**
 * Verifica se corrida tem duração estimada
 */
export function hasDuration(ride: RideRequest): boolean {
  return ride.duration_minutes !== null && ride.duration_minutes !== undefined && ride.duration_minutes > 0;
}

// ==================== CÁLCULOS ====================

/**
 * Obtém duração da corrida em minutos
 */
export function getRideDuration(ride: RideRequest): number {
  if (ride.duration_minutes && ride.duration_minutes > 0) {
    return ride.duration_minutes;
  }
  
  // Calcular baseado em timestamps se disponível
  if (ride.created_at && ride.completed_at) {
    const start = new Date(ride.created_at).getTime();
    const end = new Date(ride.completed_at).getTime();
    return Math.round((end - start) / 60000); // ms para minutos
  }
  
  return 0;
}

/**
 * Obtém distância da corrida em metros
 */
export function getRideDistance(ride: RideRequest): number {
  return ride.distance_meters || 0;
}

/**
 * Obtém distância da corrida em km
 */
export function getRideDistanceKm(ride: RideRequest): number {
  return getRideDistance(ride) / 1000;
}

/**
 * Obtém preço da corrida
 */
export function getRidePrice(ride: RideRequest): number {
  return ride.final_price || ride.suggested_price || 0;
}

/**
 * Obtém preço sugerido da corrida
 */
export function getSuggestedPrice(ride: RideRequest): number {
  return ride.suggested_price || 0;
}

/**
 * Obtém preço final da corrida
 */
export function getFinalPrice(ride: RideRequest): number {
  return ride.final_price || 0;
}

/**
 * Verifica se preço foi negociado (diferente do sugerido)
 */
export function isPriceNegotiated(ride: RideRequest): boolean {
  if (!ride.final_price || !ride.suggested_price) return false;
  return ride.final_price !== ride.suggested_price;
}

// ==================== FORMATAÇÃO ====================

/**
 * Obtém label amigável do status
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'Aguardando';
    case 'searching': return 'Buscando motorista';
    case 'driver_assigned': return 'Motorista atribu?do';
    case 'driver_arriving': return 'Motorista a caminho';
    case 'in_progress': return 'Em andamento';
    case 'completed': return 'Conclu?da';
    case 'cancelled': return 'Cancelada';
    case 'delivered': return 'Entregue';
    default: return status;
  }
}

/**
 * Obtém cor do status para UI
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending': return 'yellow';
    case 'searching': return 'blue';
    case 'driver_assigned': return 'cyan';
    case 'driver_arriving': return 'purple';
    case 'in_progress': return 'green';
    case 'completed':
    case 'delivered':
      return 'emerald';
    case 'cancelled': return 'red';
    default: return 'gray';
  }
}

/**
 * Obtém ícone do status
 */
export function getStatusIcon(status: string): string {
  switch (status) {
    case 'pending': return 'clock';
    case 'searching': return 'search';
    case 'driver_assigned': return 'user-check';
    case 'driver_arriving': return 'navigation';
    case 'in_progress': return 'car';
    case 'completed': return 'check-circle';
    case 'cancelled': return 'x-circle';
    case 'delivered': return 'package-check';
    default: return 'circle';
  }
}

// ==================== TRANSIÇÕES DE STATUS ====================

/**
 * Verifica se pode transicionar de um status para outro
 */
function getValidTransitions(status: string): string[] {
  switch (status) {
    case 'pending':
      return ['searching', 'cancelled'];
    case 'searching':
      return ['driver_assigned', 'cancelled'];
    case 'driver_assigned':
      return ['driver_arriving', 'cancelled'];
    case 'driver_arriving':
      return ['in_progress', 'cancelled'];
    case 'in_progress':
      return ['completed', 'delivered', 'cancelled'];
    case 'completed':
    case 'delivered':
    case 'cancelled':
      return [];
    default:
      return [];
  }
}

export function canTransitionTo(currentStatus: string, newStatus: string): boolean {
  const allowed = getValidTransitions(currentStatus);
  return allowed.includes(newStatus);
}

/**
 * Obtém próximos status possíveis
 */
export function getNextPossibleStatuses(currentStatus: string): string[] {
  return getValidTransitions(currentStatus);
}

// ==================== FILTROS ====================

/**
 * Filtra corridas por status
 */
export function filterByStatus(rides: RideRequest[], status: string): RideRequest[] {
  return rides.filter(ride => ride.status === status);
}

/**
 * Filtra corridas ativas
 */
export function filterActiveRides(rides: RideRequest[]): RideRequest[] {
  return rides.filter(isRideActive);
}

/**
 * Filtra corridas completadas
 */
export function filterCompletedRides(rides: RideRequest[]): RideRequest[] {
  return rides.filter(isRideCompleted);
}

/**
 * Filtra entregas motoboy
 */
export function filterMotoboyDeliveries(rides: RideRequest[]): RideRequest[] {
  return rides.filter(isMotoboyDelivery);
}

/**
 * Filtra corridas de passageiro
 */
export function filterPassengerRides(rides: RideRequest[]): RideRequest[] {
  return rides.filter(isPassengerRide);
}

// ==================== ESTATÍSTICAS ====================

/**
 * Calcula total de ganhos de uma lista de corridas
 */
export function calculateTotalEarnings(rides: RideRequest[]): number {
  return rides.reduce((total, ride) => total + getRidePrice(ride), 0);
}

/**
 * Calcula distância total de uma lista de corridas
 */
export function calculateTotalDistance(rides: RideRequest[]): number {
  return rides.reduce((total, ride) => total + getRideDistance(ride), 0);
}

/**
 * Calcula duração total de uma lista de corridas
 */
export function calculateTotalDuration(rides: RideRequest[]): number {
  return rides.reduce((total, ride) => total + getRideDuration(ride), 0);
}

/**
 * Calcula média de avaliação (se disponível)
 */
export function calculateAverageRating(rides: Array<RideRequest & { rating?: number }>): number {
  const ridesWithRating = rides.filter(ride => ride.rating !== undefined && ride.rating > 0);
  
  if (ridesWithRating.length === 0) return 0;
  
  const total = ridesWithRating.reduce((sum, ride) => sum + (ride.rating || 0), 0);
  return Number((total / ridesWithRating.length).toFixed(1));
}
