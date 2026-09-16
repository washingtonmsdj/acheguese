const PRIVACY_DATA_EXPORT_FEATURE_ENV = "VITE_FEATURE_PRIVACY_DATA_EXPORT";

/**
 * User-data export is fail-closed until the LGPD export matrix is certified
 * and the corresponding Edge Function is deployed. Production must opt in
 * explicitly after that rollout is complete.
 */
export function isPrivacyDataExportEnabled(): boolean {
  return import.meta.env.VITE_FEATURE_PRIVACY_DATA_EXPORT === "true";
}

export function assertPrivacyDataExportEnabled(): void {
  if (!isPrivacyDataExportEnabled()) {
    throw new Error("Exportacao de dados temporariamente indisponivel");
  }
}

export const PRIVACY_DATA_EXPORT_FEATURE_FLAG = PRIVACY_DATA_EXPORT_FEATURE_ENV;
