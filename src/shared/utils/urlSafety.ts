import {
  ALLOWED_IMAGE_DATA_MIME_TYPES,
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_PROTOCOLS,
  ALLOWED_URL_PROTOCOLS,
  BLOCKED_IMAGE_EXTENSIONS,
  BLOCKED_URL_PROTOCOLS,
  INPUT_VALIDATION,
  type AllowedImageDataMimeType,
  type AllowedImageExtension,
  type AllowedImageProtocol,
  type AllowedURLProtocol,
  type BlockedImageExtension,
  type BlockedURLProtocol,
} from '@/shared/config/security.config';
import { logger } from '@/shared/utils/logger';
import { resolveMediaAssetReference } from '@/shared/media/mediaAssetReference';

interface UrlSafetyOptions {
  context?: string;
}

interface LinkSafetyOptions extends UrlSafetyOptions {
  allowInternal?: boolean;
}

const EXPLICIT_PROTOCOL_REGEX = /^[a-z][a-z\d+.-]*:/i;

function getCurrentOrigin(): string | undefined {
  if (typeof window === 'undefined' || !window.location?.origin) {
    return undefined;
  }

  return window.location.origin;
}

function normalizeUrlInput(rawUrl: string, context: string): string | null {
  const input = rawUrl.trim();

  if (!input || input.length > INPUT_VALIDATION.MAX_URL_LENGTH) {
    logger.warn('[urlSafety] URL vazia ou acima do limite', { context });
    return null;
  }

  if (hasControlCharacters(input)) {
    logger.warn('[urlSafety] URL com caracteres de controle bloqueada', { context });
    return null;
  }

  return input;
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

function isSafeRelativeUrl(input: string): boolean {
  return (input.startsWith('/') && !input.startsWith('//')) || input.startsWith('#');
}

function hasExplicitProtocol(input: string): boolean {
  return EXPLICIT_PROTOCOL_REGEX.test(input);
}

function parseUrl(input: string): URL | null {
  try {
    return new URL(input, getCurrentOrigin());
  } catch {
    return null;
  }
}

function hasBlockedProtocol(protocol: string): boolean {
  return BLOCKED_URL_PROTOCOLS.some((blocked) =>
    protocol.startsWith(blocked as BlockedURLProtocol),
  );
}

function hasAllowedLinkProtocol(protocol: string): boolean {
  return ALLOWED_URL_PROTOCOLS.some((allowed) =>
    protocol === (allowed as AllowedURLProtocol),
  );
}

function hasAllowedImageProtocol(protocol: string): boolean {
  return ALLOWED_IMAGE_PROTOCOLS.some((allowed) =>
    protocol === (allowed as AllowedImageProtocol),
  );
}

function getPathExtension(pathname: string): string | null {
  return pathname.toLowerCase().match(/\.[^./?#]+$/)?.[0] ?? null;
}

function isAllowedImageExtension(extension: string): boolean {
  return ALLOWED_IMAGE_EXTENSIONS.includes(extension as AllowedImageExtension);
}

function isBlockedImageExtension(extension: string): boolean {
  return BLOCKED_IMAGE_EXTENSIONS.includes(extension as BlockedImageExtension);
}

function isSafeImagePath(pathname: string): boolean {
  const extension = getPathExtension(pathname);
  if (!extension) return true;
  return isAllowedImageExtension(extension) && !isBlockedImageExtension(extension);
}

function isSafeImageDataUrl(input: string): boolean {
  const metadata = input.slice(0, input.indexOf(',')).toLowerCase();
  if (!metadata) return false;

  return ALLOWED_IMAGE_DATA_MIME_TYPES.some((mime) => {
    const typedMime = mime as AllowedImageDataMimeType;
    return metadata === `data:${typedMime}` || metadata === `data:${typedMime};base64`;
  });
}

export function isSafeLinkUrl(rawUrl: string, options: LinkSafetyOptions = {}): boolean {
  const context = options.context ?? 'link';
  const input = normalizeUrlInput(rawUrl, context);
  if (!input) return false;

  if (options.allowInternal && isSafeRelativeUrl(input)) {
    return true;
  }

  if (!hasExplicitProtocol(input)) {
    logger.warn('[urlSafety] Link sem protocolo explicito bloqueado', { context });
    return false;
  }

  const parsed = parseUrl(input);
  if (!parsed) {
    logger.warn('[urlSafety] URL invalida bloqueada', { context });
    return false;
  }

  const protocol = parsed.protocol.toLowerCase();
  if (hasBlockedProtocol(protocol)) {
    logger.warn('[urlSafety] Protocolo perigoso bloqueado', { protocol, context });
    return false;
  }

  if (!hasAllowedLinkProtocol(protocol)) {
    logger.warn('[urlSafety] Protocolo nao permitido bloqueado', { protocol, context });
    return false;
  }

  return true;
}

export function resolveSafeImageUrl(rawUrl: string, options: UrlSafetyOptions = {}): string | null {
  const context = options.context ?? 'image';
  const canonicalMediaUrl = resolveMediaAssetReference(rawUrl);
  const input = normalizeUrlInput(canonicalMediaUrl ?? rawUrl, context);
  if (!input) return null;

  if (isSafeRelativeUrl(input)) {
    return isSafeImagePath(input) ? input : null;
  }

  if (input.toLowerCase().startsWith('data:')) {
    if (isSafeImageDataUrl(input)) {
      return input;
    }

    logger.warn('[urlSafety] Data URL de imagem bloqueada', { context });
    return null;
  }

  const parsed = parseUrl(input);
  if (!parsed) {
    logger.warn('[urlSafety] URL de imagem invalida bloqueada', { context });
    return null;
  }

  const protocol = parsed.protocol.toLowerCase();
  if (!hasAllowedImageProtocol(protocol) || hasBlockedProtocol(protocol)) {
    logger.warn('[urlSafety] Protocolo de imagem bloqueado', { protocol, context });
    return null;
  }

  if (!isSafeImagePath(parsed.pathname)) {
    logger.warn('[urlSafety] Extensao de imagem bloqueada', { context });
    return null;
  }

  return parsed.href;
}

export function isSafeImageUrl(rawUrl: string, options: UrlSafetyOptions = {}): boolean {
  return resolveSafeImageUrl(rawUrl, options) !== null;
}
