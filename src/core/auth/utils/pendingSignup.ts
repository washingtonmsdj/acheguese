import {
  AUTH_FLOW_STORAGE_KEYS,
  AUTH_FLOW_TTL_MS,
} from "@/core/auth/constants/authFlow";
import {
  clearAuthFlowSessionValue,
  getAuthFlowSessionValue,
  setAuthFlowSessionValue,
} from "@/core/auth/utils/authFlowStorage";
import { resolveSafeInternalPath } from "@/shared/utils/safeRedirect";

export function setPendingSignupEmail(email: string): void {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    clearPendingSignupEmail();
    return;
  }

  setAuthFlowSessionValue(
    AUTH_FLOW_STORAGE_KEYS.pendingSignupEmail,
    normalizedEmail,
    AUTH_FLOW_TTL_MS.pendingSignup,
  );
}

export function getPendingSignupEmail(): string | null {
  const email = getAuthFlowSessionValue(AUTH_FLOW_STORAGE_KEYS.pendingSignupEmail);
  return email?.trim().toLowerCase() || null;
}

export function clearPendingSignupEmail(): void {
  clearAuthFlowSessionValue(AUTH_FLOW_STORAGE_KEYS.pendingSignupEmail);
}

/**
 * O destino do cadastro é sempre sanitizado aqui. Isso mantém a regra de
 * redirect em uma única fronteira e também protege valores legados já salvos.
 */
export function setPendingSignupRedirect(path: string): void {
  setAuthFlowSessionValue(
    AUTH_FLOW_STORAGE_KEYS.pendingSignupRedirect,
    resolveSafeInternalPath(path, "/"),
    AUTH_FLOW_TTL_MS.pendingSignup,
  );
}

export function getPendingSignupRedirect(): string | null {
  const stored = getAuthFlowSessionValue(
    AUTH_FLOW_STORAGE_KEYS.pendingSignupRedirect,
  );
  return stored ? resolveSafeInternalPath(stored, "/") : null;
}

export function clearPendingSignupRedirect(): void {
  clearAuthFlowSessionValue(AUTH_FLOW_STORAGE_KEYS.pendingSignupRedirect);
}

export function clearPendingSignupContext(): void {
  clearPendingSignupEmail();
  clearPendingSignupRedirect();
}
