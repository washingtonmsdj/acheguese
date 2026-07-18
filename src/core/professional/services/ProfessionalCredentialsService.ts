import { invokeSupabaseBroker } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";

export interface ProfessionalCredentials {
  professional_id: string;
  profile_id: string;
  license_number: string | null;
  license_state: string | null;
}

export interface ProfessionalCredentialsPatch {
  licenseNumber?: string | null;
  licenseState?: string | null;
}

const FUNCTION_NAME = "professional-credentials-rpc";
const SERVICE_NAME = "ProfessionalCredentialsService";

export class ProfessionalCredentialsService {
  static async getOwned(profileId: string): Promise<ProfessionalCredentials> {
    return invokeSupabaseBroker<ProfessionalCredentials, "getOwned">({
      action: "getOwned",
      functionName: FUNCTION_NAME,
      params: { profileId },
      serviceName: SERVICE_NAME,
    });
  }

  static async patchOwned(
    profileId: string,
    credentials: ProfessionalCredentialsPatch,
  ): Promise<ProfessionalCredentials> {
    return invokeSupabaseBroker<ProfessionalCredentials, "patchOwned">({
      action: "patchOwned",
      functionName: FUNCTION_NAME,
      params: { profileId, credentials },
      serviceName: SERVICE_NAME,
    });
  }
}
