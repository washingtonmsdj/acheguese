import { afterEach, describe, expect, it, vi } from "vitest";

import { withTimeout } from "./withTimeout";

describe("withTimeout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the operation result before the deadline", async () => {
    await expect(
      withTimeout(Promise.resolve("ok"), {
        message: "timeout",
        timeoutMs: 100,
      }),
    ).resolves.toBe("ok");
  });

  it("rejects a stalled operation at the deadline", async () => {
    vi.useFakeTimers();
    const request = withTimeout(new Promise<never>(() => undefined), {
      message: "request timed out",
      timeoutMs: 100,
    });
    const assertion = expect(request).rejects.toThrow("request timed out");

    await vi.advanceTimersByTimeAsync(100);
    await assertion;
  });
});
