/**
 * 📦 CLASSIFIEDS MAPPERS - SSOT Data Transformation
 *
 * Mapeadores centralizados para transformação de dados de classificados.
 * Elimina duplicação de lógica de mapeamento entre hooks.
 *
 * @version 1.0.0 - SSOT Mapper
 */

import type { ClassifiedData } from "./types";
import type { ClassificadoWithVendedor } from "../hooks/useClassificados";

/**
 * Mapeia dados brutos do serviço para formato ClassificadoWithVendedor
 * SSOT para transformação de dados de classificados
 */
export function mapToClassificadoWithVendedor(
  data: ClassifiedData,
): ClassificadoWithVendedor {
  return {
    id: data.id,
    public_id: data.public_id || "",
    slug: data.slug || "",
    titulo: data.title,
    descricao: data.description,
    preco: data.price,
    categoria: data.category,
    condition: data.condition || undefined,
    fotos: data.photos,
    status: data.status || (data.is_active ? "active" : "inactive"),
    bairro: data.territory.name,
    created_at: data.created_at,
    geographic_path: data.territory.geographic_path,
    category_slug: data.category_slug,
    subcategory_slug: data.subcategory_slug,
    vendedor: {
      id: data.seller_id,
      nome: data.seller_name || "",
      avatar_url: data.seller_avatar || null,
    },
  };
}

/**
 * Mapeia array de dados brutos para array de ClassificadoWithVendedor
 */
export function mapToClassificadoList(
  data: ClassifiedData[],
): ClassificadoWithVendedor[] {
  return data.map(mapToClassificadoWithVendedor);
}
