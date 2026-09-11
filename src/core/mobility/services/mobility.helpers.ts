import { RIDE_STATUS } from "../constants";
import { isOpenRideStatus } from "@/core/mobility/core/RideLifecycleStatus";
import { secureRandomString } from "@/shared/utils/secureRandom";
import { getRecordValue } from "@/shared/utils/recordLookup";
import { formatBrl } from "@/shared/utils/currency";

/**
 * Read/classification helper only.
 *
 * Lifecycle action authority belongs to RideStateMachine and the server-owned
 * operational commands. Do not add canStart/canCancel/canComplete rules here.
 */
export function isRideActive(status: string): boolean {
  return isOpenRideStatus(status);
}

export function calculateEstimatedFare(distanceKm: number, baseFare = 5.0, perKmRate = 2.5): number {
  return baseFare + distanceKm * perKmRate;
}

export function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
}

export function formatPrice(value: number): string {
  return formatBrl(value);
}

export function generateShareToken(): string {
  return secureRandomString(32);
}

export function isValidCoordinate(lat: number, lng: number): boolean {
  return typeof lat === "number" && typeof lng === "number" && !Number.isNaN(lat) && !Number.isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function getInitials(name: string): string {
  if (!name) return "";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
}

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function getRideStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    [RIDE_STATUS.PENDING]: "Pendente",
    [RIDE_STATUS.REQUESTED]: "Solicitada",
    [RIDE_STATUS.SEARCHING_DRIVER]: "Buscando motorista",
    [RIDE_STATUS.DRIVER_ASSIGNED]: "Motorista atribuido",
    [RIDE_STATUS.DRIVER_ACCEPTED]: "Motorista aceitou",
    [RIDE_STATUS.DRIVER_ARRIVING]: "Motorista a caminho",
    [RIDE_STATUS.DRIVER_ON_THE_WAY]: "Motorista a caminho",
    [RIDE_STATUS.DRIVER_ARRIVED]: "Motorista chegou",
    [RIDE_STATUS.PASSENGER_BOARDED]: "Passageiro embarcado",
    [RIDE_STATUS.PASSENGER_ON_BOARD]: "Passageiro embarcado",
    [RIDE_STATUS.IN_PROGRESS]: "Em andamento",
    [RIDE_STATUS.PICKUP_CONFIRMED]: "Coleta confirmada",
    [RIDE_STATUS.IN_DELIVERY]: "Em entrega",
    [RIDE_STATUS.DELIVERED]: "Entregue",
    [RIDE_STATUS.COMPLETED]: "Concluida",
    [RIDE_STATUS.CANCELLED]: "Cancelada",
    [RIDE_STATUS.CANCELLED_BY_DRIVER]: "Cancelada pelo motorista",
    [RIDE_STATUS.CANCELLED_BY_PASSENGER]: "Cancelada pelo passageiro",
    [RIDE_STATUS.EXPIRED]: "Expirada",
    [RIDE_STATUS.FAILED]: "Falhou",
    [RIDE_STATUS.FAILED_DELIVERY]: "Falha na entrega",
  };

  return getRecordValue(labels, status) ?? "Status desconhecido";
}

export function getRideStatusColor(status: string): string {
  const colors: Record<string, string> = {
    [RIDE_STATUS.PENDING]: "text-warning",
    [RIDE_STATUS.REQUESTED]: "text-warning",
    [RIDE_STATUS.SEARCHING_DRIVER]: "text-primary",
    [RIDE_STATUS.DRIVER_ASSIGNED]: "text-primary",
    [RIDE_STATUS.DRIVER_ACCEPTED]: "text-primary",
    [RIDE_STATUS.DRIVER_ARRIVING]: "text-primary",
    [RIDE_STATUS.DRIVER_ON_THE_WAY]: "text-primary",
    [RIDE_STATUS.DRIVER_ARRIVED]: "text-success",
    [RIDE_STATUS.PASSENGER_BOARDED]: "text-primary",
    [RIDE_STATUS.PASSENGER_ON_BOARD]: "text-primary",
    [RIDE_STATUS.IN_PROGRESS]: "text-primary",
    [RIDE_STATUS.PICKUP_CONFIRMED]: "text-success",
    [RIDE_STATUS.IN_DELIVERY]: "text-primary",
    [RIDE_STATUS.DELIVERED]: "text-success",
    [RIDE_STATUS.COMPLETED]: "text-success",
    [RIDE_STATUS.CANCELLED]: "text-destructive",
    [RIDE_STATUS.CANCELLED_BY_DRIVER]: "text-destructive",
    [RIDE_STATUS.CANCELLED_BY_PASSENGER]: "text-destructive",
    [RIDE_STATUS.EXPIRED]: "text-muted-foreground",
    [RIDE_STATUS.FAILED]: "text-destructive",
    [RIDE_STATUS.FAILED_DELIVERY]: "text-destructive",
  };

  return getRecordValue(colors, status) ?? "text-muted-foreground";
}
