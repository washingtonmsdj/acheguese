type LocationLike = {
  id?: string;
  name?: string;
  type?: string;
  geographic_path?: string | null;
} | null;

type ProfileLike = {
  city?: string | null;
  neighborhood?: string | null;
  locationId?: string | null;
  location_id?: string | null;
} | null;

function formatSlug(slug?: string): string {
  if (!slug) return "";
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildCommunityTerritoryPresentation(params: {
  resolvedLocation: LocationLike;
  activeLocation: LocationLike;
  profile: ProfileLike;
}): {
  city: string;
  neighborhood?: string;
  locationId?: string;
} {
  const locationForUi = params.resolvedLocation ?? params.activeLocation;
  const pathParts = locationForUi?.geographic_path?.split("/").filter(Boolean) ?? [];

  const city =
    locationForUi?.type === "city"
      ? locationForUi.name || ""
      : locationForUi?.type === "district"
      ? formatSlug(pathParts[2]) || params.profile?.city || ""
      : formatSlug(pathParts[2]) || params.profile?.city || "";

  const neighborhood =
    locationForUi?.type === "district"
      ? locationForUi.name
      : params.profile?.neighborhood || undefined;

  const locationId =
    locationForUi?.type === "district"
      ? locationForUi.id
      : params.profile?.locationId ?? params.profile?.location_id ?? undefined;

  return {
    city,
    neighborhood: neighborhood || undefined,
    locationId: locationId ?? undefined,
  };
}
