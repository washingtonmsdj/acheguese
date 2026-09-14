import {
  AUTH_FLOW_STORAGE_KEYS,
  AUTH_FLOW_TTL_MS,
} from "@/core/auth/constants/authFlow";
import {
  clearAuthFlowSessionValue,
  getAuthFlowSessionValue,
  setAuthFlowSessionValue,
} from "@/core/auth/utils/authFlowStorage";

/** O chamador deve fornecer somente um caminho interno já validado. */
export function setPendingAuthReturn(path: string): void {
  setAuthFlowSessionValue(
    AUTH_FLOW_STORAGE_KEYS.pendingReturn,
    path,
    AUTH_FLOW_TTL_MS.pendingReturn,
  );
}

export function getPendingAuthReturn(): string | null {
  return getAuthFlowSessionValue(AUTH_FLOW_STORAGE_KEYS.pendingReturn);
}

export function clearPendingAuthReturn(): void {
  clearAuthFlowSessionValue(AUTH_FLOW_STORAGE_KEYS.pendingReturn);
}
