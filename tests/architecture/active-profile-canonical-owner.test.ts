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

describe("active profile canonical ownership", () => {
  it("keeps the retired useActiveProfile hook absent from active source", () => {
    expect(
      fs.existsSync(path.join(SRC, "core/profiles/hooks/useActiveProfile.ts")),
    ).toBe(false);

    const offenders = collectSourceFiles(SRC)
      .filter((filePath) =>
        fs.readFileSync(filePath, "utf8").includes("useActiveProfile"),
      )
      .map((filePath) => path.relative(ROOT, filePath));

    expect(offenders).toEqual([]);
  });

  it("uses the existing multi-profile runtime owner for identity settings", () => {
    const page = fs.readFileSync(
      path.join(SRC, "app/pages/ProfileSettingsPage.tsx"),
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

    expect(page).toContain("useMultiProfileContext");
    expect(page).not.toContain("useActiveProfile");
    expect(hooksBarrel).not.toContain("useActiveProfile");
    expect(validator).toContain("/\\buseActiveProfile\\b/");
    expect(validator).not.toContain(
      "'src/core/profiles/hooks/useActiveProfile.ts'",
    );
    expect(validator).not.toContain("'src/app/pages/ProfileSettingsPage.tsx'");
  });
});
