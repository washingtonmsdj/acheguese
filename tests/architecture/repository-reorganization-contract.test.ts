import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const PERMANENT_PLAN = "URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md";
const LEGACY_FEATURE_ROOTS = ["events"] as const;

function listDirectories(relativePath: string): string[] {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) return [];

  return fs
    .readdirSync(absolutePath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

describe("global repository reorganization contract", () => {
  it("keeps the urgent architecture plan permanently at repository root", () => {
    const planPath = path.join(ROOT, PERMANENT_PLAN);

    expect(fs.existsSync(planPath)).toBe(true);

    const content = fs.readFileSync(planPath, "utf8");
    expect(content).toContain("ARQUIVO PERMANENTE DA RAIZ");
    expect(content).toContain("NÃO MOVA ESTE ARQUIVO");
    expect(content).toContain("G0 — Repository Census");
    expect(content).toContain("G7 — Repository / MVP Certification");
  });

  it("ratchets src/features to the single known legacy owner during migration", () => {
    expect(listDirectories("src/features")).toEqual([...LEGACY_FEATURE_ROOTS]);
  });

  it("keeps the canonical Events product destination present before the physical move", () => {
    expect(fs.existsSync(path.join(ROOT, "src/modules/community-events"))).toBe(true);
  });
});
