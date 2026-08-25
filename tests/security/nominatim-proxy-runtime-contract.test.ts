import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync("supabase/functions/nominatim-proxy/index.ts", "utf8");

describe("nominatim proxy runtime security contract", () => {
  it("keeps the upstream HTTPS-only and deploy-safe without mandatory public env vars", () => {
    expect(source).toContain("https://nominatim.openstreetmap.org");
    expect(source).toContain("parsedUrl.protocol !== 'https:'");
    expect(source).toContain("envOrDefault('NOMINATIM_BASE_URL'");
    expect(source).not.toContain("getRequiredEnv('NOMINATIM_BASE_URL')");
  });

  it("strictly bounds attacker-controlled upstream parameters", () => {
    expect(source).toContain("parsed < 1 || parsed > 10");
    expect(source).toContain("parsed < 0 || parsed > 18");
    expect(source).toContain("resolved !== 'json' && resolved !== 'jsonv2'");
    expect(source).toContain("isCommaSeparatedCountryCodes");
  });

  it("does not special-case localhost CORS in production code", () => {
    expect(source).not.toContain("isLocalhostOrigin");
    expect(source).not.toContain("allowLocalhost");
    expect(source).toContain("getAllSecurityHeaders(ALLOWED_METHODS, req)");
  });

  it("fails closed on upstream HTTP errors", () => {
    expect(source).toContain("if (!response.ok)");
    expect(source).toContain("Nominatim upstream returned");
  });
});
