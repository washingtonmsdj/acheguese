import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync("supabase/functions/get-push-config/index.ts", "utf8");
const config = readFileSync("supabase/config.toml", "utf8");

describe("get-push-config public runtime contract", () => {
  it("is intentionally public at the gateway", () => {
    expect(config).toContain("[functions.get-push-config]\nverify_jwt = false");
  });

  it("does not use wildcard CORS or expose internal errors", () => {
    expect(source).toContain("getAllSecurityHeaders");
    expect(source).not.toContain("'Access-Control-Allow-Origin': '*'");
    expect(source).not.toContain("details: String(error)");
  });

  it("keeps a deploy-safe public compatibility key while preferring env configuration", () => {
    expect(source).toContain("Deno.env.get('VAPID_PUBLIC_KEY')?.trim() || LEGACY_PUBLIC_VAPID_KEY");
    expect(source).toContain("vapidPublicKey: getVapidPublicKey()");
  });

  it("keeps method and rate-limit guards", () => {
    expect(source).toContain("requireHttpMethod");
    expect(source).toContain("rateLimitMiddleware(req, 100, 60_000)");
  });
});
