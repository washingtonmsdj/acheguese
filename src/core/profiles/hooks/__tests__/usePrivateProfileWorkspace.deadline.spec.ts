import { describe, expect, it, vi } from "vitest";
import { loadPrivateWorkspaceWithDeadline } from "../usePrivateProfileWorkspace";

describe("private profile workspace deadline", () => {
  it("resolves a confirmed workspace before the deadline", async () => {
    const workspace = { profile: { id: "profile-1" } } as never;
    await expect(
      loadPrivateWorkspaceWithDeadline(
        "user-1",
        async () => workspace,
        1_000,
      ),
    ).resolves.toBe(workspace);
  });

  it("rejects a workspace read that never settles instead of loading forever", async () => {
    vi.useFakeTimers();
    try {
      const pending = new Promise<never>(() => undefined);
      const result = loadPrivateWorkspaceWithDeadline(
        "user-1",
        async () => pending,
        1_000,
      );
      const rejection = expect(result).rejects.toThrow(
        "Private profile workspace read timed out after 1000ms",
      );

      await vi.advanceTimersByTimeAsync(1_000);
      await rejection;
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects invalid timeout configuration fail-closed", async () => {
    await expect(
      loadPrivateWorkspaceWithDeadline(
        "user-1",
        async () => ({}) as never,
        0,
      ),
    ).rejects.toThrow("Private workspace timeout must be a positive finite number");
  });
});
