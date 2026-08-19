import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SECURITY = join(ROOT, "supabase", "functions", "_shared", "security.ts");
const ADMIN_AUTH = join(ROOT, "supabase", "functions", "_shared", "adminAuth.ts");
const CLEANUP = join(ROOT, "supabase", "functions", "media-assets-cleanup", "index.ts");

describe("edge audit IP normalization", () => {
  it("keeps one trusted client IP precedence contract in the shared security helper", () => {
    const source = readFileSync(SECURITY, "utf8");

    expect(source).toContain("export function getTrustedClientIp");
    expect(source).toContain("cf-connecting-ip");
    expect(source).toContain("x-real-ip");
    expect(source).toContain("x-forwarded-for");
    expect(source).toMatch(/split\(','\)\.at\(-1\)\?\.trim\(\)/);
    expect(source).toContain("return cfIp || realIp || lastForwardedIp || null");
  });

  it("uses the trusted helper for admin auth audit metadata without changing authorization", () => {
    const source = readFileSync(ADMIN_AUTH, "utf8");

    expect(source).toContain("getTrustedClientIp");
    expect(source).toContain("const ip = getTrustedClientIp(req)");
    expect(source).toContain("...(ip ? { ip } : {})");
    expect(source).not.toContain("getAuditInfo");
    expect(source).toContain("supabase.auth.getUser(token)");
    expect(source).toContain(".eq('is_active', true)");
    expect(source).toContain(".is('revoked_at', null)");
  });

  it("uses the nearest-proxy forwarded IP for cleanup audit events", () => {
    const source = readFileSync(CLEANUP, "utf8");

    expect(source).toContain('req.headers.get("cf-connecting-ip")');
    expect(source).toContain('req.headers.get("x-real-ip")');
    expect(source).toContain('req.headers.get("x-forwarded-for")');
    expect(source).toMatch(/split\(","\)\.at\(-1\)\?\.trim\(\)/);
    expect(source).toContain("ip: getAuditIp(req)");
    expect(source).not.toContain("...getAuditInfo(req)");
    expect(source).toContain("requireCronSecret(req, ALLOWED_METHODS)");
  });
});
