import type { MapMarker } from "@/core/maps/types/core";
import { getBusinessCategoryLabel } from "@/shared/taxonomy/businessCategories";

export function getMapMarkerCategory(marker: MapMarker): string | null {
  const category = marker.metadata?.category;
  return typeof category === "string" && category.trim() ? category.trim() : null;
}

export function getMapCategoryLabel(category: string): string {
  return getBusinessCategoryLabel(category);
}

export function getMapMarkerCategoryLabel(marker: MapMarker): string {
  const category = getMapMarkerCategory(marker);

  if (marker.type === "business" && category) {
    return getMapCategoryLabel(category);
  }

  const label = category ?? marker.type.replace(/_/g, " ");
  return label.charAt(0).toLocaleUpperCase("pt-BR") + label.slice(1);
}
