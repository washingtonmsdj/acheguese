import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(
  resolve(process.cwd(), "src/app/pages/EmpresaDetailLandingPage.tsx"),
  "utf8",
);

describe("business public action truthfulness", () => {
  it("only reports a copied phone after clipboard success", () => {
    expect(page).toContain("const handleCopyPhone = async () =>");
    expect(page).toContain("if (!navigator.clipboard?.writeText)");
    expect(page).toContain("await navigator.clipboard.writeText(phone)");
    expect(page).toContain('toast.success("Telefone copiado!")');
    expect(page).toContain('toast.error("Não foi possível copiar o telefone.")');

    const writeIndex = page.indexOf("await navigator.clipboard.writeText(phone)");
    const successIndex = page.indexOf('toast.success("Telefone copiado!")');
    expect(writeIndex).toBeGreaterThan(-1);
    expect(successIndex).toBeGreaterThan(writeIndex);
  });

  it("does not turn native-share cancellation into a clipboard action", () => {
    expect(page).toContain('error.name === "AbortError"');
    expect(page).toContain("await navigator.clipboard.writeText(window.location.href)");
    expect(page).toContain('toast.error("Não foi possível compartilhar esta empresa.")');
    expect(page).not.toContain("user cancel and unsupported paths should fall back below");
  });
});
