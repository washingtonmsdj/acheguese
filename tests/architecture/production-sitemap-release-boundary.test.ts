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
    const validateDist = runner.indexOf(
      '["node", ["tools/release/validate-production-sitemap.mjs", "dist"]]',
    );

    expect(generate).toBeGreaterThanOrEqual(0);
    expect(validatePublic).toBeGreaterThan(generate);
    expect(build).toBeGreaterThan(validatePublic);
    expect(validateDist).toBeGreaterThan(build);
  });

  it("keeps robots pointing at the same production sitemap origin", () => {
    const robots = read("public/robots.txt");
    const generator = read("tools/release/generate-sitemap.ts");

    expect(robots).toContain("Sitemap: https://acheguese.com.br/sitemap.xml");
    expect(generator).toContain(
      'const PRODUCTION_SITEMAP_BASE_URL = "https://acheguese.com.br";',
    );
  });
});
