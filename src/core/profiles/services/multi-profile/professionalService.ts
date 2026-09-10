/**
 * Professional profile extension adapter.
 * Public professional fields stay in professional_data; registration
 * credentials are read and written only through the authenticated broker.
 * Territorial coverage belongs exclusively to ServiceAreasService.
 */
import { ProfessionalCredentialsService } from "@/core/professional/services/ProfessionalCredentialsService";
import { ProfileRpcService } from "@/core/profiles/services/ProfileRpcService";
import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type { ProfessionalData, ServiceResponse } from "./types";

const PROFESSIONAL_EXTENSION_SELECT = `
  id,
  profile_id,
  profession,
  professional_name,
  service_category,
  specialties,
  years_experience,
  education,
  certifications,
  services_offered,
  availability_notes,
  portfolio_items,
  visibility,
  hourly_rate,
  accepts_remote,
  created_at,
  updated_at
`;

type ProfessionalExtensionRow = ProfessionalData & { id: string };

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

function withoutInternalId(row: ProfessionalExtensionRow): ProfessionalData {
  const { id: _id, ...professional } = row;
  return professional;
}

export class ProfessionalService {
  static async getProfessionalData(profileId: string): Promise<ProfessionalData | null> {
    try {
      const { data, error } = await supabase
        .from("professional_data")
        .select(PROFESSIONAL_EXTENSION_SELECT)
        .eq("profile_id", profileId)
        .single();

      if (error) throw error;

      const credentials = await ProfessionalCredentialsService.getOwned(profileId);
      return {
        ...withoutInternalId(data as unknown as ProfessionalExtensionRow),
        license_number: credentials.license_number ?? undefined,
        license_state: credentials.license_state ?? undefined,
      };
    } catch (error: unknown) {
      logger.error(
        "[ProfessionalService] getProfessionalData:",
        errorMessage(error, "unknown_error"),
      );
      return null;
    }
  }

  static async updateProfessionalData(
    profileId: string,
    updates: Partial<Omit<ProfessionalData, "profile_id" | "created_at" | "updated_at">>,
  ): Promise<ServiceResponse<ProfessionalData>> {
    try {
      const {
        license_number: licenseNumber,
        license_state: licenseState,
        ...publicUpdates
      } = updates;
      const hasPublicUpdates = Object.keys(publicUpdates).length > 0;

      if (hasPublicUpdates) {
        const brokerResult = await ProfileRpcService.updateProfessionalData<
          ServiceResponse<{ profile_id: string; professional_id: string }>
        >(profileId, publicUpdates as Record<string, unknown>);

        if (!brokerResult.success) {
          throw new Error(
            brokerResult.error || "Failed to update professional data",
          );
        }
      }

      const { data, error } = await supabase
        .from("professional_data")
        .select(PROFESSIONAL_EXTENSION_SELECT)
        .eq("profile_id", profileId)
        .single();
      if (error) throw error;

      const credentialsPatch: {
        licenseNumber?: string | null;
        licenseState?: string | null;
      } = {};
      if (Object.prototype.hasOwnProperty.call(updates, "license_number")) {
        credentialsPatch.licenseNumber = licenseNumber?.trim() || null;
      }
      if (Object.prototype.hasOwnProperty.call(updates, "license_state")) {
        credentialsPatch.licenseState = licenseState?.trim() || null;
      }

      const credentials = Object.keys(credentialsPatch).length > 0
        ? await ProfessionalCredentialsService.patchOwned(profileId, credentialsPatch)
        : await ProfessionalCredentialsService.getOwned(profileId);

      return {
        success: true,
        data: {
          ...withoutInternalId(data as unknown as ProfessionalExtensionRow),
          license_number: credentials.license_number ?? undefined,
          license_state: credentials.license_state ?? undefined,
        },
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: errorMessage(error, "Failed to update professional data"),
      };
    }
  }
}
