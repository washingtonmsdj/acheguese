/**
 * Hook para buscar anúncios de um vendedor específico
 */

import { useQuery } from "@tanstack/react-query";
import { ClassifiedsFacade } from "@/core/classifieds/services";
import type { ClassificadoWithVendedor } from "./useClassificados";

export function useSellerAds(sellerId: string | undefined, excludeId?: string) {
  const query = useQuery({
    queryKey: ["seller-ads", sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      const data = await ClassifiedsFacade.queries.getClassifiedsBySeller(sellerId);
      return data
        .filter((item) => item.id !== excludeId)
        .map((item) => ({
          id: item.id,
          public_id: item.public_id || '',
          slug: item.slug || '',
          titulo: item.title,
          descricao: item.description,
          preco: item.price,
          categoria: item.category,
          fotos: item.photos,
          status: item.is_active ? "active" : "inactive",
          bairro: item.neighborhood || item.location || "",
          created_at: item.created_at,
          geographic_path: item.geographic_path,
          category_slug: item.category_slug,
          subcategory_slug: item.subcategory_slug,
          vendedor: {
            id: item.seller_id,
            nome: item.seller_name || "",
            avatar_url: item.seller_avatar || null,
            phone: item.seller_phone || null,
            whatsapp: item.seller_whatsapp || null,
          },
        })) as ClassificadoWithVendedor[];
    },
    enabled: !!sellerId,
  });

  return {
    sellerAds: query.data || [],
    isLoading: query.isLoading,
  };
}
