import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SRC_ROOT = join(ROOT, "src");
const APP_RUNTIME = join(ROOT, "src/app/components/AppRuntime.tsx");
const PACKAGE_JSON = join(ROOT, "package.json");

const FRAMEWORK_OR_DATA_MODE_EXPORTS = new Set([
  "createBrowserRouter",
  "createHashRouter",
  "createMemoryRouter",
  "createRequestHandler",
  "createStaticHandler",
  "createStaticRouter",
  "HydratedRouter",
  "RouterProvider",
  "ServerRouter",
  "StaticRouterProvider",
  "defer",
  "json",
  "unstable_RSCStaticRouter",
]);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const absolute = join(directory, entry);
    const stat = statSync(absolute);

    if (stat.isDirectory()) {
      return sourceFiles(absolute);
    }

    return /\.[cm]?[jt]sx?$/.test(entry) ? [absolute] : [];
  });
}

function importedRouterSymbols(source: string): string[] {
  const symbols: string[] = [];
  const importPattern =
    /import\s+(?:type\s+)?\{([\s\S]*?)\}\s+from\s+["'](?:react-router|react-router-dom)["'];?/g;

  for (const match of source.matchAll(importPattern)) {
    const specifiers = match[1]
      .split(",")
      .map((specifier) => specifier.trim())
      .filter(Boolean)
      .map((specifier) => specifier.replace(/^type\s+/, ""))
      .map((specifier) => specifier.split(/\s+as\s+/)[0].trim());

    symbols.push(...specifiers);
  }

  return symbols;
}

function parseMajor(range: string): number {
  const match = range.match(/\d+/);
  if (!match) throw new Error(`Unable to parse semver range: ${range}`);
  return Number(match[0]);
}

function parseVersion(range: string): [number, number, number] {
  const match = range.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) throw new Error(`Unable to parse semver range: ${range}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

describe("React Router v7 readiness ratchet", () => {
  it("keeps the declarative runtime opted into v7 behavior while the dependency is still v6", () => {
    const packageJson = JSON.parse(readFileSync(PACKAGE_JSON, "utf8")) as {
      dependencies: Record<string, string>;
      engines?: Record<string, string>;
    };
    const routerRange = packageJson.dependencies["react-router-dom"];
    const routerMajor = parseMajor(routerRange);
    const runtime = readFileSync(APP_RUNTIME, "utf8");

    expect(packageJson.engines?.node).toBe("24.x");
    expect(parseMajor(packageJson.dependencies.react)).toBeGreaterThanOrEqual(18);
    expect(parseMajor(packageJson.dependencies["react-dom"])).toBeGreaterThanOrEqual(18);
    expect([6, 7]).toContain(routerMajor);

    if (routerMajor === 6) {
      // 6.30.5/6 do not close the July 2026 advisories. Do not create a false
      // security fix while the npm/lockfile lifecycle is unavailable.
      expect(routerRange).toBe("^6.30.4");
      expect(runtime).toMatch(/v7_startTransition\s*:\s*true/);
      expect(runtime).toMatch(/v7_relativeSplatPath\s*:\s*true/);
      return;
    }

    // v7.18.2 backported the RSC CSRF hardening and v7.18.3 added further URL
    // validation. The G5 upgrade target must not land below that boundary.
    const [, minor, patch] = parseVersion(routerRange);
    expect(minor > 18 || (minor === 18 && patch >= 3)).toBe(true);
    expect(runtime).not.toMatch(/v7_startTransition\s*:/);
    expect(runtime).not.toMatch(/v7_relativeSplatPath\s*:/);
  });

  it("keeps application routing in Declarative Mode during the security upgrade", () => {
    const violations: string[] = [];

    for (const file of sourceFiles(SRC_ROOT)) {
      const source = readFileSync(file, "utf8");
      const forbidden = importedRouterSymbols(source).filter((symbol) =>
        FRAMEWORK_OR_DATA_MODE_EXPORTS.has(symbol),
      );

      if (forbidden.length > 0) {
        violations.push(`${relative(ROOT, file)}: ${forbidden.join(", ")}`);
      }
    }

    expect(violations).toEqual([]);
  });

  it("does not introduce React Router framework/RSC packages into the browser app", () => {
    const packageJson = JSON.parse(readFileSync(PACKAGE_JSON, "utf8")) as {
      dependencies: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const allDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    const forbiddenPackages = Object.keys(allDependencies).filter(
      (name) => name.startsWith("@react-router/") || name === "@remix-run/server-runtime",
    );

    expect(forbiddenPackages).toEqual([]);
  });
});
