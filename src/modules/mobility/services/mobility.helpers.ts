import { RIDE_STATUS } from "../constants";

export function isRideActive(status: string): boolean {
  const activeStatuses: string[] = [
    RIDE_STATUS.PENDING,
    RIDE_STATUS.REQUESTED,
    RIDE_STATUS.SEARCHING_DRIVER,
    RIDE_STATUS.DRIVER_ASSIGNED,
    RIDE_STATUS.DRIVER_ACCEPTED,
    RIDE_STATUS.DRIVER_ARRIVING,
    RIDE_STATUS.DRIVER_ON_THE_WAY,
    RIDE_STATUS.DRIVER_ARRIVED,
    RIDE_STATUS.PASSENGER_BOARDED,
    RIDE_STATUS.PASSENGER_ON_BOARD,
    RIDE_STATUS.IN_PROGRESS,
    RIDE_STATUS.PICKUP_CONFIRMED,
    RIDE_STATUS.IN_DELIVERY,
  ];
  return activeStatuses.includes(status);
}

export function canAcceptRide(status: string): boolean {
  return status === RIDE_STATUS.PENDING || status === RIDE_STATUS.REQUESTED || status === RIDE_STATUS.SEARCHING_DRIVER;
}

export function canStartRide(status: string): boolean {
  const startable: string[] = [
    RIDE_STATUS.DRIVER_ASSIGNED,
    RIDE_STATUS.DRIVER_ACCEPTED,
    RIDE_STATUS.DRIVER_ARRIVING,
    RIDE_STATUS.DRIVER_ON_THE_WAY,
    RIDE_STATUS.DRIVER_ARRIVED,
    RIDE_STATUS.PASSENGER_BOARDED,
    RIDE_STATUS.PASSENGER_ON_BOARD,
  ];
  return startable.includes(status);
}

export function canCompleteRide(status: string): boolean {
  return status === RIDE_STATUS.IN_PROGRESS;
}

export function canCancelRide(status: string): boolean {
  const cancellable: string[] = [
    RIDE_STATUS.PENDING,
    RIDE_STATUS.REQUESTED,
    RIDE_STATUS.SEARCHING_DRIVER,
    RIDE_STATUS.DRIVER_ASSIGNED,
    RIDE_STATUS.DRIVER_ACCEPTED,
    RIDE_STATUS.DRIVER_ARRIVING,
    RIDE_STATUS.DRIVER_ON_THE_WAY,
    RIDE_STATUS.DRIVER_ARRIVED,
    RIDE_STATUS.PASSENGER_BOARDED,
    RIDE_STATUS.PASSENGER_ON_BOARD,
    RIDE_STATUS.PICKUP_CONFIRMED,
  ];
  return cancellable.includes(status);
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
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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
