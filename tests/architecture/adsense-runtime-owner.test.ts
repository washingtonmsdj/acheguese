import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const OWNER = path.normalize("src/shared/components/advertising/AdSense.tsx");

function collectSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(absolute);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [absolute] : [];
  });
}

describe("AdSense runtime owner", () => {
  it("keeps provider loading and publisher env behind the slot component", () => {
    const offenders = collectSourceFiles(SRC)
      .map((absolute) => ({
        relative: path.normalize(path.relative(ROOT, absolute)),
        source: fs.readFileSync(absolute, "utf8"),
      }))
      .filter(
        ({ relative, source }) =>
          relative !== OWNER &&
          (source.includes("adsbygoogle.js") ||
            source.includes("VITE_ADSENSE_CLIENT_ID") ||
            /ca-pub-\d{6,}/.test(source)),
      )
      .map(({ relative }) => relative)
      .sort();

    expect(offenders).toEqual([]);

    const owner = fs.readFileSync(path.join(ROOT, OWNER), "utf8");
    expect(owner).toContain("VITE_ADSENSE_CLIENT_ID");
    expect(owner).toContain("adsbygoogle.js");
    expect(owner).toContain("adsenseScriptPromises");
    expect(owner).toContain('addEventListener("load", handleLoad');
    expect(owner).not.toMatch(/ca-pub-\d{6,}/);
  });
});
