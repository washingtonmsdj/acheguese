const PENDING_SIGNUP_EMAIL_KEY = "auth.pending-signup-email";

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function setPendingSignupEmail(email: string): void {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(PENDING_SIGNUP_EMAIL_KEY, email);
}

export function getPendingSignupEmail(): string | null {
  if (!canUseSessionStorage()) {
    return null;
  }

  return window.sessionStorage.getItem(PENDING_SIGNUP_EMAIL_KEY);
}

export function clearPendingSignupEmail(): void {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.removeItem(PENDING_SIGNUP_EMAIL_KEY);
}
