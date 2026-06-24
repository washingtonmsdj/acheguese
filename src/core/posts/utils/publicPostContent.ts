const TECHNICAL_SEED_PREFIX_PATTERN = /^\s*(?:\[(?:MOCK|SEED|DEV|TEST)[A-Z0-9_-]*\]\s*)+/i;

export function hasTechnicalSeedMarker(content: string | null | undefined): boolean {
  return TECHNICAL_SEED_PREFIX_PATTERN.test(content ?? "");
}

export function normalizePublicPostContent(content: string | null | undefined): string {
  return (content ?? "")
    .replace(TECHNICAL_SEED_PREFIX_PATTERN, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function getPublicPostPreview(
  content: string | null | undefined,
  maxLength: number,
  fallback = "Publicação da comunidade local.",
): string {
  const normalized = normalizePublicPostContent(content);
  if (!normalized) return fallback;
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1).trim()}...` : normalized;
}
