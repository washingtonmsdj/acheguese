export const AUTH_PATHS = {
  login: "/login",
  signup: "/cadastro",
  signupConfirmation: "/cadastro/confirmacao",
  firstAccess: "/cadastro/primeiro-acesso",
  termsAcceptance: "/aceitar-termos",
  passwordReset: "/reset-password",
  emailChangeConfirmation: "/conta/confirmar-email",
} as const;

export const AUTH_QUERY_KEYS = {
  redirect: "redirect",
  confirmed: "confirmed",
  passwordReset: "passwordReset",
  emailChange: "emailChange",
  mode: "mode",
  type: "type",
  code: "code",
  email: "email",
  error: "error",
  errorCode: "error_code",
  expired: "expired",
  accessToken: "access_token",
  refreshToken: "refresh_token",
} as const;

export const AUTH_QUERY_VALUES = {
  request: "request",
  recovery: "recovery",
  enabled: "1",
  expiredOtp: "otp_expired",
} as const;

export const AUTH_JOURNEY_INTENTS = {
  login: "login",
  signup: "signup",
} as const;

export type AuthJourneyIntent =
  (typeof AUTH_JOURNEY_INTENTS)[keyof typeof AUTH_JOURNEY_INTENTS];

export const AUTH_EMAIL_CONFIRMATION_INTENTS = {
  login: "login",
  signup: "signup",
} as const;

export type AuthEmailConfirmationIntent =
  (typeof AUTH_EMAIL_CONFIRMATION_INTENTS)[keyof typeof AUTH_EMAIL_CONFIRMATION_INTENTS];

export const AUTH_FLOW_STORAGE_KEYS = {
  pendingReturn: "auth.pending-return-path",
  pendingIntent: "auth.pending-intent",
  pendingSignupEmail: "auth.pending-signup-email",
  pendingSignupRedirect: "auth.pending-signup-redirect",
  pendingEmailConfirmationIntent: "auth.pending-email-confirmation-intent",
  pendingSignupConfirmationCooldownUntil:
    "auth.pending-signup-confirmation-cooldown-until",
  passwordRecoveryResendEmail: "auth.password-recovery-resend-email",
  passwordRecoveryResendCooldownUntil:
    "auth.password-recovery-resend-cooldown-until",
} as const;

export const AUTH_FLOW_TTL_MS = {
  pendingReturn: 2 * 60 * 60 * 1000,
  pendingIntent: 2 * 60 * 60 * 1000,
  pendingSignup: 24 * 60 * 60 * 1000,
  passwordRecovery: 2 * 60 * 60 * 1000,
} as const;

export const AUTH_SIGNUP_CONFIRMATION_RESEND_COOLDOWN_MS = 60 * 1000;
export const AUTH_PASSWORD_RECOVERY_RESEND_COOLDOWN_MS = 60 * 1000;
export const AUTH_FIRST_ACCESS_SESSION_SETTLE_MS = 3 * 1000;

export function buildAuthPathWithRedirect(
  basePath: string,
  redirectTo: string | null | undefined,
): string {
  if (!redirectTo || redirectTo === "/") return basePath;
  const query = new URLSearchParams({ [AUTH_QUERY_KEYS.redirect]: redirectTo });
  return `${basePath}?${query.toString()}`;
}

export function buildLoginPath(redirectTo?: string | null): string {
  return buildAuthPathWithRedirect(AUTH_PATHS.login, redirectTo);
}

export function buildSignupPath(redirectTo?: string | null): string {
  return buildAuthPathWithRedirect(AUTH_PATHS.signup, redirectTo);
}

export function buildPasswordResetRequestPath(email?: string | null): string {
  const query = new URLSearchParams({
    [AUTH_QUERY_KEYS.mode]: AUTH_QUERY_VALUES.request,
  });
  if (email) query.set(AUTH_QUERY_KEYS.email, email);
  return `${AUTH_PATHS.passwordReset}?${query.toString()}`;
}

export function buildPasswordRecoveryPath(): string {
  const query = new URLSearchParams({
    [AUTH_QUERY_KEYS.mode]: AUTH_QUERY_VALUES.recovery,
  });
  return `${AUTH_PATHS.passwordReset}?${query.toString()}`;
}

export function buildExpiredPasswordResetPath(): string {
  const query = new URLSearchParams({
    [AUTH_QUERY_KEYS.expired]: AUTH_QUERY_VALUES.enabled,
  });
  return `${AUTH_PATHS.passwordReset}?${query.toString()}`;
}

export function buildEmailConfirmationLoginPath(): string {
  const query = new URLSearchParams({
    [AUTH_QUERY_KEYS.confirmed]: AUTH_QUERY_VALUES.enabled,
  });
  return `${AUTH_PATHS.login}?${query.toString()}`;
}

export function buildEmailChangeConfirmationPath(): string {
  const query = new URLSearchParams({
    [AUTH_QUERY_KEYS.emailChange]: AUTH_QUERY_VALUES.enabled,
  });
  return `${AUTH_PATHS.emailChangeConfirmation}?${query.toString()}`;
}

export function buildPasswordResetSuccessLoginPath(): string {
  const query = new URLSearchParams({
    [AUTH_QUERY_KEYS.passwordReset]: AUTH_QUERY_VALUES.enabled,
  });
  return `${AUTH_PATHS.login}?${query.toString()}`;
}
