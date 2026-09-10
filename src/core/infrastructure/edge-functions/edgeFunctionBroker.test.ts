import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeNullableSupabaseBroker,
  invokeSupabaseBroker,
  invokeSupabaseBrokerCommand,
} from "./edgeFunctionBroker";
import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

const { resolveErrorMessage } = vi.hoisted(() => ({
  resolveErrorMessage: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
  resolveSupabaseFunctionErrorMessage: resolveErrorMessage,
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
    resolveErrorMessage.mockReset();
    resolveErrorMessage.mockResolvedValue(null);
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

  it("preserves structured Edge HTTP errors instead of replacing them with the SDK message", async () => {
    const httpError = { message: "Edge Function returned a non-2xx status code" };
    invokeMock.mockResolvedValue({
      data: null,
      error: httpError,
    });
    resolveErrorMessage.mockResolvedValue("not_allowed");

    await expect(
      invokeSupabaseBroker<unknown, "probe">({
        action: "probe",
        functionName: "probe-rpc",
        serviceName: "ProbeService",
      }),
    ).rejects.toThrow("not_allowed");

    expect(resolveErrorMessage).toHaveBeenCalledWith(httpError);
    expect(warnMock).toHaveBeenCalledWith("[ProbeService] broker invocation failed", {
      action: "probe",
      message: "not_allowed",
    });
  });

  it("uses the canonical resolver for structured response messages", async () => {
    const httpError = { message: "Edge Function returned a non-2xx status code" };
    invokeMock.mockResolvedValue({ data: null, error: httpError });
    resolveErrorMessage.mockResolvedValue("profile unavailable");

    await expect(
      invokeSupabaseBroker<unknown, "probe">({
        action: "probe",
        functionName: "probe-rpc",
        serviceName: "ProbeService",
      }),
    ).rejects.toThrow("profile unavailable");
  });

  it("preserves the resolver fallback for transport errors", async () => {
    const transportError = { message: "network failed" };
    invokeMock.mockResolvedValue({
      data: null,
      error: transportError,
    });
    resolveErrorMessage.mockResolvedValue("network failed");

    await expect(
      invokeSupabaseBroker<unknown, "probe">({
        action: "probe",
        functionName: "probe-rpc",
        serviceName: "ProbeService",
      }),
    ).rejects.toThrow("network failed");

    expect(resolveErrorMessage).toHaveBeenCalledWith(transportError);
    expect(warnMock).toHaveBeenCalledWith("[ProbeService] broker invocation failed", {
      action: "probe",
      message: "network failed",
    });
  });

  it("fails closed when an invocation error has no usable message", async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: {},
    });

    await expect(
      invokeSupabaseBroker<unknown, "probe">({
        action: "probe",
        functionName: "probe-rpc",
        serviceName: "ProbeService",
      }),
    ).rejects.toThrow("Edge Function invocation failed");
  });

  it("throws and logs broker rejections returned with a successful HTTP response", async () => {
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

    expect(warnMock).toHaveBeenCalledWith("[ProbeService] broker rejected action", {
      action: "probe",
      message: "not allowed",
    });
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
});
