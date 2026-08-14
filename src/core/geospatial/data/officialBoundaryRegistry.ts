import type { Location } from "@/core/location/types";

export interface OfficialBoundaryAsset {
  source: {
    authority: string;
    reference: string;
    sourceUrl: string;
    quality: "minima" | "intermediaria" | "maxima";
    retrievedAt: string;
  };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: unknown;
  };
}

type OfficialBoundaryLoader = () => Promise<OfficialBoundaryAsset>;

const OFFICIAL_BOUNDARY_LOADERS: Record<string, OfficialBoundaryLoader> = {
  "/br/ba/salvador": () =>
    import("./brBaSalvadorMunicipality").then(
      ({ BR_BA_SALVADOR_MUNICIPALITY_BOUNDARY }) =>
        BR_BA_SALVADOR_MUNICIPALITY_BOUNDARY,
    ),
};

function normalizeGeographicPath(path: string): string {
  const normalized = `/${path.split("/").filter(Boolean).join("/")}`;
  return normalized.toLowerCase();
}

/**
 * Loads a small, versioned official boundary only when no canonical remote
 * geometry is available. Each geometry stays in its own lazy Vite chunk.
 */
export async function loadVersionedOfficialBoundary(
  location: Location,
): Promise<OfficialBoundaryAsset | null> {
  const loader =
    OFFICIAL_BOUNDARY_LOADERS[
      normalizeGeographicPath(location.geographic_path)
    ];
  return loader ? loader() : null;
}
