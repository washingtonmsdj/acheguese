import { INPUT_VALIDATION } from '@/shared/config/security.config';
import { logger } from '@/shared/utils/logger';
import { getRecordValue } from '@/shared/utils/recordLookup';

type PublicEnv = Partial<Record<string, string>>;

export interface SafeRedirectOptions {
  allowedOrigins?: readonly string[];
  allowRelative?: boolean;
  allowAnyHttpOrigin?: boolean;
  context?: string;
}

export interface SafeHttpUrlOptions {
  context?: string;
  forceHttps?: boolean;
}

const publicEnv = ((import.meta as ImportMeta & { env?: PublicEnv }).env ?? {}) as PublicEnv;
const EXPLICIT_PROTOCOL_REGEX = /^[a-z][a-z\d+.-]*:/i;
const LEADING_NETWORK_PATH_REGEX = /^[\\/]{2}/;
const ENCODED_PATH_SEPARATOR_REGEX = /%(?:25)*(?:2f|5c)/i;
const INTERNAL_PATH_DECODE_PASSES = 2;

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

function getCurrentOrigin(): string {
  if (typeof window === 'undefined' || !window.location?.origin) return '';
  return normalizeOrigin(window.location.origin);
}

function parseOriginList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);
}

function getPathnameCandidate(value: string): string {
  const boundary = value.search(/[?#]/);
  return boundary >= 0 ? value.slice(0, boundary) : value;
}

function hasUnsafeInternalPathSyntax(value: string): boolean {
  let pathname = getPathnameCandidate(value);

  for (let pass = 0; pass <= INTERNAL_PATH_DECODE_PASSES; pass += 1) {
    if (
      pathname.includes('\\') ||
      LEADING_NETWORK_PATH_REGEX.test(pathname) ||
      ENCODED_PATH_SEPARATOR_REGEX.test(pathname)
    ) {
      return true;
    }

    if (pass === INTERNAL_PATH_DECODE_PASSES) break;

    try {
      const decoded = decodeURIComponent(pathname);
      if (decoded === pathname) break;
      pathname = decoded;
    } catch {
      return true;
    }
  }

  return false;
}

function isRelativeUrl(value: string): boolean {
  return value.startsWith('/') && !hasUnsafeInternalPathSyntax(value);
}

function hasControlCharacters(input: string): boolean {
  for (let index = 0; index < input.length; index += 1) {
    const charCode = input.charCodeAt(index);
    if (charCode <= 31 || charCode === 127) {
      return true;
    }
  }

  return false;
}

function hasExplicitProtocol(input: string): boolean {
  return EXPLICIT_PROTOCOL_REGEX.test(input);
}

export function getAllowedRedirectOriginsFromEnv(
  envKey: string,
  defaults: readonly string[] = [],
): string[] {
  const currentOrigin = getCurrentOrigin();
  return Array.from(
    new Set([
      currentOrigin,
      ...defaults.map(normalizeOrigin),
      ...parseOriginList(getRecordValue(publicEnv, envKey)),
    ].filter(Boolean)),
  );
}

export function resolveSafeRedirectUrl(
  rawUrl: string,
  options: SafeRedirectOptions = {},
): string | null {
  const input = rawUrl.trim();
  const currentOrigin = getCurrentOrigin();
  const allowRelative = options.allowRelative ?? true;

  if (!input || input.length > INPUT_VALIDATION.MAX_URL_LENGTH) {
    logger.warn('[safeRedirect] URL vazia ou acima do limite', { context: options.context });
    return null;
  }

  if (hasControlCharacters(input)) {
    logger.warn('[safeRedirect] URL com caracteres de controle bloqueada', { context: options.context });
    return null;
  }

  if (isRelativeUrl(input)) {
    if (!allowRelative) return null;
    return input;
  }

  if (input.startsWith('/') || input.startsWith('\\')) {
    logger.warn('[safeRedirect] Caminho relativo inseguro bloqueado', {
      context: options.context,
    });
    return null;
  }

  try {
    const parsed = new URL(input, currentOrigin || undefined);

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      logger.warn('[safeRedirect] Protocolo bloqueado', { protocol: parsed.protocol, context: options.context });
      return null;
    }

    if (currentOrigin && parsed.origin === currentOrigin) {
      return parsed.href;
    }

    if (options.allowAnyHttpOrigin) {
      return parsed.href;
    }

    const allowedOrigins = new Set((options.allowedOrigins ?? []).map(normalizeOrigin));
    if (allowedOrigins.has(parsed.origin)) {
      return parsed.href;
    }

    logger.warn('[safeRedirect] Origem bloqueada', { origin: parsed.origin, context: options.context });
    return null;
  } catch {
    logger.warn('[safeRedirect] URL invalida', { context: options.context });
    return null;
  }
}

export function resolveSafeHttpUrl(
  rawUrl: string | null | undefined,
  options: SafeHttpUrlOptions = {},
): string | null {
  const input = (rawUrl ?? '').trim();
  const context = options.context ?? 'safe-http-url';

  if (!input || input.length > INPUT_VALIDATION.MAX_URL_LENGTH) {
    logger.warn('[safeRedirect] URL HTTP vazia ou acima do limite', { context });
    return null;
  }

  if (hasControlCharacters(input) || input.startsWith('/')) {
    logger.warn('[safeRedirect] URL HTTP invalida bloqueada', { context });
    return null;
  }

  if (hasExplicitProtocol(input) && !/^https?:/i.test(input)) {
    logger.warn('[safeRedirect] Protocolo HTTP bloqueado', { context });
    return null;
  }

  const candidate = /^https?:/i.test(input) ? input : `https://${input}`;
  const safeUrl = resolveSafeRedirectUrl(candidate, {
    allowRelative: false,
    allowAnyHttpOrigin: true,
    context,
  });

  if (!safeUrl) return null;

  try {
    const parsed = new URL(safeUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    if (options.forceHttps ?? true) {
      parsed.protocol = 'https:';
    }

    return parsed.href;
  } catch {
    logger.warn('[safeRedirect] URL HTTP invalida', { context });
    return null;
  }
}

export function resolveSafeInternalPath(rawUrl: unknown, fallback = '/'): string {
  const fallbackPath = typeof fallback === 'string' && isRelativeUrl(fallback) ? fallback : '/';
  if (typeof rawUrl !== 'string') return fallbackPath;

  const input = rawUrl.trim();
  if (
    !input ||
    input.length > INPUT_VALIDATION.MAX_URL_LENGTH ||
    hasControlCharacters(input)
  ) {
    return fallbackPath;
  }

  if (isRelativeUrl(input)) {
    return input;
  }

  const currentOrigin = getCurrentOrigin();
  if (!currentOrigin) return fallbackPath;

  try {
    const parsed = new URL(input);
    if (parsed.origin !== currentOrigin) return fallbackPath;

    const internalPath = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return isRelativeUrl(internalPath) ? internalPath : fallbackPath;
  } catch {
    return fallbackPath;
  }
}

export function navigateToSafeRedirect(rawUrl: string, options: SafeRedirectOptions = {}): boolean {
  const safeUrl = resolveSafeRedirectUrl(rawUrl, options);
  if (!safeUrl || typeof window === 'undefined') return false;
  window.location.assign(safeUrl);
  return true;
}

export function openSafeExternalUrl(rawUrl: string, options: SafeRedirectOptions = {}): boolean {
  const safeUrl = resolveSafeRedirectUrl(rawUrl, {
    ...options,
    allowRelative: false,
    allowAnyHttpOrigin: options.allowAnyHttpOrigin ?? true,
  });

  if (!safeUrl || typeof window === 'undefined') return false;

  window.open(safeUrl, '_blank', 'noopener,noreferrer');
  return true;
}

export function openSafeUrlInNewTab(rawUrl: string, options: SafeRedirectOptions = {}): boolean {
  const safeUrl = resolveSafeRedirectUrl(rawUrl, options);
  if (!safeUrl || typeof window === 'undefined') return false;

  window.open(safeUrl, '_blank', 'noopener,noreferrer');
  return true;
}
