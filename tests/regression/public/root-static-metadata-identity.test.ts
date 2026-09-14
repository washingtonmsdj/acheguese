import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("public root static metadata identity", () => {
  it("keeps crawler metadata aligned with the approved root concept", () => {
    const html = read("index.html");
    const homeSpec = read("docs/05-ux/HOME-SPEC.md");

    expect(homeSpec).toContain("Seu lugar, mais perto.");
    expect(html).toContain("<title>Achegue-se | Seu lugar, mais perto.</title>");
    expect(html).toContain('rel="canonical" href="https://acheguese.com.br/"');
    expect(html).toContain(
      'property="og:title" content="Achegue-se | Seu lugar, mais perto."',
    );
    expect(html).toContain(
      'name="twitter:title" content="Achegue-se | Seu lugar, mais perto."',
    );
    expect(html).toContain('property="og:url" content="https://acheguese.com.br/"');
  });

  it("keeps browser and PWA chrome on the canonical visual identity", () => {
    const html = read("index.html");
    const manifest = JSON.parse(read("public/manifest.json")) as {
      theme_color?: string;
      background_color?: string;
      description?: string;
    };
    const identity = read("docs/04-design/ACHEGUE-SE-VISUAL-IDENTITY.md");
    const css = read("src/index.css");

    expect(identity).toContain("#123E3D");
    expect(identity).toContain("#FAFBF7");
    expect(css).toContain("--brand-petroleum: 178 55% 16%; /* #123E3D */");
    expect(css).toContain("--brand-surface: 72 20% 97.5%; /* #FAFBF7 */");
    expect(html).toContain('name="theme-color" content="#123E3D"');
    expect(manifest.theme_color).toBe("#123E3D");
    expect(manifest.background_color).toBe("#FAFBF7");
    expect(manifest.description).toContain("Seu lugar, mais perto.");
  });
});
