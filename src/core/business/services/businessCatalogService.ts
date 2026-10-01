import { supabase } from "@/integrations/supabase";

export type CatalogKind = "product" | "service";
export interface BusinessCatalogItem {
  id: string;
  kind: CatalogKind;
  name: string;
  description: string;
  price: number | null;
  active: boolean;
  category: string;
  image: string | null;
  createdAt: string;
}
export type CatalogInput = Omit<BusinessCatalogItem, "id" | "createdAt">;

async function list(businessId: string): Promise<BusinessCatalogItem[]> {
  const [products, services] = await Promise.all([
    supabase.from("business_products").select("*").eq("profile_id", businessId),
    supabase
      .from("business_services")
      .select("*")
      .eq("business_id", businessId),
  ]);
  if (products.error) throw products.error;
  if (services.error) throw services.error;
  return [
    ...(products.data ?? []).map(
      (item): BusinessCatalogItem => ({
        id: item.id,
        kind: "product",
        name: item.nome,
        description: item.descricao ?? "",
        price: item.preco,
        active: item.ativo,
        category: item.categoria ?? "",
        image: item.imagem,
        createdAt: item.created_at,
      }),
    ),
    ...(services.data ?? []).map(
      (item): BusinessCatalogItem => ({
        id: item.id,
        kind: "service",
        name: item.name,
        description: item.description ?? "",
        price: item.price,
        active: item.is_active,
        category: "",
        image: null,
        createdAt: item.created_at,
      }),
    ),
  ];
}

async function save(businessId: string, input: CatalogInput, id?: string) {
  if (!input.name.trim()) throw new Error("Informe o nome do item.");
  if (
    input.price !== null &&
    (!Number.isFinite(input.price) || input.price < 0)
  ) {
    throw new Error("Informe um preço válido ou deixe o campo vazio.");
  }
  if (input.kind === "product") {
    const values = {
      nome: input.name.trim(),
      descricao: input.description.trim() || null,
      preco: input.price,
      ativo: input.active,
      categoria: input.category.trim() || null,
      imagem: input.image || null,
    };
    const query = id
      ? supabase
          .from("business_products")
          .update(values)
          .eq("profile_id", businessId)
          .eq("id", id)
      : supabase
          .from("business_products")
          .insert({ ...values, profile_id: businessId });
    const { data, error } = await query.select("id").single();
    if (error) throw error;
    if (!data) throw new Error("Não foi possível salvar o produto.");
  } else {
    const values = {
      name: input.name.trim(),
      description: input.description.trim() || null,
      price: input.price,
      is_active: input.active,
    };
    const query = id
      ? supabase
          .from("business_services")
          .update(values)
          .eq("business_id", businessId)
          .eq("id", id)
      : supabase
          .from("business_services")
          .insert({ ...values, business_id: businessId });
    const { data, error } = await query.select("id").single();
    if (error) throw error;
    if (!data) throw new Error("Não foi possível salvar o serviço.");
  }
}

async function remove(businessId: string, item: BusinessCatalogItem) {
  const query =
    item.kind === "product"
      ? supabase
          .from("business_products")
          .delete()
          .eq("profile_id", businessId)
          .eq("id", item.id)
      : supabase
          .from("business_services")
          .delete()
          .eq("business_id", businessId)
          .eq("id", item.id);
  const { data, error } = await query.select("id").single();
  if (error) throw error;
  if (!data) throw new Error("Não foi possível remover o item.");
}

export const businessCatalogService = { list, save, remove };
