import { describe, expect, it } from "vitest";
import { resolveSafeInternalPath } from "../safeRedirect";

describe("resolveSafeInternalPath", () => {
  it("keeps relative application paths", () => {
    expect(resolveSafeInternalPath("/central?tab=orders#today")).toBe("/central?tab=orders#today");
  });

  it("converts same-origin absolute URLs to router paths", () => {
    expect(resolveSafeInternalPath(`${window.location.origin}/central/motoboy/entregas`)).toBe(
      "/central/motoboy/entregas",
    );
  });

  it("blocks external and protocol-relative redirects", () => {
    expect(resolveSafeInternalPath("https://example.com/phishing")).toBe("/");
    expect(resolveSafeInternalPath("//example.com/phishing")).toBe("/");
  });
});
