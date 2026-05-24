import type { CommunityStatus } from "../services/CommunityExperienceService";

export const COMMUNITY_EXPERIENCE_STATUS = {
  ACTIVE: "active",
  LAUNCHING: "launching",
  WAITING_LIST: "waiting_list",
  COMING_SOON: "coming_soon",
  INACTIVE: "inactive",
} as const satisfies Record<string, CommunityStatus>;
