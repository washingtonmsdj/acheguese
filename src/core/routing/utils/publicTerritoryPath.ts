type ParsedPublicTerritoryPath = {
  state?: string;
  city?: string;
  territorySlug?: string;
};

function isStateSegment(value: string | undefined): boolean {
  return Boolean(value && /^[a-z]{2}$/i.test(value));
}

export function parsePublicTerritoryPath(pathname: string): ParsedPublicTerritoryPath {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) return {};

  const offset = isStateSegment(parts[0]) ? 0 : 1;
  const state = parts[offset];
  const city = parts[offset + 1];
  const territorySlug = parts[offset + 2];

  if (!isStateSegment(state) || !city) {
    return {};
  }

  return { state, city, territorySlug };
}
