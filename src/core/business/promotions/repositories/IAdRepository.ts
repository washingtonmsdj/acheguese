import type { AdCampaignWithTargets, AdPlacementKey } from "../types";

export interface IAdRepository {
  /**
   * Finds publicly deliverable campaigns for a placement and eligible
   * canonical location ids.
   */
  findActiveCampaignsByLocationIds(
    placement_key: AdPlacementKey,
    location_ids: string[],
  ): Promise<AdCampaignWithTargets[]>;

  /**
   * Finds platform-generic campaigns without location targets.
   */
  findGenericCampaigns(placement_key: AdPlacementKey): Promise<AdCampaignWithTargets[]>;

  /**
   * Finds one publicly deliverable campaign by id.
   */
  findById(id: string): Promise<AdCampaignWithTargets | null>;
}
