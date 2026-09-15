import {
  AUTH_EMAIL_CONFIRMATION_INTENTS,
  AUTH_FLOW_STORAGE_KEYS,
  AUTH_FLOW_TTL_MS,
  AUTH_JOURNEY_INTENTS,
  AUTH_PATHS,
  AUTH_SIGNUP_CONFIRMATION_RESEND_COOLDOWN_MS,
  type AuthEmailConfirmationIntent,
  type AuthJourneyIntent,
} from "@/core/auth/constants/authFlow";
import {
  clearAuthFlowSessionValue,
  getAuthFlowSessionValue,
  setAuthFlowSessionValue,
} from "@/core/auth/utils/authFlowStorage";
import { resolveSafeInternalPath } from "@/shared/utils/safeRedirect";

export interface SignupConfirmationContext {
  email: string | null;
  returnTo: string;
  intent: AuthEmailConfirmationIntent | null;
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

function setPendingReturn(path: string): void {
  setAuthFlowSessionValue(
    AUTH_FLOW_STORAGE_KEYS.pendingReturn,
    resolveSafeInternalPath(path, "/"),
    AUTH_FLOW_TTL_MS.pendingReturn,
  );
}

function getPendingReturn(): string | null {
  return getAuthFlowSessionValue(AUTH_FLOW_STORAGE_KEYS.pendingReturn);
}

function clearPendingReturn(): void {
  clearAuthFlowSessionValue(AUTH_FLOW_STORAGE_KEYS.pendingReturn);
}

function setPendingSignupEmail(email: string): void {
  setAuthFlowSessionValue(
    AUTH_FLOW_STORAGE_KEYS.pendingSignupEmail,
    normalizeEmail(email),
    AUTH_FLOW_TTL_MS.pendingSignup,
  );
}

function getPendingSignupEmail(): string | null {
  return getAuthFlowSessionValue(AUTH_FLOW_STORAGE_KEYS.pendingSignupEmail);
}

function clearPendingSignupEmail(): void {
  clearAuthFlowSessionValue(AUTH_FLOW_STORAGE_KEYS.pendingSignupEmail);
}

function setPendingSignupRedirect(path: string): void {
  setAuthFlowSessionValue(
    AUTH_FLOW_STORAGE_KEYS.pendingSignupRedirect,
    resolveSafeInternalPath(path, "/"),
    AUTH_FLOW_TTL_MS.pendingSignup,
  );
}

function getPendingSignupRedirect(): string | null {
  return getAuthFlowSessionValue(AUTH_FLOW_STORAGE_KEYS.pendingSignupRedirect);
}

function setPendingEmailConfirmationIntent(
  intent: AuthEmailConfirmationIntent,
): void {
  setAuthFlowSessionValue(
    AUTH_FLOW_STORAGE_KEYS.pendingEmailConfirmationIntent,
    intent,
    AUTH_FLOW_TTL_MS.pendingSignup,
  );
}

export function getPendingEmailConfirmationIntent(): AuthEmailConfirmationIntent | null {
  const value = getAuthFlowSessionValue(
    AUTH_FLOW_STORAGE_KEYS.pendingEmailConfirmationIntent,
  );
  return value === AUTH_EMAIL_CONFIRMATION_INTENTS.login ||
    value === AUTH_EMAIL_CONFIRMATION_INTENTS.signup
    ? value
    : null;
}

function clearPendingEmailConfirmationIntent(): void {
  clearAuthFlowSessionValue(
    AUTH_FLOW_STORAGE_KEYS.pendingEmailConfirmationIntent,
  );
}

function clearPendingSignupConfirmationCooldown(): void {
  clearAuthFlowSessionValue(
    AUTH_FLOW_STORAGE_KEYS.pendingSignupConfirmationCooldownUntil,
  );
}

function getPendingSignupConfirmationCooldownUntil(): number | null {
  const stored = getAuthFlowSessionValue(
    AUTH_FLOW_STORAGE_KEYS.pendingSignupConfirmationCooldownUntil,
  );
  if (!stored) return null;

  const value = Number(stored);
  if (!Number.isFinite(value) || value <= 0) {
    clearPendingSignupConfirmationCooldown();
    return null;
  }
  return value;
}

function clearPendingEmailConfirmationState(): void {
  clearPendingSignupEmail();
  clearPendingEmailConfirmationIntent();
  clearPendingSignupConfirmationCooldown();
}

function clearPendingSignupContext(): void {
  clearPendingEmailConfirmationState();
  clearPendingSignupRedirect();
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
  return resolveSafeInternalPath(getPendingReturn(), "/");
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
    intent: getPendingEmailConfirmationIntent(),
  };
}

/**
 * Inicia a janela local de bloqueio que espelha o limite do Auth para reenvio.
 * É usada após envio aceito e também quando o servidor responde rate-limit.
 */
export function startSignupConfirmationResendCooldown(now = Date.now()): void {
  setAuthFlowSessionValue(
    AUTH_FLOW_STORAGE_KEYS.pendingSignupConfirmationCooldownUntil,
    String(now + AUTH_SIGNUP_CONFIRMATION_RESEND_COOLDOWN_MS),
    AUTH_FLOW_TTL_MS.pendingSignup,
  );
}

/**
 * Tempo restante do bloqueio de reenvio. O deadline persiste durante reloads;
 * mudanças regressivas no relógio nunca ampliam a espera além do cooldown.
 */
export function getSignupConfirmationResendRemainingMs(
  now = Date.now(),
): number {
  const cooldownUntil = getPendingSignupConfirmationCooldownUntil();
  if (cooldownUntil === null) return 0;
  return Math.min(
    AUTH_SIGNUP_CONFIRMATION_RESEND_COOLDOWN_MS,
    Math.max(0, cooldownUntil - now),
  );
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
  clearPendingReturn();
  clearPendingAuthJourneyIntent();
  setPendingSignupEmail(email);
  setPendingSignupRedirect(returnTo);
  setPendingEmailConfirmationIntent(AUTH_EMAIL_CONFIRMATION_INTENTS.signup);
  startSignupConfirmationResendCooldown();
}

/**
 * Login válido bloqueado apenas por e-mail ainda não confirmado. Preservamos o
 * e-mail e o destino para a tela de confirmação, mas não iniciamos cooldown:
 * nenhuma nova mensagem foi enviada por esta tentativa de login.
 */
export function prepareUnconfirmedEmailLogin(
  email: string,
  returnTo: string,
): void {
  clearPendingReturn();
  clearPendingAuthJourneyIntent();
  clearPendingSignupConfirmationCooldown();
  setPendingSignupEmail(email);
  setPendingSignupRedirect(returnTo);
  setPendingEmailConfirmationIntent(AUTH_EMAIL_CONFIRMATION_INTENTS.login);
}

/**
 * Alguns ambientes podem devolver uma sessão já no signup. Nesse caso não há
 * etapa de confirmação a preservar: mantemos apenas o destino do primeiro
 * acesso e removemos qualquer contexto de confirmação antigo.
 */
export function prepareAuthenticatedEmailSignup(returnTo: string): void {
  clearPendingReturn();
  clearPendingAuthJourneyIntent();
  clearPendingEmailConfirmationState();
  setPendingSignupRedirect(returnTo);
}

/** Reinicia somente a etapa de dados da conta, preservando o destino original. */
export function restartEmailSignupJourney(): void {
  clearPendingEmailConfirmationState();
  clearPendingReturn();
  clearPendingAuthJourneyIntent();
}

/** Cancela a confirmação originada em login sem transformar o fluxo em cadastro. */
export function cancelUnconfirmedEmailLoginJourney(): void {
  clearPendingReturn();
  clearPendingAuthJourneyIntent();
  clearPendingSignupContext();
}

/** Prepara uma tentativa de login Google sem carregar contexto de cadastro antigo. */
export function prepareGoogleLogin(returnTo: string): void {
  clearPendingSignupContext();
  setPendingAuthJourneyIntent(AUTH_JOURNEY_INTENTS.login);
  setPendingReturn(returnTo);
}

export function cancelGoogleLogin(): void {
  clearPendingReturn();
  clearPendingAuthJourneyIntent();
}

/**
 * Cadastro Google precisa de dois destinos distintos:
 * - OAuth -> aceite legal -> primeiro acesso;
 * - primeiro acesso -> destino original do usuário.
 */
export function prepareGoogleSignup(returnTo: string): void {
  clearPendingSignupContext();
  setPendingAuthJourneyIntent(AUTH_JOURNEY_INTENTS.signup);
  setPendingSignupRedirect(returnTo);
  setPendingReturn(AUTH_PATHS.firstAccess);
}

export function cancelGoogleSignup(): void {
  clearPendingReturn();
  clearPendingAuthJourneyIntent();
  clearPendingSignupContext();
}

/** Limpeza para login comum já concluído. */
export function completeStandardLoginJourney(): void {
  clearPendingReturn();
  clearPendingAuthJourneyIntent();
  clearPendingSignupContext();
}

/**
 * O botão de cadastro Google também pode autenticar uma conta já existente.
 * Se essa conta já possui o aceite legal atual, não existe primeiro acesso a
 * concluir: limpamos todo o contexto transitório e retornamos ao destino real.
 */
export function completeExistingGoogleSignupJourney(): void {
  clearPendingReturn();
  clearPendingAuthJourneyIntent();
  clearPendingSignupContext();
}

/**
 * Uma conta sem e-mail confirmado ainda não concluiu o acesso inicial. Depois
 * da confirmação, a etapa canônica continua sendo primeiro acesso; limpamos o
 * estado específico do e-mail, mas preservamos o destino para essa etapa.
 */
export function completeEmailConfirmationJourney(): void {
  clearPendingReturn();
  clearPendingAuthJourneyIntent();
  clearPendingEmailConfirmationState();
}

/** Primeiro acesso é o último owner do contexto transitório de cadastro. */
export function completeFirstAccessJourney(): void {
  clearPendingReturn();
  clearPendingAuthJourneyIntent();
  clearPendingSignupContext();
}

/** Termos concluídos: o próximo destino já foi resolvido; intenção OAuth não é mais necessária. */
export function completeTermsJourney(): void {
  clearPendingReturn();
  clearPendingAuthJourneyIntent();
}
