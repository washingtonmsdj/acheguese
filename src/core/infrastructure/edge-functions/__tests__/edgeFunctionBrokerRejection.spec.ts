import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  resolveError: vi.fn(),
  warn: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: { functions: { invoke: mocks.invoke } },
  resolveSupabaseFunctionErrorMessage: mocks.resolveError,
}));
vi.mock("@/shared/utils/logger", () => ({
  logger: { warn: mocks.warn },
}));

import {
  invokeSupabaseBroker,
  SupabaseBrokerRejectedError,
} from "../edgeFunctionBroker";

const broker = () =>
  invokeSupabaseBroker<{ success: boolean }, "createBusiness">({
    action: "createBusiness",
    functionName: "profile-rpc",
    serviceName: "ProfileRpcService",
  });

describe("Edge broker explicit rejection versus unknown outcome", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns the authoritative payload for successful responses", async () => {
    mocks.invoke.mockResolvedValue({
      data: { data: { success: true } },
      error: null,
    });
    await expect(broker()).resolves.toEqual({ success: true });
  });

  it("marks the broker's explicit error payload as a confirmed rejection", async () => {
    mocks.invoke.mockResolvedValue({
      data: { error: "Operation rejected" },
      error: null,
    });

    await expect(broker()).rejects.toBeInstanceOf(SupabaseBrokerRejectedError);
    await expect(broker()).rejects.toThrow("Operation rejected");
  });

  it("does not classify transport failures as server-confirmed rejections", async () => {
    mocks.resolveError.mockResolvedValue("Connection lost");
    mocks.invoke.mockResolvedValue({
      data: null,
      error: new Error("Network failure"),
    });
    try {
      await broker();
      throw new Error("Expected network failure");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).not.toBeInstanceOf(SupabaseBrokerRejectedError);
      expect((error as Error).message).toBe("Connection lost");
    }
  });

  it("does not classify an acknowledgement-less HTTP response as a rejection", async () => {
    mocks.invoke.mockResolvedValue({ data: {}, error: null });
    try {
      await broker();
      throw new Error("Expected missing acknowledgement");
    } catch (error) {
      expect(error).not.toBeInstanceOf(SupabaseBrokerRejectedError);
      expect((error as Error).message).toContain("broker returned no data");
    }
  });
});
