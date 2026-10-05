import { beforeEach, describe, expect, it, vi } from "vitest";

const { invokeSupabaseBrokerMock } = vi.hoisted(() => ({
  invokeSupabaseBrokerMock: vi.fn(),
}));

vi.mock("@/core/infrastructure/edge-functions/edgeFunctionBroker", () => ({
  invokeSupabaseBroker: (...args: unknown[]) => invokeSupabaseBrokerMock(...args),
}));

import { PrivacyRpcService } from "./PrivacyRpcService";

describe("PrivacyRpcService", () => {
  beforeEach(() => {
    invokeSupabaseBrokerMock.mockReset();
  });

  it("bounds deletion status checks so protected routes cannot wait forever", async () => {
    invokeSupabaseBrokerMock.mockResolvedValue(null);

    await expect(PrivacyRpcService.getDeletionStatus()).resolves.toBeNull();

    expect(invokeSupabaseBrokerMock).toHaveBeenCalledWith({
      action: "getDeletionStatus",
      functionName: "privacy-rpc",
      noDataMessage: "Privacy broker returned no data",
      params: {},
      serviceName: "PrivacyRpcService",
      timeoutMs: 10_000,
    });
  });

  it("does not apply the deletion-status timeout to destructive commands", async () => {
    invokeSupabaseBrokerMock.mockResolvedValue({ cancelled: true });

    await expect(PrivacyRpcService.cancelAccountDeletion()).resolves.toBe(true);

    expect(invokeSupabaseBrokerMock).toHaveBeenCalledWith({
      action: "cancelAccountDeletion",
      functionName: "privacy-rpc",
      noDataMessage: "Privacy broker returned no data",
      params: {},
      serviceName: "PrivacyRpcService",
      timeoutMs: undefined,
    });
  });
});
