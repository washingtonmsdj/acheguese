import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CAPABILITY_ACTIONS,
  buildCapabilityPreviewMatrix,
  evaluateCapabilityPreview,
} from "../../src/core/authorization/services/capabilityPreviewPolicy";
import type {
  CapabilityPreviewSubject,
  CapabilityTargetHint,
} from "../../src/core/authorization/types";

const root = process.cwd();
const activeMember: CapabilityPreviewSubject = {
  profileId: "profile-owner",
  isActive: true,
  isSuspended: false,
  isBlocked: false,
  roles: ["user"],
};

describe("authorization capability preview policy", () => {
  it("denies anonymous, inactive, suspended and blocked subjects", () => {
    expect(evaluateCapabilityPreview(null, "createPost").reason).toBe("anonymous");
    expect(
      evaluateCapabilityPreview({ ...activeMember, isActive: false }, "createPost").status,
    ).toBe("denied");
    expect(
      evaluateCapabilityPreview({ ...activeMember, isSuspended: true }, "createPost").reason,
    ).toBe("suspended-profile");
    expect(
      evaluateCapabilityPreview({ ...activeMember, isBlocked: true }, "createPost").reason,
    ).toBe("blocked-profile");
  });

  it("allows basic create actions only as UI hints for an active profile", () => {
    expect(evaluateCapabilityPreview(activeMember, "createPost").status).toBe("allowed");
    expect(evaluateCapabilityPreview(activeMember, "createComment").status).toBe("allowed");
  });

  it("requires an explicit target owner hint for target-dependent actions", () => {
    expect(evaluateCapabilityPreview(activeMember, "editPost").status).toBe(
      "requiresTarget",
    );

    const ownTarget: CapabilityTargetHint = {
      type: "post",
      id: "post-1",
      ownerProfileIdHint: activeMember.profileId,
    };
    const foreignTarget: CapabilityTargetHint = {
      ...ownTarget,
      ownerProfileIdHint: "profile-other",
    };

    expect(evaluateCapabilityPreview(activeMember, "editPost", {}, ownTarget).status).toBe(
      "allowed",
    );
    expect(evaluateCapabilityPreview(activeMember, "deletePost", {}, foreignTarget).status).toBe(
      "denied",
    );
  });

  it("shows elevated controls to moderator and admin roles", () => {
    for (const role of ["moderator", "admin", "super_admin"] as const) {
      expect(
        evaluateCapabilityPreview({ ...activeMember, roles: [role] }, "moderateContent")
          .status,
      ).toBe("allowed");
    }
    expect(evaluateCapabilityPreview(activeMember, "moderateContent").status).toBe("denied");
  });

  it("limits a community moderator hint to community moderation visibility", () => {
    expect(
      evaluateCapabilityPreview(activeMember, "moderateContent", {
        communityId: "community-1",
        communityModeratorHint: true,
      }).status,
    ).toBe("allowed");
    expect(
      evaluateCapabilityPreview(activeMember, "verifyUser", {
        communityId: "community-1",
        communityModeratorHint: true,
      }).status,
    ).toBe("denied");
  });

  it("marks target actions in a profile matrix without querying domain entities", () => {
    const matrix = buildCapabilityPreviewMatrix(activeMember);
    expect(matrix).toHaveLength(CAPABILITY_ACTIONS.length);
    expect(matrix.find((entry) => entry.action === "editComment")?.status).toBe(
      "requiresTarget",
    );
  });
});

describe("authorization architecture regression guards", () => {
  it("keeps the browser service free from direct aggregate-table reads", () => {
    const service = readFileSync(
      resolve(root, "src/core/authorization/services/CapabilityPreviewService.ts"),
      "utf8",
    );
    expect(service).not.toMatch(/\.from\s*(?:<[^>]+>)?\s*\(/);
    expect(service).not.toContain("@/integrations/supabase");
    expect(service).not.toMatch(/\b(posts|comments|messages|businesses|communities|community_moderators)\b/);
    expect(service).toContain("never proof that a backend command is authorized");
  });

  it("does not retain the legacy authorization or parallel permissions modules", () => {
    expect(
      existsSync(resolve(root, "src/core/authorization/services/AuthorizationEngine.ts")),
    ).toBe(false);
    expect(existsSync(resolve(root, "src/core/permissions/index.ts"))).toBe(false);
  });

  it("maps every preview action to a backend enforcement owner and evidence", () => {
    const map = JSON.parse(
      readFileSync(
        resolve(root, "docs/architecture/authorization-enforcement-map.json"),
        "utf8",
      ),
    ) as {
      actions: Array<{
        action: string;
        commandOwner: string;
        coverage: "verified" | "partial";
        enforcement: string[];
        evidence: string[];
      }>;
    };

    expect(map.actions.map((entry) => entry.action)).toEqual(
      expect.arrayContaining([...CAPABILITY_ACTIONS]),
    );
    for (const entry of map.actions) {
      expect(entry.commandOwner.length).toBeGreaterThan(0);
      expect(entry.enforcement.length).toBeGreaterThan(0);
      expect(entry.evidence.length).toBeGreaterThan(0);
      for (const evidence of entry.evidence) {
        expect(existsSync(resolve(root, evidence)), `${entry.action}: ${evidence}`).toBe(true);
      }
    }
  });
});
