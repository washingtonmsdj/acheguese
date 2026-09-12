import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Generic service generator retirement", () => {
  const generator = read("tools/architecture/generate-service-template.ts");

  it("keeps the compatibility command fail-closed", () => {
    expect(generator).toContain("generate:service foi aposentado");
    expect(generator).toContain("process.exitCode = 1");
  });

  it("does not infer persistence or emit generic CRUD", () => {
    expect(generator).not.toContain("tableName");
    expect(generator).not.toContain("writeFileSync");
    expect(generator).not.toContain("mkdirSync");
    expect(generator).not.toContain("@/integrations/supabase");
    expect(generator).not.toContain(".select('*')");
    expect(generator).not.toContain(".insert(");
    expect(generator).not.toContain(".update(");
  });

  it("does not generate placeholder tests", () => {
    expect(generator).not.toContain("expect(true).toBe(true)");
    expect(generator).not.toContain("TODO: Implementar teste");
  });
});
