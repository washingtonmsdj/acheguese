export interface SmtpOperatorEnvReadiness {
  configured: boolean;
  failureCode: string | null;
  missingKeys: string[];
  validAdminEmail: boolean;
  validPort: boolean;
}

export function evaluateSmtpOperatorEnv(
  env?: Record<string, string | undefined>,
): SmtpOperatorEnvReadiness;

export function createAuthSmtpPatchPayload(
  env?: Record<string, string | undefined>,
): Readonly<Record<string, unknown>>;

export function checkSupabaseAuthSmtp(options: {
  projectRef: string;
  token: string;
}): Promise<Record<string, unknown>>;

export function applySupabaseAuthSmtp(options: {
  env?: Record<string, string | undefined>;
  projectRef: string;
  token: string;
}): Promise<Record<string, unknown>>;
