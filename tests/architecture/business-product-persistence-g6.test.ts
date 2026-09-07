import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("G6 Business product persistence", () => {
  it("writes the canonical business_products schema through generated Supabase types", () => {
    const mutations = read("src/core/business/services/business.mutations.ts");
    const generated = read("src/integrations/supabase/types.generated.ts");

    expect(generated).toContain("business_products: {");
    for (const column of [
      "nome:",
      "descricao:",
      "preco:",
      "preco_promocional:",
      "imagem:",
      "categoria:",
      "estoque:",
      "ativo:",
      "destaque:",
      "promocao:",
      "profile_id:",
    ]) {
      expect(generated).toContain(column);
    }

    expect(mutations).toContain('supabase\n      .from("business_products")');
    expect(mutations).toContain("nome: productData.nome");
    expect(mutations).toContain("preco: productData.preco");
    expect(mutations).toContain(
      "preco_promocional: productData.preco_promocional ?? null",
    );
    expect(mutations).toContain("estoque: productData.estoque ?? 0");
    expect(mutations).not.toContain("ProductInsertRow");
  });

  it("does not revive the stale English database column projection", () => {
    const mutations = read("src/core/business/services/business.mutations.ts");
    const start = mutations.indexOf(
      'supabase\n      .from("business_products")',
    );
    const end = mutations.indexOf(".select()", start);
    const insertBlock = mutations.slice(start, end);

    for (const staleColumn of [
      "name:",
      "description:",
      "price:",
      "promotional_price:",
      "image_url:",
      "category:",
      "stock:",
      "active:",
      "featured:",
      "promotion:",
    ]) {
      expect(insertBlock).not.toContain(`\n        ${staleColumn}`);
    }
  });
});
