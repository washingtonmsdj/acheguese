import { beforeEach, describe, expect, it, vi } from "vitest";
const database = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/integrations/supabase", () => ({ supabase: database }));
import { businessCatalogService, type CatalogInput } from "./businessCatalogService";

function query(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn(), eq: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn(), single: vi.fn(),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  for (const method of [chain.select, chain.eq, chain.insert, chain.update, chain.delete]) method.mockReturnValue(chain);
  chain.single.mockResolvedValue(result);
  return chain;
}
const input: CatalogInput = { kind: "service", name: "Aula", description: "", price: null, active: false, category: "", image: null };
beforeEach(() => database.from.mockReset());
describe("businessCatalogService", () => {
  it("reads both tables, preserving inactive items and unset prices", async () => {
    const products = query({ data: [{ id: "p", nome: "Livro", preco: null, ativo: false, created_at: "2026-01-01" }], error: null });
    const services = query({ data: [{ id: "s", name: "Aula", price: 0, is_active: true, created_at: "2026-01-01" }], error: null });
    database.from.mockReturnValueOnce(products).mockReturnValueOnce(services);
    const result = await businessCatalogService.list("owner");
    expect(products.eq).toHaveBeenCalledWith("profile_id", "owner");
    expect(services.eq).toHaveBeenCalledWith("business_id", "owner");
    expect(result[0]).toMatchObject({ kind: "product", price: null, active: false });
    expect(result[1]).toMatchObject({ kind: "service", price: 0, active: true });
  });
  it("updates services using the actual is_active column and owner scope", async () => {
    const request = query({ data: { id: "s" }, error: null });
    database.from.mockReturnValue(request);
    await businessCatalogService.save("owner", input, "s");
    expect(request.update).toHaveBeenCalledWith({ name: "Aula", description: null, price: null, is_active: false });
    expect(request.eq).toHaveBeenCalledWith("business_id", "owner");
    expect(request.eq).toHaveBeenCalledWith("id", "s");
  });
  it("stores optional product price as null, not zero", async () => {
    const request = query({ data: { id: "p" }, error: null });
    database.from.mockReturnValue(request);
    await businessCatalogService.save("owner", { ...input, kind: "product" });
    expect(request.insert).toHaveBeenCalledWith(expect.objectContaining({ profile_id: "owner", preco: null, ativo: false }));
  });
  it("rejects invalid prices before writing", async () => {
    await expect(businessCatalogService.save("owner", { ...input, price: -1 })).rejects.toThrow("preço válido");
    expect(database.from).not.toHaveBeenCalled();
  });
  it("does not report success if an update returns no row", async () => {
    database.from.mockReturnValue(query({ data: null, error: null }));
    await expect(businessCatalogService.save("owner", input, "s")).rejects.toThrow("Não foi possível salvar");
  });
  it("surfaces read errors instead of claiming an empty catalog", async () => {
    database.from.mockReturnValue(query({ data: null, error: new Error("Sem acesso") }));
    await expect(businessCatalogService.list("owner")).rejects.toThrow("Sem acesso");
  });
});
