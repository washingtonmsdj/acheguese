const TECHNICAL_SEED_PREFIXES = ["MOCK", "SEED", "DEV", "TEST"] as const;

function findTechnicalSeedPrefixEnd(value: string): number {
  let cursor = 0;

  while (cursor < value.length && value.charCodeAt(cursor) <= 32) cursor += 1;

  let lastMatchEnd = cursor;
  let matched = false;

  while (value[cursor] === "[") {
    const closing = value.indexOf("]", cursor + 1);
    if (closing === -1) break;

    const marker = value.slice(cursor + 1, closing).toUpperCase();
    const isSeedMarker = TECHNICAL_SEED_PREFIXES.some((prefix) => marker.startsWith(prefix));
    if (!isSeedMarker) break;

    cursor = closing + 1;
    while (cursor < value.length && value.charCodeAt(cursor) <= 32) cursor += 1;
    lastMatchEnd = cursor;
    matched = true;
  }

  return matched ? lastMatchEnd : 0;
}

export function hasTechnicalSeedMarker(content: string | null | undefined): boolean {
  return findTechnicalSeedPrefixEnd(content ?? "") > 0;
}

export function normalizePublicPostContent(content: string | null | undefined): string {
  const value = content ?? "";
  const prefixEnd = findTechnicalSeedPrefixEnd(value);
  return value.slice(prefixEnd).replace(/\s+/g, " ").trim();
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
