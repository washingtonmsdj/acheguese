import { beforeEach, describe, expect, it, vi } from "vitest";
import { communityRpcOperationsService } from "@/core/admin/services/CommunityRpcOperationsService";

const supabaseMock = vi.hoisted(() => ({
  rpc: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: supabaseMock,
}));

const metricRow = {
  action: "createAlert",
  bucket_started_at: "2026-07-14T12:00:00.000Z",
  total_requests: 25,
  successful_requests: 24,
  failed_requests: 1,
  error_rate_percent: 4,
  average_duration_ms: 120,
  p50_duration_ms: 100,
  p95_duration_ms: 250,
  p99_duration_ms: 300,
  maximum_duration_ms: 320,
};

const sloRow = {
  action: "createAlert",
  total_requests: 25,
  error_rate_percent: 4,
  p95_duration_ms: 250,
  status: "alert",
  reasons: ["error_rate_threshold_exceeded"],
};

describe("CommunityRpcOperationsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads minute percentiles and the SLO signal through admin-only RPCs", async () => {
    supabaseMock.rpc
      .mockResolvedValueOnce({ data: [metricRow], error: null })
      .mockResolvedValueOnce({ data: [sloRow], error: null });

    const snapshot = await communityRpcOperationsService.getSnapshot(15);

    expect(supabaseMock.rpc).toHaveBeenNthCalledWith(
      1,
      "get_community_rpc_operational_metrics",
      { p_since_minutes: 15 },
    );
    expect(supabaseMock.rpc).toHaveBeenNthCalledWith(
      2,
      "get_community_rpc_slo_status",
      { p_window_minutes: 15 },
    );
    expect(snapshot).toEqual({
      windowMinutes: 15,
      metrics: [
        expect.objectContaining({
          action: "createAlert",
          p50DurationMs: 100,
          p95DurationMs: 250,
          p99DurationMs: 300,
        }),
      ],
      sloStatuses: [
        expect.objectContaining({
          action: "createAlert",
          status: "alert",
          reasons: ["error_rate_threshold_exceeded"],
        }),
      ],
    });
  });

  it("fails closed when the database returns an unknown SLO status", async () => {
    supabaseMock.rpc
      .mockResolvedValueOnce({ data: [metricRow], error: null })
      .mockResolvedValueOnce({ data: [{ ...sloRow, status: "unknown" }], error: null });

    await expect(communityRpcOperationsService.getSnapshot(5)).rejects.toThrow(
      "status de SLO",
    );
  });

  it("propagates database authorization and availability failures", async () => {
    const databaseError = new Error("admin_required");
    supabaseMock.rpc
      .mockResolvedValueOnce({ data: null, error: databaseError })
      .mockResolvedValueOnce({ data: [], error: null });

    await expect(communityRpcOperationsService.getSnapshot(60)).rejects.toBe(databaseError);
  });
});
