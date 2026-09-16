import {
  AUTH_EMAIL_CONFIRMATION_INTENTS,
  AUTH_FLOW_STORAGE_KEYS,
  AUTH_FLOW_TTL_MS,
  AUTH_JOURNEY_INTENTS,
  AUTH_PASSWORD_RECOVERY_RESEND_COOLDOWN_MS,
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

function clearPendingSignupRedirect(): void {
  clearAuthFlowSessionValue(AUTH_FLOW_STORAGE_KEYS.pendingSignupRedirect);
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

function clearPasswordRecoveryResendCooldown(): void {
  clearAuthFlowSessionValue(AUTH_FLOW_STORAGE_KEYS.passwordRecoveryResendEmail);
  clearAuthFlowSessionValue(
    AUTH_FLOW_STORAGE_KEYS.passwordRecoveryResendCooldownUntil,
  );
}

function getPasswordRecoveryResendCooldownUntil(): number | null {
  const stored = getAuthFlowSessionValue(
    AUTH_FLOW_STORAGE_KEYS.passwordRecoveryResendCooldownUntil,
  );
  if (!stored) return null;

  const value = Number(stored);
  if (!Number.isFinite(value) || value <= 0) {
    clearPasswordRecoveryResendCooldown();
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
 * Persiste o cooldown da recuperação para o e-mail efetivamente enviado. Isso
 * evita reload como bypass visual sem bloquear a correção para outro endereço.
 * O servidor continua sendo a autoridade do rate limit.
 */
export function startPasswordRecoveryResendCooldown(
  email: string,
  now = Date.now(),
): void {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return;

  setAuthFlowSessionValue(
    AUTH_FLOW_STORAGE_KEYS.passwordRecoveryResendEmail,
    normalizedEmail,
    AUTH_FLOW_TTL_MS.passwordRecovery,
  );
  setAuthFlowSessionValue(
    AUTH_FLOW_STORAGE_KEYS.passwordRecoveryResendCooldownUntil,
    String(now + AUTH_PASSWORD_RECOVERY_RESEND_COOLDOWN_MS),
    AUTH_FLOW_TTL_MS.passwordRecovery,
  );
}

/**
 * Retorna cooldown somente quando o e-mail atual é o mesmo da tentativa que o
 * iniciou. Regressão de relógio nunca amplia a janela além do limite canônico.
 */
export function getPasswordRecoveryResendRemainingMs(
  email: string,
  now = Date.now(),
): number {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return 0;

  const storedEmail = getAuthFlowSessionValue(
    AUTH_FLOW_STORAGE_KEYS.passwordRecoveryResendEmail,
  );
  if (!storedEmail || normalizeEmail(storedEmail) !== normalizedEmail) return 0;

  const cooldownUntil = getPasswordRecoveryResendCooldownUntil();
  if (cooldownUntil === null) return 0;

  return Math.min(
    AUTH_PASSWORD_RECOVERY_RESEND_COOLDOWN_MS,
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

/**
 * Prepara o gate legal para qualquer sessão já autenticada que volte a uma
 * superfície de login. O destino permanece seguro e a tela de termos decide,
 * de forma autoritativa, se há aceite vigente antes de continuar.
 */
export function prepareAuthenticatedLoginTermsCheck(returnTo: string): void {
  clearPendingSignupContext();
  setPendingAuthJourneyIntent(AUTH_JOURNEY_INTENTS.login);
  setPendingReturn(returnTo);
}

/** Prepara uma tentativa de login Google sem carregar contexto de cadastro antigo. */
export function prepareGoogleLogin(returnTo: string): void {
  prepareAuthenticatedLoginTermsCheck(returnTo);
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
 * A confirmação por e-mail encerra o estado sensível da confirmação, mas mantém
 * o destino original até o primeiro acesso. Isso vale tanto para cadastro novo
 * quanto para uma conta ainda não confirmada descoberta durante o login.
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
