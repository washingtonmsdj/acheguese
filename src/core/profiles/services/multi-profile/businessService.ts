/**
 * BUSINESS SERVICE - compatibility facade for multi-profile editor flows.
 *
 * Persistence authority belongs to core/business. This facade keeps the
 * historical API used by profile editing without owning business_data reads or
 * writes itself.
 */
import { logger } from "@/shared/utils/logger";
import {
  getBusinessProfileExtension,
  updateBusinessProfileExtension,
  type BusinessProfileExtensionUpdate,
} from "@/core/business/services/business.profile-extension";
import type { BusinessData, ServiceResponse } from "./types";

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

function toMultiProfileBusinessData(
  value: Awaited<ReturnType<typeof getBusinessProfileExtension>>,
): BusinessData | null {
  if (!value) return null;
  return value as BusinessData;
}

export class BusinessService {
  /**
   * Buscar business data via owner canonico de Business.
   */
  static async getBusinessData(profileId: string): Promise<BusinessData | null> {
    try {
      return toMultiProfileBusinessData(
        await getBusinessProfileExtension(profileId),
      );
    } catch (error: unknown) {
      logger.error("Error fetching business data:", error);
      return null;
    }
  }

  /**
   * Atualizar business data via owner canonico de Business.
   */
  static async updateBusinessData(
    profileId: string,
    updates: Partial<Omit<BusinessData, "profile_id" | "created_at" | "updated_at">>,
  ): Promise<ServiceResponse<BusinessData>> {
    try {
      const data = await updateBusinessProfileExtension(
        profileId,
        updates as BusinessProfileExtensionUpdate,
      );

      return {
        success: true,
        data: data as BusinessData,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: errorMessage(error, "Failed to update business data"),
      };
    }
  }
}
