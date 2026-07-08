export const AI_TEXT_REQUEST_LIMITS = {
  maxMessages: 20,
  maxRequestBytes: 60_000,
  maxTokens: 4096,
  maxTemperature: 2,
} as const;

export const AI_VISION_REQUEST_LIMITS = {
  maxImages: 6,
  maxPromptChars: 4000,
  maxImageReferenceChars: 120_000,
  maxRequestBytes: 180_000,
} as const;

export const AI_IMAGE_REQUEST_LIMITS = {
  maxReferenceImages: 4,
  maxPromptChars: 4000,
  maxNegativePromptChars: 2000,
  maxRequestBytes: 120_000,
} as const;

export const AI_RATE_LIMITS = {
  text: { maxRequests: 30, windowMs: 60_000 },
  vision: { maxRequests: 20, windowMs: 60_000 },
  image: { maxRequests: 10, windowMs: 60_000 },
  tryOnGenerate: { maxRequests: 5, windowMs: 60_000 },
} as const;

const ALLOWED_TEXT_MESSAGE_ROLES = new Set(["system", "user", "assistant"]);
const BLOCKED_IMAGE_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);
const ALLOWED_DATA_IMAGE_PATTERN = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([a-z0-9+/=\s]+)$/i;
const TOOL_NAME_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

export function jsonByteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

export function isAllowedImageReference(value: string): boolean {
  if (value.length > AI_VISION_REQUEST_LIMITS.maxImageReferenceChars) return false;

  if (value.startsWith("data:")) {
    return ALLOWED_DATA_IMAGE_PATTERN.test(value);
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !isBlockedImageHost(parsed.hostname);
  } catch {
    return false;
  }
}

export function isAllowedTryOnProductImageReference(
  value: string,
  userId: string,
  supabaseUrl: string,
): boolean {
  if (!isAllowedImageReference(value) || value.startsWith("data:")) return false;

  try {
    const parsed = new URL(value);
    const supabaseOrigin = new URL(supabaseUrl).origin;
    const expectedPathPrefix = `/storage/v1/object/public/tryon/${userId}/inputs/`;

    return parsed.origin === supabaseOrigin &&
      parsed.search === "" &&
      parsed.hash === "" &&
      parsed.pathname.startsWith(expectedPathPrefix) &&
      parsed.pathname.length > expectedPathPrefix.length &&
      !parsed.pathname.includes("..");
  } catch {
    return false;
  }
}

export function dataUrlToImageBytes(dataUrl: string): { bytes: Uint8Array; mime: string } {
  const match = dataUrl.match(ALLOWED_DATA_IMAGE_PATTERN);
  if (!match) throw new Error("data URL de imagem invalida");

  const mime = match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase();
  const binary = atob(match[2].replace(/\s/g, ""));
  return {
    bytes: Uint8Array.from(binary, (char) => char.charCodeAt(0)),
    mime,
  };
}

export function hasAllowedTextMessages(messages: unknown[]): boolean {
  return messages.every((message) => {
    if (!message || typeof message !== "object") return false;
    const record = message as Record<string, unknown>;
    return typeof record.role === "string" &&
      ALLOWED_TEXT_MESSAGE_ROLES.has(record.role) &&
      record.content !== undefined;
  });
}

export function hasAllowedToolSchema(schema: unknown): boolean {
  if (schema === undefined) return true;
  if (!schema || typeof schema !== "object") return false;

  const record = schema as Record<string, unknown>;
  return typeof record.name === "string" &&
    TOOL_NAME_PATTERN.test(record.name) &&
    (record.description === undefined || typeof record.description === "string") &&
    !!record.parameters &&
    typeof record.parameters === "object" &&
    !Array.isArray(record.parameters);
}

function isBlockedImageHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (BLOCKED_IMAGE_HOSTS.has(normalized)) return true;

  const ipv4Match = normalized.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4Match) return false;

  const octets = ipv4Match.slice(1).map(Number);
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return true;

  const [first, second] = octets;
  return first === 10 ||
    first === 127 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 169 && second === 254);
}
