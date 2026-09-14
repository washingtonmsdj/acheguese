const PENDING_AUTH_RETURN_KEY = "auth.pending-return-path";

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

/** O chamador deve fornecer somente um caminho interno já validado. */
export function setPendingAuthReturn(path: string): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(PENDING_AUTH_RETURN_KEY, path);
}

export function getPendingAuthReturn(): string | null {
  if (!canUseSessionStorage()) return null;
  return window.sessionStorage.getItem(PENDING_AUTH_RETURN_KEY);
}

export function clearPendingAuthReturn(): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(PENDING_AUTH_RETURN_KEY);
}
