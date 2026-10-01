import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ORDAX_FIRST_PARTY_INTEGRATION_SCHEMA,
  validateOrdaxPublicationEnvelope,
  validateOrdaxSpaceLink,
} from "../../src/integrations/ordax/boundary";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("OrdaX first-party integration boundary", () => {
  const boundary = read("src/integrations/ordax/boundary.ts");
  const contract = JSON.parse(
    read("docs/contracts/ordax-first-party-integration.json"),
  ) as Record<string, any>;
  const docs = read(
    "docs/03-architecture/ORDAX_FIRST_PARTY_INTEGRATION.md",
  );

  it("keeps Achegue-se independent from OrdaX persistence and credentials", () => {
    expect(contract.$schema).toBe(ORDAX_FIRST_PARTY_INTEGRATION_SCHEMA);
    expect(contract.positioning.acheguese_remains_independently_usable).toBe(true);
    expect(contract.identity.account_merge).toBe(false);
    expect(contract.identity.password_sync).toBe(false);
    expect(contract.persistence.shared_database).toBe(false);
    expect(contract.persistence.shared_service_role).toBe(false);
    expect(contract.persistence.cross_database_foreign_keys).toBe(false);
    expect(contract.persistence.direct_ordax_supabase_access).toBe(false);
    expect(contract.runtime_gate.fake_adapter_forbidden).toBe(true);

    expect(boundary).not.toContain("@/integrations/supabase");
    expect(boundary).not.toContain("service_role");
    expect(boundary).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(docs).toContain("OAuth 2.1 + PKCE");
  });

  it("validates an explicit school-to-Space link without merging accounts", () => {
    const link = validateOrdaxSpaceLink({
      schema: ORDAX_FIRST_PARTY_INTEGRATION_SCHEMA,
      provider: "ordax",
      connectionId: "connection_school_001",
      achegueseOwnerUserId: "acheguese_user_001",
      achegueseEntityKind: "education-institution",
      achegueseEntityId: "education_school_001",
      issuer: "https://identity.ordax.example",
      subjectId: "ordax_subject_001",
      spaceId: "ordax_space_school_001",
      scopes: ["network.space.read", "network.communities.read"],
      state: "active",
      linkedAt: "2026-10-01T04:30:00.000Z",
      revokedAt: null,
    });

    expect(link.achegueseEntityKind).toBe("education-institution");
    expect(link.spaceId).toBe("ordax_space_school_001");
  });

  it("rejects unsupported scopes and inconsistent revocation state", () => {
    const base = {
      schema: ORDAX_FIRST_PARTY_INTEGRATION_SCHEMA,
      provider: "ordax",
      connectionId: "connection_school_001",
      achegueseOwnerUserId: "acheguese_user_001",
      achegueseEntityKind: "education-institution",
      achegueseEntityId: "education_school_001",
      issuer: "https://identity.ordax.example",
      subjectId: "ordax_subject_001",
      spaceId: "ordax_space_school_001",
      linkedAt: "2026-10-01T04:30:00.000Z",
      revokedAt: null,
    };

    expect(() =>
      validateOrdaxSpaceLink({
        ...base,
        state: "active",
        scopes: ["admin.everything"],
      }),
    ).toThrow(/scope is unsupported/);

    expect(() =>
      validateOrdaxSpaceLink({
        ...base,
        state: "revoked",
        scopes: ["network.space.read"],
      }),
    ).toThrow(/require revokedAt/);
  });

  it("requires versioned targeted publication events", () => {
    const event = validateOrdaxPublicationEnvelope({
      schema: "acheguese.ordax-publication-event/1",
      eventId: "ordax_event_notice_001",
      revision: 2,
      kind: "notice.updated",
      publisherSpaceId: "ordax_space_school_001",
      connectionId: "connection_school_001",
      target: {
        kind: "linked-entity",
        entityId: "education_school_001",
      },
      occurredAt: "2026-10-01T04:45:00.000Z",
    });

    expect(event.revision).toBe(2);
    expect(event.target.kind).toBe("linked-entity");

    expect(() =>
      validateOrdaxPublicationEnvelope({
        ...event,
        revision: 0,
      }),
    ).toThrow(/positive integer/);
  });

  it("keeps runtime activation fail-closed until real OrdaX proof exists", () => {
    expect(contract.status).toBe("boundary-defined-runtime-disabled");
    expect(contract.runtime_gate.enabled).toBe(false);
    expect(contract.runtime_gate.requires_ordax_network_multitenant_proof).toBe(true);
    expect(contract.runtime_gate.requires_ordax_product_oauth_api).toBe(true);
    expect(contract.publications.mirror_every_ordax_post).toBe(false);
  });
});
