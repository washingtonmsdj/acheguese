import { describe, expect, it } from "vitest";
import {
  resolveOptionalSafeInternalPath,
  resolveSafeHttpUrl,
  resolveSafeInternalPath,
} from "../safeRedirect";

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

describe("resolveOptionalSafeInternalPath", () => {
  it("returns safe internal routes without inventing a fallback", () => {
    expect(resolveOptionalSafeInternalPath("/mapa?lat=-12.9&lng=-38.5#resultado")).toBe(
      "/mapa?lat=-12.9&lng=-38.5#resultado",
    );
    expect(
      resolveOptionalSafeInternalPath(`${window.location.origin}/empresas/padaria-central`),
    ).toBe("/empresas/padaria-central");
  });

  it("fails closed for unsafe, external or malformed routes", () => {
    expect(resolveOptionalSafeInternalPath("https://example.com/phishing")).toBeNull();
    expect(resolveOptionalSafeInternalPath("//example.com/phishing")).toBeNull();
    expect(resolveOptionalSafeInternalPath("javascript:alert(1)")).toBeNull();
    expect(resolveOptionalSafeInternalPath("/%2f%2fevil.example/path")).toBeNull();
    expect(resolveOptionalSafeInternalPath("/safe\\evil")).toBeNull();
    expect(resolveOptionalSafeInternalPath(null)).toBeNull();
  });
});

describe("resolveSafeHttpUrl", () => {
  it("normalizes host-only URLs to HTTPS", () => {
    expect(resolveSafeHttpUrl("example.com/path")).toBe("https://example.com/path");
    expect(resolveSafeHttpUrl("http://example.com")).toBe("https://example.com/");
  });

  it("blocks non-HTTP, relative, protocol-relative and control-character URLs", () => {
    expect(resolveSafeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(resolveSafeHttpUrl("/internal")).toBeNull();
    expect(resolveSafeHttpUrl("//example.com")).toBeNull();
    expect(resolveSafeHttpUrl("example.com/\npath")).toBeNull();
  });
});