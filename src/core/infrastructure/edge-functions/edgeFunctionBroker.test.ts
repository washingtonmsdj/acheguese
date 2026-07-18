import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeNullableSupabaseBroker,
  invokeSupabaseBroker,
  invokeSupabaseBrokerCommand,
} from "./edgeFunctionBroker";
import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    warn: vi.fn(),
  },
}));

const invokeMock = vi.mocked(supabase.functions.invoke);
const warnMock = vi.mocked(logger.warn);

describe("edgeFunctionBroker", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    warnMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("invokes a broker function with action and params", async () => {
    invokeMock.mockResolvedValue({
      data: { data: { ok: true } },
      error: null,
    });

    const result = await invokeSupabaseBroker<{ ok: boolean }, "probe">({
      action: "probe",
      functionName: "probe-rpc",
      params: { id: "123" },
      serviceName: "ProbeService",
    });

    expect(result).toEqual({ ok: true });
    expect(invokeMock).toHaveBeenCalledWith("probe-rpc", {
      body: { action: "probe", params: { id: "123" } },
    });
  });

  it("throws and logs transport errors", async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: { message: "network failed" },
    });

    await expect(
      invokeSupabaseBroker<unknown, "probe">({
        action: "probe",
        functionName: "probe-rpc",
        serviceName: "ProbeService",
      }),
    ).rejects.toThrow("network failed");

    expect(warnMock).toHaveBeenCalledWith(
      "[ProbeService] broker invocation failed",
      {
        action: "probe",
        message: "network failed",
      },
    );
  });

  it("throws and logs broker rejections", async () => {
    invokeMock.mockResolvedValue({
      data: { error: "not allowed" },
      error: null,
    });

    await expect(
      invokeSupabaseBroker<unknown, "probe">({
        action: "probe",
        functionName: "probe-rpc",
        serviceName: "ProbeService",
      }),
    ).rejects.toThrow("not allowed");

    expect(warnMock).toHaveBeenCalledWith(
      "[ProbeService] broker rejected action",
      {
        action: "probe",
        message: "not allowed",
      },
    );
  });

  it("returns null for nullable broker failures", async () => {
    invokeMock.mockResolvedValue({
      data: { error: "soft failure" },
      error: null,
    });

    const result = await invokeNullableSupabaseBroker<unknown, "probe">({
      action: "probe",
      functionName: "probe-rpc",
      serviceName: "ProbeService",
    });

    expect(result).toBeNull();
  });

  it("allows command brokers without response data", async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(
      invokeSupabaseBrokerCommand({
        action: "probe",
        functionName: "probe-rpc",
        params: { id: "123" },
        serviceName: "ProbeService",
      }),
    ).resolves.toBeUndefined();
  });

  it("rejects stalled broker requests after the configured timeout", async () => {
    vi.useFakeTimers();
    invokeMock.mockImplementation(() => new Promise(() => undefined));

    const request = invokeSupabaseBroker<unknown, "probe">({
      action: "probe",
      functionName: "probe-rpc",
      serviceName: "ProbeService",
      timeoutMs: 100,
    });
    const assertion = expect(request).rejects.toThrow(
      "ProbeService broker request timed out",
    );

    await vi.advanceTimersByTimeAsync(100);
    await assertion;
    expect(warnMock).toHaveBeenCalledWith(
      "[ProbeService] broker invocation failed",
      {
        action: "probe",
        message: "ProbeService broker request timed out",
      },
    );
  });
});
