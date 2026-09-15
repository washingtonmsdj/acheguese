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

describe("multi-profile list canonical ownership", () => {
  it("keeps the duplicate useProfiles hook retired", () => {
    expect(
      fs.existsSync(path.join(SRC, "core/profiles/hooks/useProfiles.ts")),
    ).toBe(false);

    const offenders = collectSourceFiles(SRC)
      .filter((filePath) =>
        fs.readFileSync(filePath, "utf8").includes("useProfiles"),
      )
      .map((filePath) => path.relative(ROOT, filePath));

    expect(offenders).toEqual([]);
  });

  it("reuses the multi-profile runtime context for profile link options", () => {
    const manager = fs.readFileSync(
      path.join(SRC, "core/profiles/components/ProfileLinksManager.tsx"),
      "utf8",
    );
    const hooksBarrel = fs.readFileSync(
      path.join(SRC, "core/profiles/hooks/index.ts"),
      "utf8",
    );
    const validator = fs.readFileSync(
      path.join(ROOT, "tools/architecture/validate-session-context.ts"),
      "utf8",
    );

    expect(manager).toContain("useMultiProfileContext");
    expect(manager).toContain("allProfiles: profiles");
    expect(manager).not.toContain("useProfiles");
    expect(hooksBarrel).not.toContain("useProfiles");
    expect(validator).not.toContain("'src/core/profiles/hooks/useProfiles.ts'");
    expect(validator).not.toContain(
      "'src/core/profiles/components/ProfileLinksManager.tsx'",
    );
  });
});
