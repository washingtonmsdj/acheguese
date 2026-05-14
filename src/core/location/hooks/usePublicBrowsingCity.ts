import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { TERRITORY_CONFIG } from "@/config/territory";
import { useUserTerritory } from "@/core/location/hooks/useUserTerritory";

const STORAGE_KEY = "acheguese:last-browsing-city";

export interface PublicBrowsingCity {
  state: string;
  city: string;
  source: "url" | "selector" | "storage" | "account" | "default";
}

interface StoredBrowsingCity {
  state: string;
  city: string;
}

const PUBLIC_MODULE_PREFIXES = new Set([
  "empresas",
  "servicos",
  "gastronomia",
  "eventos",
  "classificados",
  "vagas",
  "buscar",
  "mapa",
  "pontos-turisticos",
  "educacao",
  "comunidade",
]);

function normalizeSlug(value: string): string {
  return value.trim().toLowerCase();
}

function readStoredCity(): StoredBrowsingCity | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredBrowsingCity>;
    if (!parsed.state || !parsed.city) return null;
    return {
      state: normalizeSlug(parsed.state),
      city: normalizeSlug(parsed.city),
    };
  } catch {
    return null;
  }
}

function writeStoredCity(value: StoredBrowsingCity): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

function parseCityFromPathname(pathname: string): StoredBrowsingCity | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  if (PUBLIC_MODULE_PREFIXES.has(parts[0])) {
    if (parts.length < 3) return null;
    const state = normalizeSlug(parts[1]);
    const city = normalizeSlug(parts[2]);
    if (!state || !city) return null;
    return { state, city };
  }

  const state = normalizeSlug(parts[0]);
  const city = normalizeSlug(parts[1]);
  if (!state || !city) return null;
  return { state, city };
}

function parseStateCityFromPublicPath(path: string): StoredBrowsingCity | null {
  const parts = path.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  return {
    state: normalizeSlug(parts[0]),
    city: normalizeSlug(parts[1]),
  };
}

export function usePublicBrowsingCity() {
  const { pathname } = useLocation();
  const { homeCity } = useUserTerritory();
  const [selectedCity, setSelectedCityState] = useState<StoredBrowsingCity | null>(null);

  const urlCity = useMemo(() => parseCityFromPathname(pathname), [pathname]);
  const storedCity = readStoredCity();
  const accountCity = useMemo(
    () => (homeCity ? parseStateCityFromPublicPath(homeCity.path) : null),
    [homeCity],
  );

  const active = useMemo<PublicBrowsingCity>(() => {
    if (urlCity) return { ...urlCity, source: "url" };
    if (selectedCity) return { ...selectedCity, source: "selector" };
    if (storedCity) return { ...storedCity, source: "storage" };
    if (accountCity) return { ...accountCity, source: "account" };
    return {
      state: TERRITORY_CONFIG.launch.state,
      city: TERRITORY_CONFIG.launch.city,
      source: "default",
    };
  }, [urlCity, selectedCity, storedCity, accountCity]);

  useEffect(() => {
    if (!urlCity) return;
    writeStoredCity(urlCity);
    setSelectedCityState((current) => {
      if (current?.state === urlCity.state && current.city === urlCity.city) return current;
      return urlCity;
    });
  }, [urlCity]);

  const setSelectedCity = useCallback((state: string, city: string) => {
    const normalized = { state: normalizeSlug(state), city: normalizeSlug(city) };
    writeStoredCity(normalized);
    setSelectedCityState(normalized);
  }, []);

  const cityBasePath = `/${active.state}/${active.city}`;

  return {
    active,
    cityBasePath,
    setSelectedCity,
  };
}
