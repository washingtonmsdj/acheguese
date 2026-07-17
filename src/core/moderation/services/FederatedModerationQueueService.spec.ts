import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/integrations/supabase", () => ({
  supabase: { rpc },
}));

import { federatedModerationQueueService } from "./FederatedModerationQueueService";

const rows = [
  {
    domain: "community_content",
    report_id: "00000000-0000-4000-8000-000000000003",
    target_type: "post",
    target_id: "00000000-0000-4000-8000-000000000103",
    reason_code: "spam",
    queue_state: "open",
    source_status: "pending",
    created_at: "2026-07-15T12:03:00.000Z",
    report_count: 2,
  },
  {
    domain: "classified",
    report_id: "00000000-0000-4000-8000-000000000002",
    target_type: "classified",
    target_id: "00000000-0000-4000-8000-000000000102",
    reason_code: "fraud",
    queue_state: "open",
    source_status: "pending",
    created_at: "2026-07-15T12:02:00.000Z",
    report_count: 1,
  },
  {
    domain: "review",
    report_id: "00000000-0000-4000-8000-000000000001",
    target_type: "review",
    target_id: "00000000-0000-4000-8000-000000000101",
    reason_code: "inappropriate",
    queue_state: "open",
    source_status: "pending",
    created_at: "2026-07-15T12:01:00.000Z",
    report_count: 1,
  },
];

describe("FederatedModerationQueueService", () => {
  beforeEach(() => rpc.mockReset());

  it("uses one bounded keyset RPC and returns an opaque next cursor", async () => {
    rpc.mockResolvedValue({ data: rows, error: null });

    const page = await federatedModerationQueueService.listPage({ limit: 2 });

    expect(rpc).toHaveBeenCalledWith("list_federated_moderation_queue", {
      p_queue_state: "open",
      p_domain: undefined,
      p_before_created_at: undefined,
      p_before_domain: undefined,
      p_before_report_id: undefined,
      p_limit: 3,
    });
    expect(page.items).toHaveLength(2);
    expect(page.items[0]).toMatchObject({
      domain: "community_content",
      reportCount: 2,
    });
    expect(page.nextCursor).toEqual({
      createdAt: rows[1].created_at,
      domain: "classified",
      reportId: rows[1].report_id,
    });
  });

  it("fails loudly when the backend violates the normalized contract", async () => {
    rpc.mockResolvedValue({
      data: [{ ...rows[0], domain: "unknown_domain" }],
      error: null,
    });

    await expect(federatedModerationQueueService.listPage()).rejects.toThrow();
  });
});
