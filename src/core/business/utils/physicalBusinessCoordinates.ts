import type { Business } from "@/core/business/types";

export interface PhysicalBusinessCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Coordenadas físicas de uma empresa existem somente quando o Address
 * canônico possui latitude e longitude válidas.
 *
 * Nenhuma outra fonte substitui um endereço físico geocodificado.
 */
export function getPhysicalBusinessCoordinates(
  business: Pick<Business, "address">,
): PhysicalBusinessCoordinates | null {
  const latitude = business.address?.latitude;
  const longitude = business.address?.longitude;

  if (
    typeof latitude !== "number" ||
    !Number.isFinite(latitude) ||
    typeof longitude !== "number" ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return { latitude, longitude };
}
