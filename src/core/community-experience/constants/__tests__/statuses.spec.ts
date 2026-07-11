import { describe, expect, it } from "vitest";

import {
  COMMUNITY_EXPERIENCE_STATUS,
  isCommunityStatusPubliclyRenderable,
} from "../statuses";

describe("community experience status policy", () => {
  it("keeps non-inactive community statuses publicly renderable", () => {
    expect(isCommunityStatusPubliclyRenderable(COMMUNITY_EXPERIENCE_STATUS.ACTIVE)).toBe(true);
    expect(isCommunityStatusPubliclyRenderable(COMMUNITY_EXPERIENCE_STATUS.LAUNCHING)).toBe(true);
    expect(isCommunityStatusPubliclyRenderable(COMMUNITY_EXPERIENCE_STATUS.COMING_SOON)).toBe(true);
    expect(isCommunityStatusPubliclyRenderable(COMMUNITY_EXPERIENCE_STATUS.WAITING_LIST)).toBe(true);
  });

  it("blocks only inactive communities", () => {
    expect(isCommunityStatusPubliclyRenderable(COMMUNITY_EXPERIENCE_STATUS.INACTIVE)).toBe(false);
  });
});
