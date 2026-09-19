import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(
  resolve(process.cwd(), "src/modules/guide/components/TouristPointMapSection.tsx"),
  "utf8",
);

describe("tourist map coordinate copy truthfulness", () => {
  it("only confirms coordinate copy after clipboard success", () => {
    expect(page).toContain("const handleCopyCoordinates = async () =>");
    expect(page).toContain("if (!navigator.clipboard?.writeText)");
    expect(page).toContain("await navigator.clipboard.writeText(coords)");
    expect(page).toContain("Coordenadas copiadas!");
    expect(page).toContain("Não foi possível copiar as coordenadas");

    const writeIndex = page.indexOf("await navigator.clipboard.writeText(coords)");
    const successIndex = page.indexOf("Coordenadas copiadas!");
    expect(writeIndex).toBeGreaterThan(-1);
    expect(successIndex).toBeGreaterThan(writeIndex);
  });
});
