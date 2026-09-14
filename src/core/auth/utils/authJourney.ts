import {
  AUTH_FLOW_STORAGE_KEYS,
  AUTH_FLOW_TTL_MS,
  AUTH_JOURNEY_INTENTS,
  AUTH_PATHS,
  type AuthJourneyIntent,
} from "@/core/auth/constants/authFlow";
import {
  clearAuthFlowSessionValue,
  getAuthFlowSessionValue,
  setAuthFlowSessionValue,
} from "@/core/auth/utils/authFlowStorage";
import {
  clearPendingAuthReturn,
  getPendingAuthReturn,
  setPendingAuthReturn,
} from "@/core/auth/utils/pendingAuthReturn";
import {
  clearPendingSignupContext,
  clearPendingSignupEmail,
  getPendingSignupEmail,
  getPendingSignupRedirect,
  setPendingSignupEmail,
  setPendingSignupRedirect,
} from "@/core/auth/utils/pendingSignup";
import { resolveSafeInternalPath } from "@/shared/utils/safeRedirect";

export interface SignupConfirmationContext {
  email: string | null;
  returnTo: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function setPendingAuthJourneyIntent(intent: AuthJourneyIntent): void {
  setAuthFlowSessionValue(
    AUTH_FLOW_STORAGE_KEYS.pendingIntent,
    intent,
    AUTH_FLOW_TTL_MS.pendingIntent,
  );
}

export function getPendingAuthJourneyIntent(): AuthJourneyIntent | null {
  const value = getAuthFlowSessionValue(AUTH_FLOW_STORAGE_KEYS.pendingIntent);
  return value === AUTH_JOURNEY_INTENTS.login ||
    value === AUTH_JOURNEY_INTENTS.signup
    ? value
    : null;
}

export function clearPendingAuthJourneyIntent(): void {
  clearAuthFlowSessionValue(AUTH_FLOW_STORAGE_KEYS.pendingIntent);
}

/** Destino seguro preservado para o callback OAuth atual. */
export function getAuthJourneyReturnTarget(): string {
  return resolveSafeInternalPath(getPendingAuthReturn(), "/");
}

/** Destino original preservado durante cadastro -> confirmação -> primeiro acesso. */
export function getSignupJourneyReturnTarget(): string {
  return resolveSafeInternalPath(getPendingSignupRedirect(), "/");
}

/** Contexto mínimo da tela de confirmação, sem expor storage para a UI. */
export function getSignupConfirmationContext(): SignupConfirmationContext {
  const pendingEmail = getPendingSignupEmail();
  return {
    email: pendingEmail ? normalizeEmail(pendingEmail) : null,
    returnTo: getSignupJourneyReturnTarget(),
  };
}

/**
 * Cadastro por e-mail concluído no backend: persiste apenas o contexto efêmero
 * necessário para confirmação e primeiro acesso. Credenciais nunca passam por
 * esta camada.
 */
export function prepareEmailSignupConfirmation(
  email: string,
  returnTo: string,
): void {
  clearPendingAuthReturn();
  clearPendingAuthJourneyIntent();
  setPendingSignupEmail(normalizeEmail(email));
  setPendingSignupRedirect(resolveSafeInternalPath(returnTo, "/"));
}

/** Reinicia somente a etapa de dados da conta, preservando o destino original. */
export function restartEmailSignupJourney(): void {
  clearPendingSignupEmail();
  clearPendingAuthReturn();
  clearPendingAuthJourneyIntent();
}

/** Prepara uma tentativa de login Google sem carregar contexto de cadastro antigo. */
export function prepareGoogleLogin(returnTo: string): void {
  clearPendingSignupContext();
  setPendingAuthJourneyIntent(AUTH_JOURNEY_INTENTS.login);
  setPendingAuthReturn(resolveSafeInternalPath(returnTo, "/"));
}

export function cancelGoogleLogin(): void {
  clearPendingAuthReturn();
  clearPendingAuthJourneyIntent();
}

/**
 * Cadastro Google precisa de dois destinos distintos:
 * - OAuth -> aceite legal -> primeiro acesso;
 * - primeiro acesso -> destino original do usuário.
 */
export function prepareGoogleSignup(returnTo: string): void {
  clearPendingSignupEmail();
  setPendingAuthJourneyIntent(AUTH_JOURNEY_INTENTS.signup);
  setPendingSignupRedirect(resolveSafeInternalPath(returnTo, "/"));
  setPendingAuthReturn(AUTH_PATHS.firstAccess);
}

export function cancelGoogleSignup(): void {
  clearPendingAuthReturn();
  clearPendingAuthJourneyIntent();
  clearPendingSignupContext();
}

/** Limpeza para login comum já concluído. */
export function completeStandardLoginJourney(): void {
  clearPendingAuthReturn();
  clearPendingAuthJourneyIntent();
  clearPendingSignupContext();
}

/** Confirmação por e-mail ainda precisa do redirect de signup no primeiro acesso. */
export function completeEmailConfirmationLoginJourney(): void {
  clearPendingAuthReturn();
  clearPendingAuthJourneyIntent();
}

/** Primeiro acesso é o último owner do contexto transitório de cadastro. */
export function completeFirstAccessJourney(): void {
  clearPendingAuthReturn();
  clearPendingAuthJourneyIntent();
  clearPendingSignupContext();
}

/** Termos concluídos: o próximo destino já foi resolvido; intenção OAuth não é mais necessária. */
export function completeTermsJourney(): void {
  clearPendingAuthReturn();
  clearPendingAuthJourneyIntent();
}
