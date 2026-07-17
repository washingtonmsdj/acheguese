import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/integrations/supabase", () => ({
  supabase: { rpc },
}));

import { communitySocialAuditReader } from "./CommunitySocialAuditReader";

const firstRow = {
  id: "00000000-0000-4000-8000-000000000101",
  actor_user_id: "00000000-0000-4000-8000-000000000201",
  actor_profile_id: "00000000-0000-4000-8000-000000000301",
  action: "update",
  target_type: "post",
  target_id: "00000000-0000-4000-8000-000000000401",
  location_id: "00000000-0000-4000-8000-000000000501",
  metadata: { status: "published", is_hidden: false },
  created_at: "2026-07-15T12:00:00.000Z",
};

const secondRow = {
  ...firstRow,
  id: "00000000-0000-4000-8000-000000000102",
  created_at: "2026-07-15T11:00:00.000Z",
};

describe("CommunitySocialAuditReader", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("maps the private community stream to the shared AuditEvent contract", async () => {
    rpc.mockResolvedValue({ data: [firstRow], error: null });

    const page = await communitySocialAuditReader.readPage({ limit: 10 });

    expect(rpc).toHaveBeenCalledWith("list_community_social_audit_events", {
      p_before_created_at: undefined,
      p_before_id: undefined,
      p_limit: 11,
    });
    expect(page).toEqual({
      items: [
        expect.objectContaining({
          id: firstRow.id,
          source: "community.social",
          dataClass: "pseudonymous",
          retentionClass: "security",
          target: { type: "post", id: firstRow.target_id },
        }),
      ],
      nextCursor: null,
    });
  });

  it("uses a stable keyset cursor without leaking the look-ahead row", async () => {
    rpc.mockResolvedValue({ data: [firstRow, secondRow], error: null });

    const page = await communitySocialAuditReader.readPage({ limit: 1 });

    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).toEqual({
      occurredAt: firstRow.created_at,
      eventId: firstRow.id,
    });
  });
});
