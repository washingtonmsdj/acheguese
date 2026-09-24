import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("production sitemap release boundary", () => {
  it("routes Vercel builds through the canonical release runner", () => {
    const vercel = JSON.parse(read("vercel.json")) as { buildCommand?: string };

    expect(vercel.buildCommand).toBe(
      "node tools/release/run-vercel-production-build.mjs",
    );
  });

  it("generates and validates sitemap before and after the production build", () => {
    const runner = read("tools/release/run-vercel-production-build.mjs");

    const generate = runner.indexOf('["npm", ["run", "generate:sitemap"]]');
    const validatePublic = runner.indexOf(
      '["node", ["tools/release/validate-production-sitemap.mjs", "public"]]',
    );
    const build = runner.indexOf('["npm", ["run", "build:vercel"]]');
    const releaseIdentity = runner.indexOf(
      '["node", ["tools/release/generate-release-identity.mjs"]]',
    );
    const validateDist = runner.indexOf(
      '["node", ["tools/release/validate-production-sitemap.mjs", "dist"]]',
    );

    expect(generate).toBeGreaterThanOrEqual(0);
    expect(validatePublic).toBeGreaterThan(generate);
    expect(build).toBeGreaterThan(validatePublic);
    expect(releaseIdentity).toBeGreaterThan(build);
    expect(validateDist).toBeGreaterThan(releaseIdentity);
  });

  it("publishes an uncached Git-backed runtime identity and waits for deployment convergence", () => {
    const releaseIdentity = read("tools/release/release-identity.mjs");
    const generator = read("tools/release/generate-release-identity.mjs");
    const waiter = read("tools/release/wait-for-production-release.mjs");
    const workflow = read(".github/workflows/ssot-tests.yml");
    const securityConfig = read("src/shared/config/security.config.ts");
    const vercel = read("vercel.json");

    expect(releaseIdentity).toContain('isSkippableVercelPath');
    expect(releaseIdentity).toContain('["ls-files", "--stage", "-z"]');
    expect(releaseIdentity).toContain('deployFingerprint');
    expect(releaseIdentity).toContain('"exact" : "equivalent"');
    expect(generator).toContain('"dist", "release.json"');
    expect(waiter).toContain("classifyReleaseIdentityMatch");
    expect(waiter).toContain('cache: "no-store"');
    expect(workflow).toContain("Wait for deployed runtime identity");
    expect(workflow).toMatch(
      /push:\r?\n\s+branches: \[main\]\r?\n\s+pull_request:/,
    );
    expect(workflow).toContain("node tools/release/wait-for-production-release.mjs");
    expect(securityConfig).toContain("RELEASE_IDENTITY");
    expect(securityConfig).toContain("pattern: '/release.json'");
    expect(vercel).toContain('"source": "/release.json"');
    expect(vercel).toContain('"no-cache, no-store, must-revalidate"');
  });

  it("keeps robots pointing at the same production sitemap origin", () => {
    const robots = read("public/robots.txt");
    const generator = read("tools/release/generate-sitemap.ts");

    expect(robots).toContain("Sitemap: https://acheguese.com.br/sitemap.xml");
    expect(generator).toContain(
      'const PRODUCTION_SITEMAP_BASE_URL = "https://acheguese.com.br";',
    );
  });

  it("reuses canonical legal paths instead of redefining them in the sitemap", () => {
    const sitemap = read("src/core/routing/seo/generateSitemap.ts");
    const legal = read("src/shared/constants/legal.ts");

    expect(legal).toContain('TERMS_OF_SERVICE_PATH = "/termos"');
    expect(legal).toContain('PRIVACY_POLICY_PATH = "/privacidade"');
    expect(legal).toContain('SUPPORT_PATH = "/contato"');

    expect(sitemap).toContain("TERMS_OF_SERVICE_PATH");
    expect(sitemap).toContain("PRIVACY_POLICY_PATH");
    expect(sitemap).toContain("SUPPORT_PATH");
    expect(sitemap).not.toContain("{ path: '/termos'");
    expect(sitemap).not.toContain("{ path: '/privacidade'");
    expect(sitemap).not.toContain("{ path: '/contato'");
  });

  it("resolves sitemap lifecycle at the release composition boundary", () => {
    const releaseScript = read("tools/release/generate-sitemap.ts");
    const releaseSitemap = read("src/core/routing/seo/generateSitemap.ts");

    expect(releaseScript).toContain("isProductModuleEnabled");
    expect(releaseScript).toContain("isPlatformCapabilityEnabled");
    expect(releaseScript).toContain("isSitemapSurfaceEnabled");
    expect(releaseScript).toContain("surfaceScope");
    expect(releaseSitemap).toContain(
      "TERRITORY_SITEMAP_MODULES.filter((module) => surfaceScope.isEnabled(module.surface))",
    );
    expect(releaseSitemap).toContain("surfaceScope.isEnabled('nearby')");
    expect(releaseSitemap).toContain("APP_MODULE_SLUGS.nearby");
    expect(releaseSitemap).not.toContain("@/app/config");
    expect(releaseSitemap).not.toContain("isLaunchSurfaceEnabled");
    expect(releaseSitemap).not.toContain("{ path: '/inicio'");
  });

  it("keeps the public Edge endpoint as a thin compatibility redirect to the canonical sitemap", () => {
    const edgeSitemap = read("supabase/functions/sitemap/index.ts");

    expect(edgeSitemap).toContain("new URL('/sitemap.xml'");
    expect(edgeSitemap).toContain("status: 308");
    expect(edgeSitemap).toContain("Location: canonicalSitemapUrl");
    expect(edgeSitemap).toContain("rateLimitMiddleware(req");
    expect(edgeSitemap).not.toContain("createClient");
    expect(edgeSitemap).not.toContain(".from(");
    expect(edgeSitemap).not.toContain("community_public_aliases");
    expect(edgeSitemap).not.toContain("events");
    expect(edgeSitemap).not.toContain("classifieds");
    expect(edgeSitemap).not.toContain("gastronomia");
    expect(edgeSitemap).not.toContain("servicos");
  });
});