import { INPUT_VALIDATION } from '@/config/security.config';
import { logger } from '@/shared/utils/logger';

type PublicEnv = Partial<Record<string, string>>;

export interface SafeRedirectOptions {
  allowedOrigins?: readonly string[];
  allowRelative?: boolean;
  allowAnyHttpOrigin?: boolean;
  context?: string;
}

const publicEnv = ((import.meta as ImportMeta & { env?: PublicEnv }).env ?? {}) as PublicEnv;

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

function isRelativeUrl(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//');
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
      ...parseOriginList(publicEnv[envKey]),
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

  if (isRelativeUrl(input)) {
    if (!allowRelative) return null;
    return input;
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
