import { callRPC } from "@/integrations/supabase/services/supabaseHelpers";
import { logger } from "@/shared/utils/logger";
import type {
  PublicBusinessSnapshot,
  PublicGastronomySnapshot,
  PublicSlugRouteParams,
} from "../types/publicSnapshots";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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
  const gastronomy = (value as Record<string, unknown>).gastronomy;
  return isRecord(gastronomy) && isRecord(gastronomy.profile) && isRecord(gastronomy.business);
}

export class PublicSnapshotRpcService {
  static async getBusinessSnapshotBySlug(
    params: PublicSlugRouteParams,
  ): Promise<PublicBusinessSnapshot | null> {
    try {
      // Garantir que district sempre seja uma string (usar "_" como placeholder)
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

      if (error || !data) {
        return null;
      }

      if (!isBusinessSnapshotLike(data)) {
        logger.warn("[PublicSnapshotRpcService] Invalid business snapshot payload");
        return null;
      }

      return data;
    } catch (error) {
      logger.warn("[PublicSnapshotRpcService] business snapshot RPC failed", error);
      return null;
    }
  }

  static async getGastronomySnapshotBySlug(
    params: PublicSlugRouteParams,
  ): Promise<PublicGastronomySnapshot | null> {
    try {
      // Garantir que district sempre seja uma string (usar "_" como placeholder)
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

      if (!data) {
        return null;
      }

      if (!isGastronomySnapshotLike(data)) {
        logger.warn("[PublicSnapshotRpcService] Invalid gastronomy snapshot payload");
        return null;
      }

      return data;
    } catch (error) {
      logger.warn("[PublicSnapshotRpcService] gastronomy snapshot RPC failed", error);
      return null;
    }
  }
}
