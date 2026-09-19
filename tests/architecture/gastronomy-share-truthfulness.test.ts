import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const dialog = readFileSync(
  resolve(root, "src/modules/business/gastronomy/components/GastronomyShareDialog.tsx"),
  "utf8",
);
const detail = readFileSync(
  resolve(root, "src/modules/business/gastronomy/pages/GastronomyDetailPage.tsx"),
  "utf8",
);

describe("gastronomy public share truthfulness", () => {
  it("only reports a copied link after clipboard success", () => {
    expect(dialog).toContain("const copyLink = async () =>");
    expect(dialog).toContain("if (!navigator.clipboard?.writeText)");
    expect(dialog).toContain("await navigator.clipboard.writeText(businessUrl)");
    expect(dialog).toContain("toast.success('Link copiado!')");
    expect(dialog).toContain("toast.error('Não foi possível copiar o link.')");

    const writeIndex = dialog.indexOf("await navigator.clipboard.writeText(businessUrl)");
    const successIndex = dialog.indexOf("toast.success('Link copiado!')");
    expect(writeIndex).toBeGreaterThan(-1);
    expect(successIndex).toBeGreaterThan(writeIndex);
  });

  it("does not open the fallback dialog after native-share cancellation", () => {
    expect(detail).toContain('typeof navigator.share === "function"');
    expect(detail).toContain('error.name === "AbortError"');
    expect(detail).toContain("setShareOpen(true)");
    expect(detail).not.toContain("Fallback para dialog interno.");
  });
});
