import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const canonicalDocs = [
  "README.md",
  "docs/README.md",
  "docs/FEATURE-MAP.md",
  "docs/SCREEN-MAP.md",
  "docs/05-ux/HOME-SPEC.md",
  "docs/05-ux/HOME-INVENTORY.md",
] as const;

describe("MVP lifecycle documentation SSOT", () => {
  const platformRegistry = read("src/app/config/platformCapabilityRegistry.ts");

  it("keeps messaging and notifications active and independent from product modules", () => {
    for (const capability of ["messaging", "notifications"]) {
      const block =
        platformRegistry.match(
          new RegExp(`\\n  ${capability}: \\{[\\s\\S]*?\\n  \\},`),
        )?.[0] ?? "";
      expect(block).toContain('status: "active"');
      expect(block).not.toContain("dependsOnProductModules");
    }
  });

  it("keeps canonical living docs aligned with active platform ownership", () => {
    const combined = canonicalDocs.map(read).join("\n");
    expect(combined).not.toContain("`messaging=false`");
    expect(combined).not.toContain("`notifications=false`");
    expect(combined).not.toMatch(/Mensagens e Notificações[^\n]*pausad/i);
    expect(combined).toContain("Mensagens");
    expect(combined).toContain("Notificações");
  });

  it("documents that pausing a vertical cannot disable platform capabilities", () => {
    const rootReadme = read("README.md");
    expect(rootReadme).toContain("Pausar um domínio remove apenas suas contribuições");
    expect(rootReadme).toContain("não desativa capabilities horizontais da plataforma");
  });
});
