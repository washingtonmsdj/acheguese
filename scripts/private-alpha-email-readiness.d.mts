export interface EmailProviderReadiness {
  domainCount: number;
  failedRecordCount: number;
  failureCode: string | null;
  fromConfigured: boolean;
  matchingDomainFound: boolean;
  matchingDomainStatus: string | null;
  ready: boolean;
  verifiedDomainCount: number;
}

export interface SupabaseAuthEmailReadiness {
  autoConfirmDisabled: boolean;
  customSmtpConfigured: boolean;
  externalEmailEnabled: boolean;
  failureCode: string | null;
  ready: boolean;
  senderConfigured: boolean;
}

export interface PrivateAlphaEmailReadiness {
  checkedAt: string;
  projectRef: string | undefined;
  ready: boolean;
  resend: EmailProviderReadiness;
  supabaseAuth: SupabaseAuthEmailReadiness;
}

export function evaluateResendEmailReadiness(
  payload: unknown,
  fromEmail: unknown,
): EmailProviderReadiness;

export function evaluateSupabaseAuthEmailReadiness(
  authConfig: unknown,
): SupabaseAuthEmailReadiness;

export function auditPrivateAlphaEmailReadiness(options?: {
  fetchImpl?: typeof fetch;
  fromEmail?: string;
  managementToken?: string;
  projectRef?: string;
  resendManagementApiKey?: string;
  tokenEnv?: string;
}): Promise<PrivateAlphaEmailReadiness>;
