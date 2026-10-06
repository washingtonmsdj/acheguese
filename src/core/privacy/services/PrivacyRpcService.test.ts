import { beforeEach, describe, expect, it, vi } from "vitest";
import { TIMEOUTS } from "@/shared/constants";

const { abortSignalMock, invokeSupabaseBrokerMock, rpcMock } = vi.hoisted(() => ({
  abortSignalMock: vi.fn(),
  invokeSupabaseBrokerMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock("@/core/infrastructure/edge-functions/edgeFunctionBroker", () => ({
  invokeSupabaseBroker: (...args: unknown[]) => invokeSupabaseBrokerMock(...args),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

import { PrivacyRpcService } from "./PrivacyRpcService";

describe("PrivacyRpcService", () => {
  beforeEach(() => {
    abortSignalMock.mockReset();
    invokeSupabaseBrokerMock.mockReset();
    rpcMock.mockReset();
    rpcMock.mockReturnValue({ abortSignal: abortSignalMock });
  });

  it("reads deletion status from the self-only PostgREST RPC with the bounded access timeout", async () => {
    abortSignalMock.mockResolvedValue({ data: null, error: null });
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout");

    await expect(PrivacyRpcService.getDeletionStatus()).resolves.toBeNull();

    expect(rpcMock).toHaveBeenCalledWith("get_current_account_deletion_status");
    expect(timeoutSpy).toHaveBeenCalledWith(TIMEOUTS.PRIVACY_ACCESS_GATE);
    expect(abortSignalMock).toHaveBeenCalledWith(expect.any(AbortSignal));
    expect(invokeSupabaseBrokerMock).not.toHaveBeenCalled();

    timeoutSpy.mockRestore();
  });

  it("validates the minimal deletion status returned by the self-only RPC", async () => {
    abortSignalMock.mockResolvedValue({
      data: {
        status: "scheduled",
        scheduledPurgeAt: "2026-10-20T12:00:00.000Z",
        daysRemaining: 14,
      },
      error: null,
    });

    await expect(PrivacyRpcService.getDeletionStatus()).resolves.toEqual({
      status: "scheduled",
      scheduledPurgeAt: "2026-10-20T12:00:00.000Z",
      daysRemaining: 14,
    });
  });

  it("fails closed when the self-only RPC returns an error or invalid payload", async () => {
    abortSignalMock.mockResolvedValueOnce({
      data: null,
      error: { message: "temporary database error" },
    });

    await expect(PrivacyRpcService.getDeletionStatus()).rejects.toThrow(
      "Privacy deletion status query failed",
    );

    abortSignalMock.mockResolvedValueOnce({
      data: {
        status: "scheduled",
        scheduledPurgeAt: "not-a-date",
        daysRemaining: 1,
      },
      error: null,
    });

    await expect(PrivacyRpcService.getDeletionStatus()).rejects.toThrow(
      "Privacy authority returned invalid deletion status",
    );
  });

  it("keeps destructive commands on the authenticated broker without the access-gate timeout", async () => {
    invokeSupabaseBrokerMock.mockResolvedValue({ cancelled: true });

    await expect(PrivacyRpcService.cancelAccountDeletion()).resolves.toBe(true);

    expect(invokeSupabaseBrokerMock).toHaveBeenCalledWith({
      action: "cancelAccountDeletion",
      functionName: "privacy-rpc",
      noDataMessage: "Privacy broker returned no data",
      params: {},
      serviceName: "PrivacyRpcService",
    });
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
