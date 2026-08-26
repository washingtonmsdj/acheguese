import { callRPC } from "@/integrations/supabase";
import { SERVICE_MODES } from "@/core/business/constants";
import { EntityContactService } from "@/core/contact";
import { logger } from "@/shared/utils/logger";
import type {
  PublicBusinessSnapshot,
  PublicGastronomySnapshot,
  PublicSlugRouteParams,
} from "@/core/business/types/publicSnapshots";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (["true", "1", "sim", "yes"].includes(normalized)) return true;
    if (["false", "0", "nao", "no"].includes(normalized)) return false;
  }
  return undefined;
}

function resolveAddressText(business: Record<string, unknown>): string | null {
  const businessAddress = toNonEmptyString(business.business_address);
  if (businessAddress) return businessAddress;

  const address = isRecord(business.address) ? business.address : null;
  if (!address) return null;

  const street = toNonEmptyString(address.street);
  const number = toNonEmptyString(address.number);
  const complement = toNonEmptyString(address.complement);
  const composed = [street, number, complement].filter(Boolean).join(", ");
  return composed || null;
}

function resolveLocationText(business: Record<string, unknown>): string | null {
  const location = isRecord(business.location) ? business.location : null;
  const fullName = location ? toNonEmptyString(location.full_name) : undefined;
  if (fullName) return fullName;

  const locationName = location ? toNonEmptyString(location.name) : undefined;
  const city = toNonEmptyString(business.business_city);
  const state = toNonEmptyString(business.business_state);
  const cityState = [city, state].filter(Boolean).join(" - ");

  return locationName ?? cityState ?? null;
}

const VALID_SERVICE_MODES = new Set(SERVICE_MODES.map((mode) => mode.id));

function resolveServiceModes(business: Record<string, unknown>): string[] {
  const metadata = isRecord(business.metadata) ? business.metadata : null;
  const fromBusiness = toStringArray(business.modos_atendimento)
    .filter((mode) => VALID_SERVICE_MODES.has(mode));
  if (fromBusiness.length > 0) return [...new Set(fromBusiness)];

  const fromMetadata = metadata
    ? toStringArray(metadata.modos_atendimento).filter((mode) => VALID_SERVICE_MODES.has(mode))
    : [];
  if (fromMetadata.length > 0) return [...new Set(fromMetadata)];

  const temDelivery =
    toBoolean(business.tem_delivery) ??
    (metadata ? toBoolean(metadata.tem_delivery) : undefined) ??
    false;

  return temDelivery ? ["presencial", "delivery"] : ["presencial"];
}

function normalizeInstitutionalBusinessSnapshot<
  TSnapshot extends PublicBusinessSnapshot | PublicGastronomySnapshot,
>(
  snapshot: TSnapshot,
): TSnapshot {
  const institutional = isRecord(snapshot.institutional) ? snapshot.institutional : null;
  const business = institutional && isRecord(institutional.business)
    ? institutional.business
    : null;

  if (!institutional || !business) return snapshot;

  const metadata = isRecord(business.metadata) ? business.metadata : null;
  const normalizedModes = resolveServiceModes(business);
  const normalizedTemDelivery =
    toBoolean(business.tem_delivery) ??
    (metadata ? toBoolean(metadata.tem_delivery) : undefined) ??
    normalizedModes.includes("delivery");
  const normalizedBusiness = {
    ...business,
    phone: undefined,
    whatsapp: undefined,
    email: undefined,
    modos_atendimento: normalizedModes,
    tem_delivery: normalizedTemDelivery,
  };

  const nextInstitutional = {
    ...institutional,
    phone: undefined,
    whatsapp: undefined,
    email: undefined,
    addressText: institutional.addressText ?? resolveAddressText(normalizedBusiness),
    locationText: institutional.locationText ?? resolveLocationText(normalizedBusiness),
    business: normalizedBusiness,
  };

  return {
    ...snapshot,
    institutional: nextInstitutional,
  } as TSnapshot;
}

async function attachAuthenticatedBusinessContact<
  TSnapshot extends PublicBusinessSnapshot | PublicGastronomySnapshot,
>(snapshot: TSnapshot): Promise<TSnapshot> {
  const business = snapshot.institutional.business;
  const businessDataId = toNonEmptyString(business.business_data_id)
    ?? snapshot.identity.businessId
    ?? undefined;
  if (!businessDataId) return snapshot;

  const contact = await EntityContactService.getVisibleForEntity(
    "business",
    businessDataId,
  );

  return {
    ...snapshot,
    institutional: {
      ...snapshot.institutional,
      ...contact,
      business: { ...business, ...contact },
    },
  } as TSnapshot;
}

function normalizeGastronomyBusinessSnapshot(
  snapshot: PublicGastronomySnapshot,
): PublicGastronomySnapshot {
  const base = normalizeInstitutionalBusinessSnapshot(snapshot);
  const normalizedBusiness = base.institutional.business;

  if (
    !base.gastronomy.profile.delivery_enabled &&
    Array.isArray(normalizedBusiness.modos_atendimento) &&
    normalizedBusiness.modos_atendimento.includes("delivery")
  ) {
    return {
      ...base,
      gastronomy: {
        ...base.gastronomy,
        profile: {
          ...base.gastronomy.profile,
          delivery_enabled: true,
        },
      },
    };
  }

  return base;
}

function isBusinessSnapshotLike(value: unknown): value is PublicBusinessSnapshot {
  if (!isRecord(value)) return false;
  const identity = value.identity;
  const institutional = value.institutional;
  const verticals = value.verticals;
  const seo = value.seo;
  const business = isRecord(institutional) ? institutional.business : null;

  return (
    isRecord(identity) &&
    typeof identity.profileId === "string" &&
    typeof identity.slug === "string" &&
    isRecord(institutional) &&
    typeof institutional.name === "string" &&
    isRecord(business) &&
    typeof business.id === "string" &&
    typeof business.profile_id === "string" &&
    isRecord(verticals) &&
    Array.isArray(verticals.activeVerticals) &&
    isRecord(seo) &&
    typeof seo.canonical === "string"
  );
}

function isGastronomySnapshotLike(value: unknown): value is PublicGastronomySnapshot {
  if (!isBusinessSnapshotLike(value)) return false;
  const gastronomy = (value as unknown as Record<string, unknown>).gastronomy;
  return isRecord(gastronomy) && isRecord(gastronomy.profile) && isRecord(gastronomy.business);
}

export class PublicSnapshotRpcService {
  static async getBusinessSnapshotBySlug(
    params: PublicSlugRouteParams,
  ): Promise<PublicBusinessSnapshot | null> {
    try {
      const district = params.district || "_";
      const rpcParams = {
        p_state: params.state,
        p_city: params.city,
        p_district: district,
        p_slug: params.slug,
      };

      const { data, error } = await callRPC<unknown>(
        "get_public_business_snapshot_by_slug",
        rpcParams,
      );

      if (error || !data) return null;

      if (!isBusinessSnapshotLike(data)) {
        logger.warn("[PublicSnapshotRpcService] Invalid business snapshot payload");
        return null;
      }

      return attachAuthenticatedBusinessContact(
        normalizeInstitutionalBusinessSnapshot(data),
      );
    } catch (error) {
      logger.warn("[PublicSnapshotRpcService] business snapshot RPC failed", error);
      return null;
    }
  }

  static async getGastronomySnapshotBySlug(
    params: PublicSlugRouteParams,
  ): Promise<PublicGastronomySnapshot | null> {
    try {
      const district = params.district || "_";
      const rpcParams = {
        p_state: params.state,
        p_city: params.city,
        p_district: district,
        p_slug: params.slug,
      };

      const { data, error } = await callRPC<unknown>(
        "get_public_gastronomy_snapshot_by_slug",
        rpcParams,
      );

      if (error) {
        logger.warn("[PublicSnapshotRpcService] gastronomy snapshot RPC failed", error);
        return null;
      }

      if (!data) return null;

      if (!isGastronomySnapshotLike(data)) {
        logger.warn("[PublicSnapshotRpcService] Invalid gastronomy snapshot payload");
        return null;
      }

      return attachAuthenticatedBusinessContact(
        normalizeGastronomyBusinessSnapshot(data),
      );
    } catch (error) {
      logger.warn("[PublicSnapshotRpcService] gastronomy snapshot RPC failed", error);
      return null;
    }
  }
}
