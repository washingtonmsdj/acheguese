import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const CONFIG_PATH = "eslint.config.js";

function explicitFileLiterals(config: string): string[] {
  return [
    ...config.matchAll(
      /["']((?:src|api|supabase)\/[^"'*{}]+?\.(?:ts|tsx))["']/g,
    ),
  ]
    .map((match) => match[1])
    .filter((path, index, values) => values.indexOf(path) === index)
    .sort();
}

describe("ESLint config hygiene", () => {
  const config = readFileSync(CONFIG_PATH, "utf8");

  it("does not keep exceptions or ignores for deleted source files", () => {
    const missing = explicitFileLiterals(config).filter(
      (path) => !existsSync(path),
    );

    expect(missing).toEqual([]);
  });

  it("does not disable the TypeScript comment safety rule globally by file", () => {
    expect(config).not.toContain(
      '"@typescript-eslint/ban-ts-comment": "off"',
    );
  });

  it("does not restore the retired Maps legacy-debt allowlist", () => {
    expect(config).not.toContain("DÍVIDA TÉCNICA MAPS");
    expect(config).not.toContain("src/core/maps/services/MapsService.ts");
    expect(config).not.toContain("src/core/maps/services/mapService.ts");
    expect(config).not.toContain(
      "src/integrations/maps/services/GeospatialServiceMock.ts",
    );
  });
});
