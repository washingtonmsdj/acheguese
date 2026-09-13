import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Generic service generator retirement", () => {
  it("removes the compatibility command and generator from active tooling", () => {
    const packageJson = read("package.json");

    expect(packageJson).not.toContain('"generate:service"');
    expect(
      existsSync(resolve(root, "tools/architecture/generate-service-template.ts")),
    ).toBe(false);
  });
});
