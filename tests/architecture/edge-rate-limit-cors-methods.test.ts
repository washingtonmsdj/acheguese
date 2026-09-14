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

  it("keeps admin auth failures request-aware instead of falling back to POST CORS", () => {
    const source = read("supabase/functions/_shared/adminAuth.ts");

    expect(source).toContain('methods = `${req.method}, OPTIONS`');
    expect(source).toContain(
      "errorResponse('Missing or invalid authorization header', 401, undefined, req, methods)",
    );
    expect(source).toContain(
      "errorResponse('Forbidden: Admin access required', 403, undefined, req, methods)",
    );
    expect(source).toContain("requireAdmin(req, methods)");
  });

  it("keeps the protected health check on canonical security and storage owners", () => {
    const source = read("supabase/functions/health-check/index.ts");

    expect(source).toContain('import { requireAdmin } from "../_shared/adminAuth.ts";');
    expect(source).toContain("const auth = await requireAdmin(req)");
    expect(source).toContain("supabase.storage.getBucket('media-assets')");
    expect(source).not.toContain("Access-Control-Allow-Origin': '*'");
    expect(source).not.toContain(".from('avatars')");
  });
});
