import { describe, expect, it } from "vitest";
import {
  resolveCommunityAccess,
  type CommunityAccessInput,
} from "../CommunityAccessPolicy";

const targetLocation = {
  id: "loc-santa-cruz",
  name: "Santa Cruz",
  slug: "santa-cruz",
  type: "district",
  parent_id: "city-salvador",
  geographic_path: "/br/ba/salvador/santa-cruz",
  status: "active",
  metadata: {},
};

const group = {
  id: "group-complexo",
  name: "Complexo",
  slug: "complexo",
  description: null,
  anchor_city_id: "city-salvador",
  status: "active",
  metadata: {},
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  members: [
    targetLocation,
    {
      ...targetLocation,
      id: "loc-nordeste",
      name: "Nordeste de Amaralina",
      slug: "nordeste-de-amaralina",
    },
  ],
};

const baseInput: CommunityAccessInput = {
  isAuthenticated: true,
  hasActiveProfile: true,
  isAdmin: false,
  isModerator: false,
  residence: {
    locationId: "loc-santa-cruz",
    isVerified: true,
  },
  resolved: { kind: "location", location: targetLocation as never },
  rolloutEnabled: true,
};

describe("CommunityAccessPolicy", () => {
  it("permite preview publico para visitante e bloqueia acoes residentes", () => {
    const decision = resolveCommunityAccess({
      ...baseInput,
      isAuthenticated: false,
      hasActiveProfile: false,
      residence: null,
    });

    expect(decision.level).toBe("public_preview");
    expect(decision.reason).toBe("visitor");
    expect(decision.primaryAction).toBe("login");
    expect(decision.can.view_public_preview).toBe(true);
    expect(decision.can.create_post).toBe(false);
  });

  it("bloqueia usuario autenticado sem residencia canonica", () => {
    const decision = resolveCommunityAccess({
      ...baseInput,
      residence: null,
    });

    expect(decision.level).toBe("authenticated");
    expect(decision.reason).toBe("missing_residence");
    expect(decision.primaryAction).toBe("add_address");
    expect(decision.can.report).toBe(true);
    expect(decision.can.view_member_feed).toBe(false);
  });

  it("bloqueia residencia fora do territorio comunitario atual", () => {
    const decision = resolveCommunityAccess({
      ...baseInput,
      residence: {
        locationId: "loc-pituba",
        isVerified: true,
      },
    });

    expect(decision.level).toBe("authenticated");
    expect(decision.reason).toBe("out_of_territory");
    expect(decision.can.create_post).toBe(false);
  });

  it("usa membros ativos para validar residencia em grupo territorial", () => {
    const decision = resolveCommunityAccess({
      ...baseInput,
      resolved: { kind: "group", group: group as never },
      activeMemberIds: ["loc-nordeste"],
      residence: {
        locationId: "loc-santa-cruz",
        isVerified: true,
      },
    });

    expect(decision.level).toBe("authenticated");
    expect(decision.reason).toBe("out_of_territory");
  });

  it("permite leitura residente mas bloqueia publicacao quando residencia nao e verificada", () => {
    const decision = resolveCommunityAccess({
      ...baseInput,
      residence: {
        locationId: "loc-santa-cruz",
        isVerified: false,
      },
    });

    expect(decision.level).toBe("resident");
    expect(decision.reason).toBe("unverified_residence");
    expect(decision.primaryAction).toBe("verify_address");
    expect(decision.can.view_member_feed).toBe(true);
    expect(decision.can.create_post).toBe(false);
    expect(decision.can.create_issue).toBe(false);
    expect(decision.can.create_alert).toBe(false);
    expect(decision.can.send_message).toBe(false);
  });

  it("bloqueia feed membro quando rollout do territorio ainda nao foi liberado", () => {
    const decision = resolveCommunityAccess({
      ...baseInput,
      rolloutEnabled: false,
    });

    expect(decision.level).toBe("authenticated");
    expect(decision.reason).toBe("rollout_blocked");
    expect(decision.primaryAction).toBe("waitlist");
    expect(decision.can.view_public_preview).toBe(true);
    expect(decision.can.view_member_feed).toBe(false);
  });

  it("libera acoes comunitarias para morador verificado", () => {
    const decision = resolveCommunityAccess(baseInput);

    expect(decision.level).toBe("verified_resident");
    expect(decision.reason).toBe("allowed");
    expect(decision.can.create_post).toBe(true);
    expect(decision.can.create_issue).toBe(true);
    expect(decision.can.create_alert).toBe(true);
    expect(decision.can.comment).toBe(true);
    expect(decision.can.send_message).toBe(true);
    expect(decision.can.join_group).toBe(true);
    expect(decision.can.manage_portal).toBe(false);
  });

  it("aceita alvo minimo por location_id para paginas comunitarias legado", () => {
    const decision = resolveCommunityAccess({
      ...baseInput,
      resolved: {
        kind: "location",
        location: {
          id: "loc-santa-cruz",
          name: "Santa Cruz",
        },
      },
    });

    expect(decision.level).toBe("verified_resident");
    expect(decision.targetLocationIds).toEqual(["loc-santa-cruz"]);
    expect(decision.can.create_post).toBe(true);
  });

  it("distingue moderador de admin", () => {
    const moderator = resolveCommunityAccess({
      ...baseInput,
      isModerator: true,
      residence: null,
    });
    const admin = resolveCommunityAccess({
      ...baseInput,
      isAdmin: true,
      residence: null,
    });

    expect(moderator.level).toBe("moderator");
    expect(moderator.can.moderate).toBe(true);
    expect(moderator.can.manage_portal).toBe(false);
    expect(admin.level).toBe("admin");
    expect(admin.can.manage_portal).toBe(true);
  });
});
