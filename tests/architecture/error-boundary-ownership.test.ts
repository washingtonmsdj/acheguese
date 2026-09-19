import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("ErrorBoundary ownership", () => {
  it("keeps one canonical rich React ErrorBoundary implementation", () => {
    const canonical = "src/shared/components/errors/ErrorBoundary.tsx";

    expect(existsSync(resolve(ROOT, canonical))).toBe(true);
    expect(
      existsSync(resolve(ROOT, "src/app/components/ErrorBoundary.tsx")),
    ).toBe(false);
    expect(
      existsSync(
        resolve(ROOT, "src/modules/mobility/components/ErrorBoundary.tsx"),
      ),
    ).toBe(false);

    const source = read(canonical);
    expect(source).toContain("export class ErrorBoundary");
    expect(source).toContain("captureSentryException(error, context)");
    expect(source).toContain("this.props.onReset?.()");
    expect(source).not.toContain("export function useErrorHandler");
    expect(source).not.toContain("import React,");
  });

  it("routes app and mobility consumers through the shared owner", () => {
    const shell = read("src/app/components/FullAppRuntimeShell.tsx");
    expect(shell).toContain(
      'from "@/shared/components/errors/ErrorBoundary"',
    );
    expect(shell).toContain(
      '<ErrorBoundary onReset={() => window.location.reload()}>',
    );
    expect(shell).not.toContain("@/app/components/ErrorBoundary");

    for (const page of [
      "src/modules/mobility/pages/MotoboyPage.tsx",
      "src/modules/mobility/pages/MotoristaPage.tsx",
      "src/modules/mobility/pages/PassageiroPage.tsx",
    ]) {
      const source = read(page);
      expect(source).toContain(
        'from "@/shared/components/errors/ErrorBoundary"',
      );
      expect(source).toContain('from "../components/ErrorState"');
      expect(source).not.toContain("../components/ErrorBoundary");
      expect(source).not.toContain("\\nimport { ErrorState");
    }
  });

  it("keeps barrels and architecture registry free of retired owners", () => {
    const appBarrel = read("src/app/components/index.ts");
    const registry = read("tools/architecture/architecture-registry.ts");

    expect(appBarrel).not.toContain(
      'export { ErrorBoundary } from "./ErrorBoundary"',
    );
    expect(registry).toContain(
      '"src/shared/components/errors/ErrorBoundary.tsx"',
    );
    expect(registry).not.toContain('"src/app/components/ErrorBoundary.tsx"');
  });
});
