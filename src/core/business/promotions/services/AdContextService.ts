/**
 * Builds ad eligibility context from the canonical location foundation.
 *
 * This service reads the active location from LocationContextStore, resolves
 * the parent city for local territories, and accepts a profile fallback
 * location. It never uses free-form neighborhood/city strings and does not use
 * CoverageService.
 */

import { locationContextStore } from "@/core/location/stores/LocationContextStore";
import { LocationService } from "@/core/location/services/LocationService";
import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import type { ILocationRepository } from "@/core/location/repositories/ILocationRepository";
import type { Location } from "@/core/location/types";
import type { AdEligibilityContext } from "../types";

export class AdContextService {
  private locationService: LocationService;

  constructor(locationRepository: ILocationRepository = createLocationRepository()) {
    this.locationService = new LocationService(locationRepository);
  }

  /**
   * Builds the eligibility context for ad resolution.
   *
   * @param fallbackLocationId - profile primary_location_id when available
   */
  async buildContext(fallbackLocationId?: string | null): Promise<AdEligibilityContext> {
    const activeLocation = locationContextStore.getActiveLocation();

    if (!activeLocation) {
      return {
        active_location_id: null,
        active_location_type: null,
        parent_city_id: null,
        fallback_location_id: fallbackLocationId || null,
      };
    }

    const locationType = activeLocation.type as string;
    const isDistrict = locationType === "district";
    const isNeighborhood = locationType === "neighborhood";
    const isCity = locationType === "city";

    let parentCityId: string | null = null;

    if ((isDistrict || isNeighborhood) && activeLocation.parent_id) {
      parentCityId = await this.resolveParentCityId(activeLocation);
    }

    return {
      active_location_id: activeLocation.id,
      active_location_type: isDistrict
        ? "district"
        : isNeighborhood
          ? "neighborhood"
          : isCity
            ? "city"
            : null,
      parent_city_id: parentCityId,
      fallback_location_id: fallbackLocationId || null,
    };
  }

  private async resolveParentCityId(locality: Location): Promise<string | null> {
    try {
      const { ancestors } = await this.locationService.getAncestors({
        location_id: locality.id,
        include_self: false,
      });

      const cityAncestor = ancestors.find((ancestor) => ancestor.type === "city");
      return cityAncestor?.id || null;
    } catch {
      return null;
    }
  }

  getActiveLocation(): Location | null {
    return locationContextStore.getActiveLocation();
  }

  getActiveLocationId(): string | null {
    return this.getActiveLocation()?.id || null;
  }

  hasActiveLocation(): boolean {
    return this.getActiveLocation() !== null;
  }
}

export const adContextService = new AdContextService();
