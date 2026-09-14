const PENDING_SIGNUP_EMAIL_KEY = "auth.pending-signup-email";
const PENDING_SIGNUP_REDIRECT_KEY = "auth.pending-signup-redirect";

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function setPendingSignupEmail(email: string): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(PENDING_SIGNUP_EMAIL_KEY, email);
}

export function getPendingSignupEmail(): string | null {
  if (!canUseSessionStorage()) return null;
  return window.sessionStorage.getItem(PENDING_SIGNUP_EMAIL_KEY);
}

export function clearPendingSignupEmail(): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(PENDING_SIGNUP_EMAIL_KEY);
}

/**
 * Guarda somente o destino interno já validado pelo chamador.
 * O valor vive em sessionStorage para atravessar cadastro -> confirmação -> login
 * sem persistir credenciais ou dados sensíveis além da sessão do navegador.
 */
export function setPendingSignupRedirect(path: string): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(PENDING_SIGNUP_REDIRECT_KEY, path);
}

export function getPendingSignupRedirect(): string | null {
  if (!canUseSessionStorage()) return null;
  return window.sessionStorage.getItem(PENDING_SIGNUP_REDIRECT_KEY);
}

export function clearPendingSignupRedirect(): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(PENDING_SIGNUP_REDIRECT_KEY);
}

export function clearPendingSignupContext(): void {
  clearPendingSignupEmail();
  clearPendingSignupRedirect();
}
