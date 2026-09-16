import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HibpService } from "./HibpService";

const fetchMock = vi.fn();

function sha1(password: string): string {
  return createHash("sha1").update(password).digest("hex").toUpperCase();
}

describe("HibpService", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends only the SHA-1 prefix and detects a compromised suffix with LF responses", async () => {
    const password = "SenhaVazada@2026";
    const hash = sha1(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    fetchMock.mockResolvedValue(
      new Response(`${suffix}:321\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:1`, {
        status: 200,
      }),
    );

    await expect(HibpService.checkPassword(password)).resolves.toEqual({
      isPwned: true,
      count: 321,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      expect.objectContaining({
        headers: { "Add-Padding": "true" },
        signal: expect.any(AbortSignal),
      }),
    );
    expect(JSON.stringify(fetchMock.mock.calls[0])).not.toContain(password);
  });

  it("accepts CRLF range responses and returns clean when the suffix is absent", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:10\r\nBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB:20\r\n",
        { status: 200 },
      ),
    );

    await expect(HibpService.checkPassword("SenhaUnica@2026")).resolves.toEqual({
      isPwned: false,
      count: 0,
    });
  });

  it("rejects provider failures so the caller can apply the documented availability policy", async () => {
    fetchMock.mockResolvedValue(new Response("unavailable", { status: 503 }));

    await expect(HibpService.checkPassword("SenhaSegura@2026")).rejects.toThrow(
      "HIBP API error: 503",
    );
  });
});
