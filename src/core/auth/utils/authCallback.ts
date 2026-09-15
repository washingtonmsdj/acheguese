import {
  AUTH_PATHS,
  AUTH_QUERY_KEYS,
  AUTH_QUERY_VALUES,
} from "@/core/auth/constants/authFlow";

export interface AuthCallbackError {
  error: string;
  errorCode: string;
}

function parseParams(raw: string): URLSearchParams {
  if (!raw) return new URLSearchParams();
  return new URLSearchParams(
    raw.startsWith("?") || raw.startsWith("#") ? raw.slice(1) : raw,
  );
}

export function getAuthCallbackError(
  search: string,
  hash: string,
): AuthCallbackError | null {
  const searchParams = parseParams(search);
  const hashParams = parseParams(hash);

  const error =
    searchParams.get(AUTH_QUERY_KEYS.error) ??
    hashParams.get(AUTH_QUERY_KEYS.error) ??
    "";
  const errorCode =
    searchParams.get(AUTH_QUERY_KEYS.errorCode) ??
    hashParams.get(AUTH_QUERY_KEYS.errorCode) ??
    "";

  return error || errorCode ? { error, errorCode } : null;
}

/**
 * Código de autorização PKCE que ainda não foi consumido pelo cliente Supabase.
 * O SDK remove `code` da URL somente depois de uma troca concluída, então este
 * marcador também impede que uma sessão preexistente seja confundida com o
 * resultado do callback atual.
 */
export function hasPendingPkceCode(search: string): boolean {
  return parseParams(search).has(AUTH_QUERY_KEYS.code);
}

/**
 * Troca de autenticação ainda representada na URL. Além do `code` PKCE,
 * reconhece retornos implícitos com access/refresh token para manter callbacks
 * compatíveis com links emitidos por versões anteriores do cliente Supabase.
 * A regra não pressupõe que uma sessão já persistida pertença ao callback atual.
 */
export function hasPendingAuthCallbackExchange(
  search: string,
  hash: string,
): boolean {
  const searchParams = parseParams(search);
  const hashParams = parseParams(hash);

  return (
    searchParams.has(AUTH_QUERY_KEYS.code) ||
    hashParams.has(AUTH_QUERY_KEYS.code) ||
    searchParams.has(AUTH_QUERY_KEYS.accessToken) ||
    searchParams.has(AUTH_QUERY_KEYS.refreshToken) ||
    hashParams.has(AUTH_QUERY_KEYS.accessToken) ||
    hashParams.has(AUTH_QUERY_KEYS.refreshToken)
  );
}

/**
 * Contexto de navegação da tela de recuperação. `mode=recovery` é gerado pelo
 * próprio app no redirectTo e, isoladamente, não prova que o navegador acabou
 * de retornar do Supabase Auth. `type=recovery` também participa deste contexto,
 * mas é emitido pelo provider nos callbacks implícitos legados.
 */
export function isPasswordRecoveryRouteIntent(
  search: string,
  hash: string,
): boolean {
  const searchParams = parseParams(search);
  const hashParams = parseParams(hash);

  return [
    searchParams.get(AUTH_QUERY_KEYS.mode),
    searchParams.get(AUTH_QUERY_KEYS.type),
    hashParams.get(AUTH_QUERY_KEYS.mode),
    hashParams.get(AUTH_QUERY_KEYS.type),
  ].some((value) => value === AUTH_QUERY_VALUES.recovery);
}

/**
 * Evidência de que a navegação atual é um callback de recuperação.
 *
 * `mode=recovery` sozinho é apenas intenção de rota. Ele só se torna callback
 * quando existe uma troca Auth (`code`/tokens) ou um erro retornado pelo Auth.
 * `type=recovery` é aceito como marcador explícito dos callbacks implícitos
 * legados, mas não concede autoridade para redefinir senha por si só.
 */
export function isPasswordRecoveryCallback(
  search: string,
  hash: string,
): boolean {
  const searchParams = parseParams(search);
  const hashParams = parseParams(hash);
  const hasExplicitRecoveryType =
    searchParams.get(AUTH_QUERY_KEYS.type) === AUTH_QUERY_VALUES.recovery ||
    hashParams.get(AUTH_QUERY_KEYS.type) === AUTH_QUERY_VALUES.recovery;
  const hasRecoveryMode =
    searchParams.get(AUTH_QUERY_KEYS.mode) === AUTH_QUERY_VALUES.recovery ||
    hashParams.get(AUTH_QUERY_KEYS.mode) === AUTH_QUERY_VALUES.recovery;

  if (hasExplicitRecoveryType) return true;
  if (!hasRecoveryMode) return false;

  return (
    hasPendingAuthCallbackExchange(search, hash) ||
    getAuthCallbackError(search, hash) !== null
  );
}

/**
 * Classifica somente marcadores reais de retorno de autenticação.
 * Âncoras comuns da página (ex.: #main-content) e flags de intenção de rota
 * (ex.: `mode=recovery` isolado) não devem forçar o runtime completo.
 */
export function hasAuthCallbackMarker(search: string, hash: string): boolean {
  return (
    hasPendingAuthCallbackExchange(search, hash) ||
    isPasswordRecoveryCallback(search, hash) ||
    getAuthCallbackError(search, hash) !== null
  );
}

export function isExpiredPasswordRecoveryError(
  search: string,
  hash: string,
): boolean {
  return (
    isPasswordRecoveryRouteIntent(search, hash) &&
    getAuthCallbackError(search, hash)?.errorCode === AUTH_QUERY_VALUES.expiredOtp
  );
}

export function isOAuthTermsCallbackError(
  pathname: string,
  search: string,
  hash: string,
): boolean {
  return (
    pathname === AUTH_PATHS.termsAcceptance &&
    getAuthCallbackError(search, hash) !== null
  );
}
