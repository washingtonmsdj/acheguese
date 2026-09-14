import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("Edge rate-limit CORS method contracts", () => {
  it("derives 429 CORS methods from the actual request when no explicit contract is provided", () => {
    const security = read("supabase/functions/_shared/security.ts");
    const rateLimitStart = security.indexOf(
      "export async function rateLimitMiddleware",
    );
    const validationStart = security.indexOf(
      "// INPUT VALIDATION",
      rateLimitStart,
    );
    const rateLimitBlock = security.slice(rateLimitStart, validationStart);

    expect(rateLimitBlock).toContain("methods?: string");
    expect(rateLimitBlock).toContain(
      "const responseMethods = methods ?? `${req.method}, OPTIONS`;",
    );
    expect(rateLimitBlock).toContain(
      "getAllSecurityHeaders(responseMethods, req)",
    );
    expect(rateLimitBlock).not.toContain(
      "getAllSecurityHeaders('POST, OPTIONS', req)",
    );
  });

  it("keeps GET-only endpoints compatible with the request-derived fallback", () => {
    for (const file of [
      "supabase/functions/sitemap/index.ts",
      "supabase/functions/health-check/index.ts",
    ]) {
      const source = read(file);
      expect(source).toContain("requireHttpMethod(req, ['GET'], 'GET, OPTIONS')");
      expect(source).toContain("rateLimitMiddleware(req");
    }
  });

  it("passes the full contract for the GET/POST push-config endpoint", () => {
    const source = read("supabase/functions/get-push-config/index.ts");

    expect(source).toContain("const ALLOWED_METHODS = 'GET, POST, OPTIONS';");
    expect(source).toContain(
      "rateLimitMiddleware(req, 100, 60_000, ALLOWED_METHODS)",
    );
  });
});
