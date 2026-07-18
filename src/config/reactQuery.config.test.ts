import { afterEach, describe, expect, it, vi } from "vitest";

import { createQueryClient } from "./reactQuery.config";

describe("reactQuery global diagnostics", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not turn a slow anonymous mutation success into an error", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:01.000Z"));

    const client = createQueryClient();
    const mutation = client.getMutationCache().build(client, {
      mutationFn: async () => {
        vi.setSystemTime(new Date("2026-01-01T00:00:07.000Z"));
        return undefined;
      },
    });

    await expect(mutation.execute(undefined)).resolves.toBeUndefined();
  });
});
