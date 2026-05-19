export const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
} as const;

export type BrasilShowcaseCity = {
  id: string;
  name: string;
  slug: string;
  geographic_path: string;
  type: string;
};

export type BrasilShowcaseLocation = {
  geographic_path?: string | null;
  type?: string | null;
};

export type StateGroup<TCity extends BrasilShowcaseCity = BrasilShowcaseCity> = {
  slug: string;
  cities: TCity[];
};

export function buildBrasilSearchUrl(query: string): string | null {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return null;

  return `/busca?q=${encodeURIComponent(normalizedQuery)}&scope=brasil`;
}

export function filterVerifiedBusinesses<TBusiness extends { is_verified?: boolean; is_premium?: boolean }>(
  businesses: TBusiness[],
): TBusiness[] {
  return businesses.filter((business) => business.is_verified || business.is_premium);
}

export function getBrasilShowcaseHomeUrl(activeLocation: BrasilShowcaseLocation | null | undefined): string {
  if (!activeLocation?.geographic_path) return "/";

  const path = activeLocation.geographic_path.replace(/^\/br/, "");

  if (activeLocation.type === "district") {
    const parts = path.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return `/${parts[0]}/${parts[1]}`;
    }
  }

  return path || "/";
}

export function groupCitiesByState<TCity extends BrasilShowcaseCity>(cities: TCity[]): Array<StateGroup<TCity>> {
  const stateGroups = cities.reduce<Map<string, StateGroup<TCity>>>((acc, city) => {
    const parts = city.geographic_path.split("/").filter(Boolean);
    const stateSlug = parts[1];
    if (!stateSlug) return acc;

    const existing = acc.get(stateSlug);
    if (!existing) {
      acc.set(stateSlug, { slug: stateSlug, cities: [city] });
    } else {
      existing.cities.push(city);
    }

    return acc;
  }, new globalThis.Map<string, StateGroup<TCity>>());

  return [...stateGroups.values()];
}
