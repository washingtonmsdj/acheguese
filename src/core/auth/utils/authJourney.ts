import { AUTH_PATHS } from "@/core/auth/constants/authFlow";
import {
  clearPendingAuthReturn,
  setPendingAuthReturn,
} from "@/core/auth/utils/pendingAuthReturn";
import {
  clearPendingSignupContext,
  clearPendingSignupEmail,
  setPendingSignupRedirect,
} from "@/core/auth/utils/pendingSignup";
import { resolveSafeInternalPath } from "@/shared/utils/safeRedirect";

/** Prepara uma tentativa de login Google sem carregar contexto de cadastro antigo. */
export function prepareGoogleLogin(returnTo: string): void {
  clearPendingSignupContext();
  setPendingAuthReturn(resolveSafeInternalPath(returnTo, "/"));
}

export function cancelGoogleLogin(): void {
  clearPendingAuthReturn();
}

/**
 * Cadastro Google precisa de dois destinos distintos:
 * - OAuth -> aceite legal -> primeiro acesso;
 * - primeiro acesso -> destino original do usuário.
 */
export function prepareGoogleSignup(returnTo: string): void {
  clearPendingSignupEmail();
  setPendingSignupRedirect(resolveSafeInternalPath(returnTo, "/"));
  setPendingAuthReturn(AUTH_PATHS.firstAccess);
}

export function cancelGoogleSignup(): void {
  clearPendingAuthReturn();
  clearPendingSignupContext();
}

/** Limpeza para login comum já concluído. */
export function completeStandardLoginJourney(): void {
  clearPendingAuthReturn();
  clearPendingSignupContext();
}

/** Confirmação por e-mail ainda precisa do redirect de signup no primeiro acesso. */
export function completeEmailConfirmationLoginJourney(): void {
  clearPendingAuthReturn();
}
