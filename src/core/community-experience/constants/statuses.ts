import type { CommunityStatus } from "../types";

export const COMMUNITY_EXPERIENCE_STATUS = {
  ACTIVE: "active",
  LAUNCHING: "launching",
  WAITING_LIST: "waiting_list",
  COMING_SOON: "coming_soon",
  INACTIVE: "inactive",
} as const satisfies Record<string, CommunityStatus>;

export function isCommunityStatusPubliclyRenderable(
  status: CommunityStatus | null | undefined,
): boolean {
  return status !== COMMUNITY_EXPERIENCE_STATUS.INACTIVE;
}
