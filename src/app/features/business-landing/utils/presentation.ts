import { getOpeningStatus } from "@/core/business/utils/openingHoursHelpers";
import type { Business as CoreBusiness } from "@/core/business/types/Business";
import type {
  Business,
  BusinessHighlight,
  BusinessSortOption,
} from "../sections/types";

type NearbyBusinessResult = {
  id?: string;
  entity_id?: string;
  slug?: string;
  latitude?: number;
  longitude?: number;
  distance_meters?: number;
  entity_data?: {
    name?: string;
    category?: string;
    rating?: number;
    total_reviews?: number;
    description?: string;
    is_premium?: boolean;
    phone?: string;
    whatsapp?: string;
    slug?: string;
    geographic_path?: string;
    logo_url?: string;
    address?: {
      latitude?: number;
      longitude?: number;
    };
  };
};

type BusinessAddressLike = {
  latitude?: number;
  longitude?: number;
};

type BusinessLocationLike = {
  canonical_lat?: number;
  canonical_lng?: number;
};

function normalizeCoordinate(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function buildBusinessTags(params: {
  whatsapp?: string | null;
  serviceModes?: readonly string[] | null;
  paymentMethods?: readonly string[] | null;
  facilities?: readonly string[] | null;
}): string[] {
  const tags: string[] = [];
  const serviceModes = (params.serviceModes ?? []).map((value) => value.toLowerCase());
  const paymentMethods = (params.paymentMethods ?? []).map((value) => value.toLowerCase());
  const facilities = (params.facilities ?? []).map((value) => value.toLowerCase());

  if (params.whatsapp) {
    tags.push("WhatsApp");
  }
  if (serviceModes.some((value) => value.includes("delivery") || value.includes("domic"))) {
    tags.push("Entrega");
  }
  if (serviceModes.some((value) => value.includes("agendamento"))) {
    tags.push("Agendamento");
  }
  if (paymentMethods.some((value) => value.includes("pix"))) {
    tags.push("Pix");
  }
  if (facilities.some((value) => value.includes("estacion"))) {
    tags.push("Estacionamento");
  }

  return unique(tags).slice(0, 3);
}

export function formatDistanceLabel(business: Business): string | null {
  if (typeof business.distanceMeters === "number" && Number.isFinite(business.distanceMeters)) {
    return `${(business.distanceMeters / 1000).toFixed(1).replace(".", ",")} km`;
  }

  if (business.distance && business.distance !== "N/A") {
    return business.distance;
  }

  return null;
}

export function getBusinessTerritoryLabel(geographicPath?: string | null): string | null {
  if (!geographicPath) return null;

  const parts = geographicPath.split("/").filter(Boolean);
  const label = parts.at(-1);
  if (!label) return null;

  return label
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeNearbyBusiness(result: NearbyBusinessResult): Business {
  const distanceLabel =
    typeof result.distance_meters === "number"
      ? `${(result.distance_meters / 1000).toFixed(1).replace(".", ",")} km`
      : "N/A";

  return {
    id: result.entity_id || result.id || "",
    business_data_id: result.entity_id || result.id,
    name: result.entity_data?.name || "Empresa",
    slug: result.entity_data?.slug || result.slug,
    category: result.entity_data?.category || "Outros",
    rating: result.entity_data?.rating || 0,
    reviews: result.entity_data?.total_reviews || 0,
    distance: distanceLabel,
    walkTime: "N/A",
    description: result.entity_data?.description || "",
    tags: buildBusinessTags({
      whatsapp: result.entity_data?.whatsapp,
    }),
    premium: result.entity_data?.is_premium || false,
    isOpen: false,
    statusText: "Horario nao informado",
    neighborRecs: 0,
    favoritesCount: 0,
    lastVisit: "",
    coords: {
      lat: result.entity_data?.address?.latitude || result.latitude || 0,
      lng: result.entity_data?.address?.longitude || result.longitude || 0,
    },
    phone: result.entity_data?.phone || "",
    whatsapp: result.entity_data?.whatsapp || "",
    logoUrl: result.entity_data?.logo_url || null,
    is_premium: result.entity_data?.is_premium,
    geographic_path: result.entity_data?.geographic_path,
    distanceMeters: result.distance_meters,
    is_verified: false,
  };
}

export function normalizeRealBusinessEntry(business: CoreBusiness): Business {
  const address = business.address as BusinessAddressLike | undefined;
  const location = business.location as BusinessLocationLike | undefined;
  const lat =
    normalizeCoordinate(address?.latitude) ??
    normalizeCoordinate(location?.canonical_lat) ??
    0;
  const lng =
    normalizeCoordinate(address?.longitude) ??
    normalizeCoordinate(location?.canonical_lng) ??
    0;
  const openingStatus = getOpeningStatus(business.horario_funcionamento);

  return {
    id: business.id,
    business_data_id: business.business_data_id,
    name: business.name,
    slug: business.slug,
    category: business.category || "Outros",
    subcategoria: business.subcategoria,
    rating: business.rating || 0,
    reviews: business.total_reviews || 0,
    distance: "N/A",
    walkTime: "N/A",
    description: business.description || "",
    tags: buildBusinessTags({
      whatsapp: business.whatsapp,
      serviceModes: business.modos_atendimento,
      paymentMethods: business.formas_pagamento,
      facilities: business.facilidades,
    }),
    premium: business.is_premium || false,
    isOpen: openingStatus.isOpen,
    statusText: openingStatus.nextChange ?? openingStatus.message,
    neighborRecs: business.recommendations_count ?? 0,
    favoritesCount: business.favorites_count ?? 0,
    lastVisit: "",
    coords: { lat, lng },
    phone: business.phone || "",
    whatsapp: business.whatsapp || "",
    email: business.email || "",
    website: business.website || "",
    logoUrl: business.logo_url || null,
    is_premium: business.is_premium,
    is_verified: business.is_verified,
    geographic_path: business.geographic_path ?? business.location?.geographic_path,
    horario_funcionamento: business.horario_funcionamento,
    formas_pagamento: business.formas_pagamento,
    especialidades: business.especialidades,
    facilidades: business.facilidades,
    modos_atendimento: business.modos_atendimento,
    createdAt: business.created_at,
    isFeatured: business.is_featured,
  };
}

export function buildBusinessHighlights(
  businesses: readonly Business[],
): BusinessHighlight[] {
  const used = new Set<string>();
  const pushHighlight = (
    source: Business | undefined,
    label: string,
    description: string,
    tone: BusinessHighlight["tone"],
    target: BusinessHighlight[],
  ) => {
    if (!source || used.has(source.id)) return;
    used.add(source.id);
    target.push({ business: source, label, description, tone });
  };

  const highlights: BusinessHighlight[] = [];
  const sortedByRecommendations = [...businesses].sort(
    (left, right) =>
      right.neighborRecs - left.neighborRecs ||
      right.favoritesCount - left.favoritesCount ||
      right.rating - left.rating,
  );
  const sortedVerified = [...businesses].sort(
    (left, right) =>
      Number(right.is_verified) - Number(left.is_verified) ||
      right.rating - left.rating ||
      right.reviews - left.reviews,
  );
  const sortedRecent = [...businesses].sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });

  pushHighlight(
    sortedByRecommendations.find((business) => business.neighborRecs > 0) ?? sortedByRecommendations[0],
    "Mais recomendada",
    "Negocio com mais sinais de confianca da comunidade.",
    "emerald",
    highlights,
  );
  pushHighlight(
    sortedVerified.find((business) => business.is_verified) ?? sortedVerified[0],
    "Verificada",
    "Perfil com validacao publica e operacao mais confiavel.",
    "cyan",
    highlights,
  );
  pushHighlight(
    sortedRecent.find((business) => business.createdAt) ?? sortedRecent[0],
    "Nova no bairro",
    "Novo perfil em ascensao na vitrine local.",
    "teal",
    highlights,
  );

  return highlights;
}

export function sortBusinesses(
  businesses: readonly Business[],
  sortBy: BusinessSortOption,
): Business[] {
  const items = [...businesses];

  switch (sortBy) {
    case "rating":
      return items.sort(
        (left, right) =>
          right.rating - left.rating ||
          right.reviews - left.reviews ||
          right.neighborRecs - left.neighborRecs,
      );
    case "distance":
      return items.sort((left, right) => {
        const leftDistance = left.distanceMeters ?? Number.POSITIVE_INFINITY;
        const rightDistance = right.distanceMeters ?? Number.POSITIVE_INFINITY;
        return leftDistance - rightDistance;
      });
    case "recommendations":
      return items.sort(
        (left, right) =>
          right.neighborRecs - left.neighborRecs ||
          right.favoritesCount - left.favoritesCount ||
          right.rating - left.rating,
      );
    case "recent":
      return items.sort((left, right) => {
        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
        return rightTime - leftTime;
      });
    case "relevance":
    default:
      return items.sort(
        (left, right) =>
          Number(right.is_verified) - Number(left.is_verified) ||
          right.neighborRecs - left.neighborRecs ||
          right.rating - left.rating ||
          right.reviews - left.reviews,
      );
  }
}
