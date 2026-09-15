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

export function isPasswordRecoveryCallback(
  search: string,
  hash: string,
): boolean {
  const searchParams = parseParams(search);
  const hashParams = parseParams(hash);
  const values = [
    searchParams.get(AUTH_QUERY_KEYS.mode),
    searchParams.get(AUTH_QUERY_KEYS.type),
    hashParams.get(AUTH_QUERY_KEYS.mode),
    hashParams.get(AUTH_QUERY_KEYS.type),
  ];

  return values.some((value) => value === AUTH_QUERY_VALUES.recovery);
}

export function hasPasswordRecoverySessionMarker(
  search: string,
  hash: string,
): boolean {
  const hashParams = parseParams(hash);

  return (
    isPasswordRecoveryCallback(search, hash) ||
    hasPendingPkceCode(search) ||
    hashParams.has(AUTH_QUERY_KEYS.accessToken)
  );
}

/**
 * Classifica somente marcadores reais de retorno de autenticação.
 * Âncoras comuns da página (ex.: #main-content) não devem forçar o runtime
 * completo nem ser interpretadas como callback de OAuth/recovery.
 */
export function hasAuthCallbackMarker(search: string, hash: string): boolean {
  const searchParams = parseParams(search);
  const hashParams = parseParams(hash);

  return (
    hasPendingPkceCode(search) ||
    isPasswordRecoveryCallback(search, hash) ||
    searchParams.has(AUTH_QUERY_KEYS.accessToken) ||
    searchParams.has(AUTH_QUERY_KEYS.refreshToken) ||
    hashParams.has(AUTH_QUERY_KEYS.accessToken) ||
    hashParams.has(AUTH_QUERY_KEYS.refreshToken) ||
    getAuthCallbackError(search, hash) !== null
  );
}

export function isExpiredPasswordRecoveryError(
  search: string,
  hash: string,
): boolean {
  return (
    isPasswordRecoveryCallback(search, hash) &&
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
