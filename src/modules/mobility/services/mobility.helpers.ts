/**
 * 🛠️ MOBILITY HELPERS — Utilitários de mobilidade puros
 * 
 * Responsabilidade única: helpers e verificações puras
 * - Sem acesso a banco de dados
 * - Sem side effects
 * - Transformações e verificações puras
 */

import { RIDE_STATUS } from "../constants";

/**
 * Verificar se corrida está em status ativo
 */
export function isRideActive(status: string): boolean {
  const activeStatuses = [
    RIDE_STATUS.PENDING,
    RIDE_STATUS.REQUESTED,
    RIDE_STATUS.SEARCHING_DRIVER,
    RIDE_STATUS.DRIVER_ASSIGNED,
    RIDE_STATUS.DRIVER_ACCEPTED,
    RIDE_STATUS.IN_PROGRESS,
    RIDE_STATUS.DRIVER_ARRIVING,
    RIDE_STATUS.PASSENGER_BOARDED,
  ];
  return activeStatuses.includes(status);
}

/**
 * Verificar se corrida pode ser aceita por motorista
 */
export function canAcceptRide(status: string): boolean {
  return status === RIDE_STATUS.PENDING || status === RIDE_STATUS.REQUESTED || status === RIDE_STATUS.SEARCHING_DRIVER;
}

/**
 * Verificar se corrida pode ser iniciada
 */
export function canStartRide(status: string): boolean {
  return status === RIDE_STATUS.DRIVER_ACCEPTED || status === RIDE_STATUS.DRIVER_ARRIVING;
}

/**
 * Verificar se corrida pode ser completada
 */
export function canCompleteRide(status: string): boolean {
  return status === RIDE_STATUS.IN_PROGRESS || status === RIDE_STATUS.PASSENGER_BOARDED;
}

/**
 * Verificar se corrida pode ser cancelada
 */
export function canCancelRide(status: string): boolean {
  return ![
    RIDE_STATUS.COMPLETED,
    RIDE_STATUS.CANCELLED,
    RIDE_STATUS.REJECTED,
  ].includes(status);
}

/**
 * Calcular preço estimado da corrida
 */
export function calculateEstimatedFare(
  distanceKm: number,
  baseFare = 5.0,
  perKmRate = 2.5,
): number {
  return baseFare + distanceKm * perKmRate;
}

/**
 * Calcular distância entre dois pontos (Haversine)
 */
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formatar duração da corrida
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
}

/**
 * Formatar preço para moeda brasileira
 */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Gerar token de compartilhamento
 */
export function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Validar coordenadas
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Extrair iniciais do nome
 */
export function getInitials(name: string): string {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Truncar texto
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Mapear status da corrida para label legível
 */
export function getRideStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    [RIDE_STATUS.PENDING]: "Pendente",
    [RIDE_STATUS.REQUESTED]: "Solicitada",
    [RIDE_STATUS.SEARCHING_DRIVER]: "Procurando motorista",
    [RIDE_STATUS.DRIVER_ASSIGNED]: "Motorista designado",
    [RIDE_STATUS.DRIVER_ACCEPTED]: "Aceita",
    [RIDE_STATUS.IN_PROGRESS]: "Em andamento",
    [RIDE_STATUS.DRIVER_ARRIVING]: "Motorista chegando",
    [RIDE_STATUS.PASSENGER_BOARDED]: "Passageiro a bordo",
    [RIDE_STATUS.COMPLETED]: "Concluída",
    [RIDE_STATUS.CANCELLED]: "Cancelada",
    [RIDE_STATUS.REJECTED]: "Rejeitada",
  };
  return labels[status] || status;
}

/**
 * Mapear status da corrida para cor
 */
export function getRideStatusColor(status: string): string {
  const colors: Record<string, string> = {
    [RIDE_STATUS.PENDING]: "yellow",
    [RIDE_STATUS.REQUESTED]: "yellow",
    [RIDE_STATUS.SEARCHING_DRIVER]: "blue",
    [RIDE_STATUS.DRIVER_ASSIGNED]: "blue",
    [RIDE_STATUS.DRIVER_ACCEPTED]: "green",
    [RIDE_STATUS.IN_PROGRESS]: "green",
    [RIDE_STATUS.DRIVER_ARRIVING]: "green",
    [RIDE_STATUS.PASSENGER_BOARDED]: "green",
    [RIDE_STATUS.COMPLETED]: "gray",
    [RIDE_STATUS.CANCELLED]: "red",
    [RIDE_STATUS.REJECTED]: "red",
  };
  return colors[status] || "gray";
}
