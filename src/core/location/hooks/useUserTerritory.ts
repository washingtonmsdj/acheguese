/**
 * useUserTerritory
 *
 * Returns the user's "home" district and city using canonical UUIDs from
 * locations, never by plain string matching.
 *
 * Source of truth: user_residences.location_id (FK -> locations.id).
 * This keeps users stable even when territorial names are renamed.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/core/auth/hooks/useAuth";
import {
  LocationStatus,
  LocationType,
  type Location,
} from "@/core/location/types";
import { profileService } from "@/core/profiles/services/ProfileService";
import { createLocationRepository } from "../repositories/createLocationRepository";
import { residenceService } from "@/core/residence/services/ResidenceService";

interface ProfileTerritorySnapshot {
  location_id: string | null;
  neighborhood: string | null;
}

interface ResolvedTerritorySnapshot {
  district: {
    id: string;
    name: string;
    slug: string;
  } | null;
  city: {
    id: string;
    name: string;
    slug: string;
  } | null;
  state: {
    id: string;
    slug: string;
  } | null;
}

export interface UserTerritory {
  /** User district */
  homeDistrict: { id: string; name: string; path: string } | null;
  /** User city */
  homeCity: { id: string; name: string; path: string } | null;
  /** Whether the user has any resolved home territory */
  hasHome: boolean;
  /** Query loading state */
  loading: boolean;
}

interface UseUserTerritoryOptions {
  enabled?: boolean;
}

/** Converts geographic_path into public route path by removing /br prefix. */
function toPublicPath(geoPath: string): string {
  const parts = geoPath.split("/").filter(Boolean);
  if (parts.length === 0) return "/";

  const startsWithCountry = parts[0].toLowerCase() === "br";
  const publicParts = startsWithCountry ? parts.slice(1) : parts;

  return "/" + publicParts.join("/");
}

function buildCanonicalPublicPath(input: {
  stateSlug?: string | null;
  citySlug?: string | null;
  districtSlug?: string | null;
  fallbackPath?: string | null;
}): string {
  const stateSlug = (input.stateSlug ?? "").trim().toLowerCase();
  const citySlug = (input.citySlug ?? "").trim().toLowerCase();
  const districtSlug = (input.districtSlug ?? "").trim().toLowerCase();

  if (stateSlug && citySlug) {
    if (districtSlug) {
      return `/${stateSlug}/${citySlug}/${districtSlug}`;
    }
    return `/${stateSlug}/${citySlug}`;
  }

  if (input.fallbackPath) {
    return toPublicPath(input.fallbackPath);
  }

  return "/";
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function slugifyText(value: string): string {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  return normalized.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function resolveActiveCityForReference(
  repo: ReturnType<typeof createLocationRepository>,
  candidateCityId: string | null,
): Promise<Location | null> {
  if (!candidateCityId) return null;
  const city = await repo.findById(candidateCityId);
  if (!city || city.type !== LocationType.CITY) return null;

  if (city.status === LocationStatus.ACTIVE) {
    return city;
  }

  if (!city.parent_id) return null;
  const siblingCities = await repo.findChildren(city.parent_id, {
    type: LocationType.CITY,
    status: LocationStatus.ACTIVE,
    page: 1,
    page_size: 5000,
  });

  const bySlug = siblingCities.locations.find(
    (candidate) => candidate.slug === city.slug,
  );
  if (bySlug) return bySlug;

  return (
    siblingCities.locations.find(
      (candidate) => normalizeText(candidate.name) === normalizeText(city.name),
    ) ?? null
  );
}

async function resolveActiveDistrictForCity(
  repo: ReturnType<typeof createLocationRepository>,
  cityId: string,
  reference: { slug?: string | null; name?: string | null } | null,
) {
  if (!reference) return null;
  const slugHint = (reference.slug ?? "").trim().toLowerCase();
  const nameHint = (reference.name ?? "").trim();
  const normalizedNameHint = normalizeText(nameHint);

  const neighborhoods = await repo.findChildren(cityId, {
    type: LocationType.NEIGHBORHOOD,
    status: LocationStatus.ACTIVE,
    page: 1,
    page_size: 5000,
  });
  const districts = await repo.findChildren(cityId, {
    type: LocationType.DISTRICT,
    status: LocationStatus.ACTIVE,
    page: 1,
    page_size: 5000,
  });
  const localities = [...neighborhoods.locations, ...districts.locations];
  if (localities.length === 0) return null;

  if (slugHint) {
    const bySlug = localities.find((candidate) => candidate.slug === slugHint);
    if (bySlug) return bySlug;
  }

  if (normalizedNameHint) {
    const exact =
      localities.find(
        (candidate) => normalizeText(candidate.name) === normalizedNameHint,
      ) ?? null;
    if (exact) return exact;
  }

  if (normalizedNameHint) {
    return (
      localities.find((candidate) => {
        const normalizedCandidate = normalizeText(candidate.name);
        return (
          normalizedCandidate.includes(normalizedNameHint) ||
          normalizedNameHint.includes(normalizedCandidate)
        );
      }) ?? null
    );
  }

  return null;
}

async function resolveStateForCity(
  repo: ReturnType<typeof createLocationRepository>,
  cityParentId: string | null,
) {
  if (!cityParentId) return null;
  const maybeState = await repo.findById(cityParentId);
  if (!maybeState || maybeState.type !== LocationType.STATE) return null;

  return {
    id: maybeState.id,
    slug: maybeState.slug,
  };
}

export function useUserTerritory(
  options: UseUserTerritoryOptions = {},
): UserTerritory {
  const { user } = useAuth();
  const enabled = options.enabled ?? true;

  // 1) Load primary residence canonical location id.
  const { data: residence, isLoading: residenceLoading } = useQuery({
    queryKey: ["user-residence", "primary", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const data = await residenceService.getPrimaryResidence(user.id);
      if (!data?.location_id) return null;
      return { location_id: data.location_id } as { location_id: string };
    },
    enabled: enabled && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // 1.1) SSOT fallback from active profile and optional neighborhood hint.
  const { data: profileLocation, isLoading: profileLoading } = useQuery({
    queryKey: ["user-profile-location", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const profile = await profileService.getActiveProfile(user.id);
      if (!profile) return null;
      return {
        location_id: profile.location_id ?? null,
        neighborhood: profile.neighborhood ?? null,
      } as ProfileTerritorySnapshot;
    },
    enabled: enabled && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const effectiveLocationId =
    residence?.location_id ?? profileLocation?.location_id ?? null;

  // 2) Resolve district/city from canonical UUID. If location is city-level,
  // attempt district recovery from profile neighborhood to avoid city fallback.
  const { data: resolved, isLoading: locationLoading } =
    useQuery<ResolvedTerritorySnapshot | null>({
      queryKey: [
        "user-territory-resolved",
        effectiveLocationId,
        profileLocation?.neighborhood ?? null,
      ],
      queryFn: async () => {
        if (!effectiveLocationId) return null;
        const repo = createLocationRepository();

        const initialLocation = await repo.findById(effectiveLocationId);
        if (!initialLocation) return null;

        const location =
          initialLocation.status === LocationStatus.ACTIVE
            ? initialLocation
            : await (async () => {
                if (
                  initialLocation.type !== LocationType.CITY &&
                  initialLocation.type !== LocationType.DISTRICT &&
                  initialLocation.type !== LocationType.NEIGHBORHOOD
                ) {
                  return null;
                }

                if (initialLocation.type === LocationType.CITY) {
                  return resolveActiveCityForReference(
                    repo,
                    initialLocation.id,
                  );
                }

                const referenceCity = await resolveActiveCityForReference(
                  repo,
                  initialLocation.parent_id ?? null,
                );
                if (!referenceCity) return null;

                return resolveActiveDistrictForCity(repo, referenceCity.id, {
                  slug: initialLocation.slug,
                  name: initialLocation.name,
                });
              })();
        if (!location) return null;

        if (
          location.type === LocationType.DISTRICT ||
          location.type === LocationType.NEIGHBORHOOD
        ) {
          const city = location.parent_id
            ? await repo.findById(location.parent_id)
            : null;
          const activeCity = await resolveActiveCityForReference(
            repo,
            city?.id ?? null,
          );
          if (!activeCity) return null;
          const state = await resolveStateForCity(repo, activeCity.parent_id);
          return {
            district: {
              id: location.id,
              name: location.name,
              slug: location.slug,
            },
            city: {
              id: activeCity.id,
              name: activeCity.name,
              slug: activeCity.slug,
            },
            state,
          };
        }

        if (location.type === LocationType.CITY) {
          const activeCity = await resolveActiveCityForReference(
            repo,
            location.id,
          );
          if (!activeCity) return null;

          const state = await resolveStateForCity(repo, activeCity.parent_id);
          const neighborhoodHint = (profileLocation?.neighborhood ?? "").trim();
          if (!neighborhoodHint) {
            return {
              district: null,
              city: {
                id: activeCity.id,
                name: activeCity.name,
                slug: activeCity.slug,
              },
              state,
            };
          }

          const slugHint = slugifyText(neighborhoodHint);
          if (slugHint) {
            const bySlug = await repo.findBySlugWithinParent(
              slugHint,
              activeCity.id,
            );
            if (
              bySlug &&
              (bySlug.type === LocationType.NEIGHBORHOOD ||
                bySlug.type === LocationType.DISTRICT)
            ) {
              return {
                district: {
                  id: bySlug.id,
                  name: bySlug.name,
                  slug: bySlug.slug,
                },
                city: {
                  id: activeCity.id,
                  name: activeCity.name,
                  slug: activeCity.slug,
                },
                state,
              };
            }
          }

          const neighborhoods = await repo.findChildren(activeCity.id, {
            type: LocationType.NEIGHBORHOOD,
            status: LocationStatus.ACTIVE,
            page: 1,
            page_size: 300,
          });
          const children =
            neighborhoods.locations.length > 0
              ? neighborhoods
              : await repo.findChildren(activeCity.id, {
                  type: LocationType.DISTRICT,
                  status: LocationStatus.ACTIVE,
                  page: 1,
                  page_size: 300,
                });

          const normalizedHint = normalizeText(neighborhoodHint);
          const exactMatch =
            children.locations.find(
              (candidate) => normalizeText(candidate.name) === normalizedHint,
            ) ?? null;
          if (exactMatch) {
            return {
              district: {
                id: exactMatch.id,
                name: exactMatch.name,
                slug: exactMatch.slug,
              },
              city: {
                id: activeCity.id,
                name: activeCity.name,
                slug: activeCity.slug,
              },
              state,
            };
          }

          const partialMatch =
            children.locations.find((candidate) => {
              const normalizedName = normalizeText(candidate.name);
              return (
                normalizedName.includes(normalizedHint) ||
                normalizedHint.includes(normalizedName)
              );
            }) ?? null;
          return {
            district: partialMatch
              ? {
                  id: partialMatch.id,
                  name: partialMatch.name,
                  slug: partialMatch.slug,
                }
              : null,
            city: {
              id: activeCity.id,
              name: activeCity.name,
              slug: activeCity.slug,
            },
            state,
          };
        }

        return null;
      },
      enabled: enabled && !!effectiveLocationId,
      staleTime: 10 * 60 * 1000,
    });

  return useMemo(() => {
    if (!enabled)
      return {
        homeDistrict: null,
        homeCity: null,
        hasHome: false,
        loading: false,
      };
    const loading = residenceLoading || profileLoading || locationLoading;

    if (!user)
      return {
        homeDistrict: null,
        homeCity: null,
        hasHome: false,
        loading: false,
      };
    if (loading)
      return {
        homeDistrict: null,
        homeCity: null,
        hasHome: false,
        loading: true,
      };
    if (!resolved)
      return {
        homeDistrict: null,
        homeCity: null,
        hasHome: false,
        loading: false,
      };

    const { district, city, state } = resolved;

    return {
      homeDistrict: district
        ? {
            id: district.id,
            name: district.name,
            path: buildCanonicalPublicPath({
              stateSlug: state?.slug,
              citySlug: city?.slug,
              districtSlug: district.slug,
            }),
          }
        : null,
      homeCity: city
        ? {
            id: city.id,
            name: city.name,
            path: buildCanonicalPublicPath({
              stateSlug: state?.slug,
              citySlug: city.slug,
            }),
          }
        : null,
      hasHome: Boolean(district || city),
      loading: false,
    };
  }, [
    enabled,
    user,
    resolved,
    residenceLoading,
    profileLoading,
    locationLoading,
  ]);
}
