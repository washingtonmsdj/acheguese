import { BusinessService } from "@/core/business";
import { ClassifiedLinkEligibilityService } from "@/core/classifieds/services";
import { TouristPointLinkEligibilityService } from "@/core/guide/tourist-points";
import { PostLinkEligibilityService } from "@/core/posts/services";
import { ProfessionalLinkEligibilityService } from "@/core/professional/services";
import { EventLinkEligibilityService } from "@/core/verticals/events";
import type {
  CommunityEntityLinkRequestInput,
  CommunityEntityType,
} from "@/core/community-experience/types";

export type CommunityEntityLinkEligibilityReason =
  | "eligible"
  | "not_public"
  | "unsupported_entity_type";

export interface CommunityEntityLinkEligibilityResult {
  eligible: boolean;
  reason: CommunityEntityLinkEligibilityReason;
}

type CommunityEntityLinkEligibilityInput = Pick<
  CommunityEntityLinkRequestInput,
  "entityId" | "entityType"
>;

const NOT_PUBLIC_RESULT: CommunityEntityLinkEligibilityResult = {
  eligible: false,
  reason: "not_public",
};

const UNSUPPORTED_RESULT: CommunityEntityLinkEligibilityResult = {
  eligible: false,
  reason: "unsupported_entity_type",
};

function resultFromEligibility(eligible: boolean): CommunityEntityLinkEligibilityResult {
  return eligible ? { eligible: true, reason: "eligible" } : NOT_PUBLIC_RESULT;
}

async function isEntityPubliclyLinkable(
  entityType: CommunityEntityType,
  entityId: string,
): Promise<boolean | null> {
  switch (entityType) {
    case "business":
      return BusinessService.isCommunityLinkEligibleByDataId(entityId);
    case "event":
      return EventLinkEligibilityService.isCommunityLinkEligible(entityId);
    case "classified":
      return ClassifiedLinkEligibilityService.isCommunityLinkEligible(entityId);
    case "professional":
      return ProfessionalLinkEligibilityService.isCommunityLinkEligible(entityId);
    case "post":
      return PostLinkEligibilityService.isCommunityLinkEligible(entityId);
    case "tourist_point":
      return TouristPointLinkEligibilityService.isCommunityLinkEligible(entityId);
    default:
      return null;
  }
}

export class CommunityEntityLinkEligibilityService {
  static async check(
    input: CommunityEntityLinkEligibilityInput,
  ): Promise<CommunityEntityLinkEligibilityResult> {
    const eligible = await isEntityPubliclyLinkable(input.entityType, input.entityId);

    if (eligible === null) {
      return UNSUPPORTED_RESULT;
    }

    return resultFromEligibility(eligible);
  }
}
