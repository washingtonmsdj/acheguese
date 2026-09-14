import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

function collectSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(absolutePath);
    if (!/\.(ts|tsx)$/.test(entry.name)) return [];
    return [absolutePath];
  });
}

describe("retired generic full-screen loader", () => {
  it("does not reintroduce the blocking interstitial or its copy", () => {
    const offenders = collectSourceFiles(SRC)
      .map((filePath) => ({
        filePath,
        source: fs.readFileSync(filePath, "utf8"),
      }))
      .filter(
        ({ source }) =>
          source.includes("FullScreenLoader") ||
          source.includes("Preparando a casa para você se achegar"),
      )
      .map(({ filePath }) => path.relative(ROOT, filePath));

    expect(offenders).toEqual([]);
  });

  it("keeps app-shell suspense fallbacks visually silent", () => {
    const fullShell = fs.readFileSync(
      path.join(SRC, "app/components/FullAppRuntimeShell.tsx"),
      "utf8",
    );
    const sessionShell = fs.readFileSync(
      path.join(SRC, "app/components/SessionProfileRuntimeShell.tsx"),
      "utf8",
    );

    expect(fullShell).toContain("<Suspense fallback={null}>");
    expect(sessionShell).toContain("<Suspense fallback={null}>");
    expect(fullShell).not.toContain("PageLoader");
    expect(sessionShell).not.toContain("PageLoader");
  });

  it("uses a dependency-free passive fallback where route space must be preserved", () => {
    const passive = fs.readFileSync(
      path.join(SRC, "shared/components/loading/PassivePageFallback.tsx"),
      "utf8",
    );

    expect(passive).toContain("data-passive-page-fallback");
    expect(passive).not.toContain("lucide-react");
    expect(passive).not.toContain("setTimeout");
    expect(passive).not.toContain("animate-");
  });
});
