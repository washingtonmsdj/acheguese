import {
  AUTH_PATHS,
  AUTH_QUERY_KEYS,
} from "@/core/auth/constants/authFlow";

export interface AuthCallbackError {
  error: string;
  errorCode: string;
}

function parseParams(raw: string): URLSearchParams {
  if (!raw) return new URLSearchParams();
  return new URLSearchParams(raw.startsWith("?") || raw.startsWith("#") ? raw.slice(1) : raw);
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

  return values.some((value) => value === "recovery");
}

export function isExpiredPasswordRecoveryError(
  search: string,
  hash: string,
): boolean {
  return getAuthCallbackError(search, hash)?.errorCode === "otp_expired";
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
