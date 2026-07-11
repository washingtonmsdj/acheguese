/**
 * Canonical sponsored ad eligibility.
 *
 * Priority:
 * 1. Exact local territory target: district or neighborhood.
 * 2. Parent city target.
 * 3. Profile fallback location when there is no active location.
 * 4. Generic platform campaign without targets.
 *
 * Targeting uses canonical location_id values only, never free-form
 * neighborhood/city strings.
 */

import type { IAdRepository } from "../repositories/IAdRepository";
import type {
  AdCampaignWithTargets,
  AdEligibilityContext,
  AdPlacementKey,
  AdResolutionResult,
  AdTargetScope,
} from "../types";

type LocalResolutionSource = Extract<
  AdResolutionResult["resolution_source"],
  "district" | "neighborhood"
>;

export class AdEligibilityService {
  constructor(private repository: IAdRepository) {}

  async resolve(
    placement_key: AdPlacementKey,
    context: AdEligibilityContext,
  ): Promise<AdResolutionResult> {
    const eligibleIds = this.buildEligibleLocationIds(context);

    if (eligibleIds.length > 0) {
      const candidates = await this.repository.findActiveCampaignsByLocationIds(
        placement_key,
        eligibleIds,
      );

      if (candidates.length > 0) {
        const selected = this.selectByPriority(candidates, context);
        if (selected) {
          return {
            campaign: selected.campaign,
            resolution_source: selected.source,
          };
        }
      }
    }

    const generics = await this.repository.findGenericCampaigns(placement_key);
    if (generics.length > 0) {
      return {
        campaign: generics[0],
        resolution_source: "generic",
      };
    }

    return { campaign: null, resolution_source: "none" };
  }

  private buildEligibleLocationIds(context: AdEligibilityContext): string[] {
    const ids: string[] = [];

    if (context.active_location_id) {
      ids.push(context.active_location_id);

      if (this.isLocalContext(context) && context.parent_city_id) {
        ids.push(context.parent_city_id);
      }
    } else if (context.fallback_location_id) {
      ids.push(context.fallback_location_id);
    }

    return ids;
  }

  private selectByPriority(
    candidates: AdCampaignWithTargets[],
    context: AdEligibilityContext,
  ): { campaign: AdCampaignWithTargets; source: AdResolutionResult["resolution_source"] } | null {
    const localMatch = this.findLocalMatch(candidates, context);
    if (localMatch) return localMatch;

    const cityId =
      context.active_location_type === "city" ? context.active_location_id : context.parent_city_id;

    if (cityId) {
      const cityMatch = candidates.find((candidate) =>
        candidate.targets.some(
          (target) => target.location_id === cityId && target.target_scope === "city",
        ),
      );
      if (cityMatch) return { campaign: cityMatch, source: "city" };
    }

    if (context.fallback_location_id && !context.active_location_id) {
      const fallbackMatch = candidates.find((candidate) =>
        candidate.targets.some((target) => target.location_id === context.fallback_location_id),
      );
      if (fallbackMatch) return { campaign: fallbackMatch, source: "fallback" };
    }

    return null;
  }

  private findLocalMatch(
    candidates: AdCampaignWithTargets[],
    context: AdEligibilityContext,
  ): { campaign: AdCampaignWithTargets; source: LocalResolutionSource } | null {
    if (!context.active_location_id || !this.isLocalContext(context)) return null;

    const source = context.active_location_type;
    const match = candidates.find((candidate) =>
      candidate.targets.some(
        (target) =>
          target.location_id === context.active_location_id &&
          this.isCompatibleLocalScope(target.target_scope, source),
      ),
    );

    return match ? { campaign: match, source } : null;
  }

  private isLocalContext(
    context: AdEligibilityContext,
  ): context is AdEligibilityContext & { active_location_type: LocalResolutionSource } {
    return (
      context.active_location_type === "district" ||
      context.active_location_type === "neighborhood"
    );
  }

  private isCompatibleLocalScope(
    targetScope: AdTargetScope,
    source: LocalResolutionSource,
  ): boolean {
    if (targetScope === source) return true;
    return targetScope !== "city";
  }

  isEligible(campaign: AdCampaignWithTargets, context: AdEligibilityContext): boolean {
    if (campaign.targets.length === 0) return true;

    const eligibleIds = this.buildEligibleLocationIds(context);
    return campaign.targets.some((target) => eligibleIds.includes(target.location_id));
  }
}
