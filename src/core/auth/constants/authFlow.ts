export const AUTH_PATHS = {
  login: "/login",
  signup: "/cadastro",
  signupConfirmation: "/cadastro/confirmacao",
  firstAccess: "/cadastro/primeiro-acesso",
  termsAcceptance: "/aceitar-termos",
  passwordReset: "/reset-password",
} as const;

export const AUTH_QUERY_KEYS = {
  redirect: "redirect",
  confirmed: "confirmed",
  passwordReset: "passwordReset",
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

export const AUTH_FLOW_STORAGE_KEYS = {
  pendingReturn: "auth.pending-return-path",
  pendingSignupEmail: "auth.pending-signup-email",
  pendingSignupRedirect: "auth.pending-signup-redirect",
} as const;

export const AUTH_FLOW_TTL_MS = {
  pendingReturn: 2 * 60 * 60 * 1000,
  pendingSignup: 24 * 60 * 60 * 1000,
} as const;

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
