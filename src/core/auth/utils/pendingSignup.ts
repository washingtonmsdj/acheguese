import {
  AUTH_FLOW_STORAGE_KEYS,
  AUTH_FLOW_TTL_MS,
} from "@/core/auth/constants/authFlow";
import {
  clearAuthFlowSessionValue,
  getAuthFlowSessionValue,
  setAuthFlowSessionValue,
} from "@/core/auth/utils/authFlowStorage";

export function setPendingSignupEmail(email: string): void {
  setAuthFlowSessionValue(
    AUTH_FLOW_STORAGE_KEYS.pendingSignupEmail,
    email,
    AUTH_FLOW_TTL_MS.pendingSignup,
  );
}

export function getPendingSignupEmail(): string | null {
  return getAuthFlowSessionValue(AUTH_FLOW_STORAGE_KEYS.pendingSignupEmail);
}

export function clearPendingSignupEmail(): void {
  clearAuthFlowSessionValue(AUTH_FLOW_STORAGE_KEYS.pendingSignupEmail);
}

/**
 * Guarda somente o destino interno já validado pelo chamador.
 * O valor vive em sessionStorage e expira para impedir que contexto antigo de
 * cadastro contamine uma nova jornada na mesma aba.
 */
export function setPendingSignupRedirect(path: string): void {
  setAuthFlowSessionValue(
    AUTH_FLOW_STORAGE_KEYS.pendingSignupRedirect,
    path,
    AUTH_FLOW_TTL_MS.pendingSignup,
  );
}

export function getPendingSignupRedirect(): string | null {
  return getAuthFlowSessionValue(AUTH_FLOW_STORAGE_KEYS.pendingSignupRedirect);
}

export function clearPendingSignupRedirect(): void {
  clearAuthFlowSessionValue(AUTH_FLOW_STORAGE_KEYS.pendingSignupRedirect);
}

export function clearPendingSignupContext(): void {
  clearPendingSignupEmail();
  clearPendingSignupRedirect();
}
