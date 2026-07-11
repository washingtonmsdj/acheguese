/**
 * Main entrypoint for sponsored ad delivery.
 *
 * Orchestrates AdContextService and AdEligibilityService. Consumers should use
 * this service, or the useAdDelivery hook, instead of querying ad_campaigns
 * directly.
 */

import { AdEligibilityService } from "./AdEligibilityService";
import { AdContextService, adContextService } from "./AdContextService";
import { createAdRepository } from "../repositories/createAdRepository";
import type { IAdRepository } from "../repositories/IAdRepository";
import type { AdPlacementKey, AdResolutionResult } from "../types";

export class AdDeliveryService {
  private eligibilityService: AdEligibilityService;
  private contextService: AdContextService;

  constructor(repository: IAdRepository = createAdRepository()) {
    this.eligibilityService = new AdEligibilityService(repository);
    this.contextService = adContextService;
  }

  async getAdForPlacement(
    placement_key: AdPlacementKey,
    fallbackLocationId?: string | null,
  ): Promise<AdResolutionResult> {
    const context = await this.contextService.buildContext(fallbackLocationId);
    return this.eligibilityService.resolve(placement_key, context);
  }

  hasActiveLocation(): boolean {
    return this.contextService.hasActiveLocation();
  }

  getActiveLocationId(): string | null {
    return this.contextService.getActiveLocationId();
  }
}

export const adDeliveryService = new AdDeliveryService();
