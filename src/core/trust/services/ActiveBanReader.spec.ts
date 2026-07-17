import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/integrations/supabase", () => ({
  supabase: { rpc },
}));

import { activeBanReader } from "./ActiveBanReader";

describe("ActiveBanReader", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("derives the User in the server-owned reader and returns only a boolean", async () => {
    rpc.mockResolvedValue({ data: true, error: null });

    await expect(activeBanReader.readCurrent()).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith("has_current_active_ban");
  });

  it("maps an allowed negative result without exposing ban metadata", async () => {
    rpc.mockResolvedValue({ data: false, error: null });

    await expect(activeBanReader.readCurrent()).resolves.toBe(false);
  });

  it("propagates database failures instead of treating the User as unbanned", async () => {
    const error = new Error("authorization unavailable");
    rpc.mockResolvedValue({ data: null, error });

    await expect(activeBanReader.readCurrent()).rejects.toBe(error);
  });
});
