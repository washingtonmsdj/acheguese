import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("production dependency audit gate", () => {
  it("blocks Vercel production builds on moderate+ production dependency vulnerabilities", () => {
    const source = readFileSync(
      join(ROOT, "tools/release/run-vercel-production-build.mjs"),
      "utf8",
    );

    expect(source).toContain(
      '["npm", ["audit", "--omit=dev", "--audit-level=moderate"]]',
    );
  });

  it("retries only transient npm audit provider failures without weakening the gate", () => {
    const source = readFileSync(
      join(ROOT, "tools/release/run-vercel-production-build.mjs"),
      "utf8",
    );

    expect(source).toContain("const AUDIT_MAX_ATTEMPTS = 3");
    expect(source).toContain("TRANSIENT_AUDIT_PATTERNS");
    expect(source).toContain("isAuditStep(command, args)");
    expect(source).toContain("attempt === AUDIT_MAX_ATTEMPTS");
    expect(source).not.toContain("--audit=false");
    expect(source).not.toContain("audit-level=low");
    expect(source).not.toMatch(/npm audit[^\n]*\|\|\s*true/);
  });

  it("keeps known production dependency blockers on patched versions", () => {
    const packageJson = JSON.parse(
      readFileSync(join(ROOT, "package.json"), "utf8"),
    );
    const packageLock = JSON.parse(
      readFileSync(join(ROOT, "package-lock.json"), "utf8"),
    );

    expect(packageJson.dependencies?.["maplibre-gl"]).toBe("6.4.1");
    expect(
      packageLock.packages?.["node_modules/maplibre-gl"]?.version,
    ).toBe("6.4.1");

    for (const packagePath of [
      "node_modules/postcss-nested/node_modules/postcss-selector-parser",
      "node_modules/tailwindcss/node_modules/postcss-selector-parser",
    ]) {
      expect(packageLock.packages?.[packagePath]?.version).toBe("6.1.4");
    }
  });

  it("keeps the full-tree high/critical gate while reporting production moderate+ separately", () => {
    const workflow = readFileSync(
      join(ROOT, ".github/workflows/security-scan.yml"),
      "utf8",
    );

    expect(workflow).toContain(
      "npm audit --omit=dev --audit-level=moderate",
    );
    expect(workflow).toContain("npm audit --audit-level=high");
    expect(workflow).toContain("npm audit (production moderate+)");
    expect(workflow).toContain("npm audit (full tree high/critical)");
  });
});
