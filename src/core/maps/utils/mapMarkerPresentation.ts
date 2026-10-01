import type { MapMarker } from "@/core/maps/types/core";
import { getBusinessCategoryLabel } from "@/shared/taxonomy/businessCategories";

function getMarkerCategory(marker: MapMarker): string | null {
  const category = marker.metadata?.category;
  return typeof category === "string" && category.trim() ? category.trim() : null;
}

export function getMapMarkerCategoryLabel(marker: MapMarker): string {
  const category = getMarkerCategory(marker);

  if (marker.type === "business" && category) {
    return getBusinessCategoryLabel(category);
  }

  const label = category ?? marker.type.replace(/_/g, " ");
  return label.charAt(0).toLocaleUpperCase("pt-BR") + label.slice(1);
}
