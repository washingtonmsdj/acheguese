import { beforeEach, describe, expect, it, vi } from "vitest";

const { invoke, resolveErrorMessage } = vi.hoisted(() => ({
  invoke: vi.fn(),
  resolveErrorMessage: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    functions: { invoke },
    from: vi.fn(),
  },
  resolveSupabaseFunctionErrorMessage: resolveErrorMessage,
}));

vi.mock("./PrivacyRpcService", () => ({
  PrivacyRpcService: {
    requestAccountDeletion: vi.fn(),
  },
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import { PrivacyService } from "./PrivacyService";

describe("PrivacyService.exportUserData", () => {
  beforeEach(() => {
    invoke.mockReset();
    resolveErrorMessage.mockReset();
    resolveErrorMessage.mockResolvedValue(null);
  });

  it("derives byte size and exported section count from the canonical payload", async () => {
    const payload = {
      export_metadata: {
        sections: ["account", "profiles", "billing"],
        format_version: "2.0-draft",
      },
      data: {
        account: { email: "person@example.com" },
        profiles: { profiles: [] },
        billing: { subscriptions: [] },
      },
    };
    invoke.mockResolvedValue({ data: payload, error: null });

    const result = await PrivacyService.exportUserData();
    const expectedBytes = new TextEncoder().encode(
      JSON.stringify(payload, null, 2),
    ).length;

    expect(result.data).toEqual(payload);
    expect(result.sizeBytes).toBe(expectedBytes);
    expect(result.tablesExported).toBe(3);
  });

  it("preserves the safe structured Edge error", async () => {
    const httpError = { message: "Edge Function returned a non-2xx status code" };
    invoke.mockResolvedValue({ data: null, error: httpError });
    resolveErrorMessage.mockResolvedValue("Invalid or expired token");

    await expect(PrivacyService.exportUserData()).rejects.toThrow(
      "Invalid or expired token",
    );
    expect(resolveErrorMessage).toHaveBeenCalledWith(httpError);
  });

  it("fails closed when export metadata is missing", async () => {
    invoke.mockResolvedValue({ data: { data: {} }, error: null });

    await expect(PrivacyService.exportUserData()).rejects.toThrow(
      "Invalid user export response",
    );
  });

  it("fails closed when exported sections are not an object", async () => {
    invoke.mockResolvedValue({
      data: { export_metadata: { sections: [] }, data: [] },
      error: null,
    });

    await expect(PrivacyService.exportUserData()).rejects.toThrow(
      "Invalid user export response",
    );
  });
});
