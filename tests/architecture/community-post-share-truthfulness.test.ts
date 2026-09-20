import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("community post share truthfulness", () => {
  const source = readFileSync("src/core/posts/utils/postShare.ts", "utf8");

  it("records sharing only after native share or clipboard copy succeeds", () => {
    const nativeShare = source.indexOf("await navigator.share(shareData)");
    const clipboardShare = source.indexOf("await navigator.clipboard.writeText(url)");
    const onShared = source.indexOf("if (succeeded && onShared)");

    expect(nativeShare).toBeGreaterThanOrEqual(0);
    expect(clipboardShare).toBeGreaterThanOrEqual(0);
    expect(onShared).toBeGreaterThan(nativeShare);
    expect(onShared).toBeGreaterThan(clipboardShare);
  });

  it("keeps manual-copy fallback useful without counting it as a completed share", () => {
    const fallbackStart = source.indexOf('toast.info("Copie o link do post"');
    const fallbackEnd = source.indexOf("}", fallbackStart);
    const fallback = source.slice(fallbackStart, fallbackEnd + 1);

    expect(fallbackStart).toBeGreaterThanOrEqual(0);
    expect(fallback).toContain("return false");
    expect(fallback).not.toContain("succeeded = true");
  });

  it("treats native share cancellation as neither success nor error", () => {
    expect(source).toContain('if (name === "AbortError")');
    expect(source).toContain("return false");
  });
});
