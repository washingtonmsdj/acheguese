import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const OWNER = path.normalize("src/shared/accessibility/preferences.ts");
const STORAGE_KEY_LITERALS = [
  '"accessibility-high-contrast"',
  '"accessibility-font-size"',
  "'accessibility-high-contrast'",
  "'accessibility-font-size'",
];

function collectSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(absolute);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [absolute] : [];
  });
}

describe("accessibility preferences SSOT", () => {
  it("owns persistence keys in one dependency-light module", () => {
    const offenders = collectSourceFiles(SRC)
      .map((absolute) => ({
        relative: path.normalize(path.relative(ROOT, absolute)),
        source: fs.readFileSync(absolute, "utf8"),
      }))
      .filter(({ relative, source }) =>
        relative !== OWNER &&
        STORAGE_KEY_LITERALS.some((literal) => source.includes(literal)),
      )
      .map(({ relative }) => relative);

    expect(offenders).toEqual([]);
  });

  it("keeps lean root and full provider on the same pure owner", () => {
    const runtime = fs.readFileSync(
      path.join(ROOT, "src/app/components/AppRuntime.tsx"),
      "utf8",
    );
    const provider = fs.readFileSync(
      path.join(
        ROOT,
        "src/shared/components/accessibility/AccessibilityProvider.tsx",
      ),
      "utf8",
    );
    const owner = fs.readFileSync(path.join(ROOT, OWNER), "utf8");

    expect(runtime).toContain("readAccessibilityPreferences");
    expect(runtime).toContain("applyAccessibilityPreferences");
    expect(provider).toContain("readAccessibilityPreferences");
    expect(provider).toContain("applyAccessibilityPreferences");
    expect(provider).toContain("persistAccessibilityHighContrast");
    expect(provider).toContain("persistAccessibilityFontSize");

    expect(owner).not.toContain('from "react"');
    expect(owner).not.toContain("createContext");
    expect(owner).not.toContain("useEffect");
  });
});
