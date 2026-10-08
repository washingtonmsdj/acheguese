import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { mapProductRecordToProduct } from "@/core/business/services/business.mappers";
import type { ProductRecord } from "@/core/business/types";

const mutations = readFileSync(
  "src/core/business/services/business.mutations.ts",
  "utf8",
);

describe("Business products authoritative persistence record", () => {
  it("maps created products from the returned database row", () => {
    expect(mutations).toContain("return mapProductRecordToProduct(data as ProductRecord);");
    expect(mutations).not.toContain("created_at: new Date().toISOString()");
  });

  it("preserves the persisted timestamp and fields without browser-generated values", () => {
    const row: ProductRecord = {
      id: "product-1",
      profile_id: "profile-1",
      nome: "Produto exemplo",
      descricao: "Descrição",
      preco: 25,
      preco_promocional: 20,
      imagem: "asset-ref",
      categoria: "acessorios",
      estoque: 4,
      ativo: true,
      destaque: false,
      promocao: true,
      created_at: "2026-01-15T12:00:00.000Z",
    };
    const product = mapProductRecordToProduct(row);
    expect(product.created_at).toBe(row.created_at);
    expect(product.profile_id).toBe(row.profile_id);
    expect(product.price).toBe(25);
    expect(product.promotional_price).toBe(20);
  });
});
