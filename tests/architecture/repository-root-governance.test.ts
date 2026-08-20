import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("repository root governance", () => {
  it("uses npm as the single package-manager SSOT", () => {
    const packageJson = JSON.parse(read("package.json")) as {
      packageManager?: string;
    };

    expect(packageJson.packageManager).toMatch(/^npm@/);
    expect(exists("package-lock.json")).toBe(true);
    expect(exists("bun.lock")).toBe(false);
    expect(exists("bun.lockb")).toBe(false);
  });

  it("keeps removed one-off configs from returning", () => {
    expect(exists("playwright.mapa.config.ts")).toBe(false);
    expect(exists("tsconfig.typecheck.events-checkin.json")).toBe(false);
  });

  it("treats manual QA captures as runtime artifacts, not source", () => {
    const gitignore = read(".gitignore");
    expect(gitignore).toContain("/product-qa-screenshots/");
  });

  it("keeps the Maps CI job delegated to the canonical validator", () => {
    const workflow = read(".github/workflows/security-check.yml");

    expect(workflow).toContain("npm run validate:maps");
    expect(workflow).toContain("npm run lint:maps");
    expect(workflow).not.toContain("src/test-maps-violation-1.ts");
    expect(workflow).not.toContain("src/modules/test-maps-violation-2.ts");
  });

  it("does not fall back to the old Ordax Sentry project", () => {
    const viteConfig = read("vite.config.ts");

    expect(viteConfig).not.toContain('SENTRY_ORG || "ordax"');
    expect(viteConfig).not.toContain('SENTRY_PROJECT || "ordax-saas"');
    expect(viteConfig).toContain('SENTRY_ORG || "acheguese"');
    expect(viteConfig).toContain('SENTRY_PROJECT || "acheguese-web"');
  });
});
