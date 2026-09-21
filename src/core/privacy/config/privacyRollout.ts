const PRIVACY_DATA_EXPORT_FEATURE_ENV = "VITE_FEATURE_PRIVACY_DATA_EXPORT";
const PRIVACY_ACCOUNT_DELETION_FEATURE_ENV = "VITE_FEATURE_PRIVACY_ACCOUNT_DELETION";

/**
 * This certification is intentionally independent from the deployment flag.
 * It must only become true after the export matrix is complete, the Edge
 * Function is deployed, and the rollout smoke/integration checks are approved.
 * Keeping it false makes accidental environment configuration fail closed.
 */
export const PRIVACY_DATA_EXPORT_RELEASE_CERTIFIED = false;

/**
 * User-data export is fail-closed until both code certification and the
 * environment rollout flag explicitly authorize it.
 */
export function isPrivacyDataExportEnabled(): boolean {
  return (
    PRIVACY_DATA_EXPORT_RELEASE_CERTIFIED &&
    import.meta.env.VITE_FEATURE_PRIVACY_DATA_EXPORT === "true"
  );
}

export function assertPrivacyDataExportEnabled(): void {
  if (!isPrivacyDataExportEnabled()) {
    throw new Error("Exportacao de dados temporariamente indisponivel");
  }
}

export const PRIVACY_DATA_EXPORT_FEATURE_FLAG = PRIVACY_DATA_EXPORT_FEATURE_ENV;


/**
 * Account deletion remains fail-closed until the destructive purge pipeline,
 * retention policy and exact-SHA rollout evidence are certified.
 */
export const PRIVACY_ACCOUNT_DELETION_RELEASE_CERTIFIED = false;

export function isPrivacyAccountDeletionEnabled(): boolean {
  return (
    PRIVACY_ACCOUNT_DELETION_RELEASE_CERTIFIED &&
    import.meta.env.VITE_FEATURE_PRIVACY_ACCOUNT_DELETION === "true"
  );
}

export function assertPrivacyAccountDeletionEnabled(): void {
  if (!isPrivacyAccountDeletionEnabled()) {
    throw new Error("Exclusao automatica de conta temporariamente indisponivel");
  }
}

export const PRIVACY_ACCOUNT_DELETION_FEATURE_FLAG =
  PRIVACY_ACCOUNT_DELETION_FEATURE_ENV;
