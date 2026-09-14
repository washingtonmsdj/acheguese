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

/**
 * Persiste somente destinos internos seguros. A validação vive nesta fronteira
 * para que nenhum chamador precise lembrar de repetir a regra de redirect.
 */
export function setPendingAuthReturn(path: string): void {
  setAuthFlowSessionValue(
    AUTH_FLOW_STORAGE_KEYS.pendingReturn,
    resolveSafeInternalPath(path, "/"),
    AUTH_FLOW_TTL_MS.pendingReturn,
  );
}

export function getPendingAuthReturn(): string | null {
  const stored = getAuthFlowSessionValue(AUTH_FLOW_STORAGE_KEYS.pendingReturn);
  return stored ? resolveSafeInternalPath(stored, "/") : null;
}

export function clearPendingAuthReturn(): void {
  clearAuthFlowSessionValue(AUTH_FLOW_STORAGE_KEYS.pendingReturn);
}
