/**
 * Hook para buscar dados completos do perfil de um vendedor.
 * SSOT: somente dados reais via services.
 */
import { logger } from "@/shared/utils/logger";
import { useQuery } from "@tanstack/react-query";
import { ClassifiedsService } from "@/modules/classifieds/services";
import { profileService } from "@/core/profiles/services";
import type { VendedorWithAds } from "./useVendedores";

export interface VendedorReview {
  id: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
  rating: number;
  comment: string;
  created_at: string;
}

export interface VendedorPerfil extends VendedorWithAds {
  bio: string;
  member_since: string;
  response_rate: number;
  avg_rating: number;
  total_reviews: number;
  phone?: string | null;
  whatsapp?: string | null;
  all_ads: Array<{
    id: string;
    public_id?: string | null;
    slug?: string | null;
    geographic_path?: string | null;
    category_slug?: string | null;
    subcategory_slug?: string | null;
    title: string;
    price: number;
    photos: string[];
    category: string;
    condition: string;
    created_at: string;
  }>;
  reviews: VendedorReview[];
}

export function useVendedorPerfil(sellerId: string | undefined) {
  const query = useQuery({
    queryKey: ["vendedor-perfil", sellerId],
    queryFn: async () => {
      if (!sellerId) return null;

      try {
        const profile = await profileService.getPublicProfileById(sellerId);
        if (!profile) return null;
        const profileNeighborhood =
          (profile as { public_neighborhood?: string | null }).public_neighborhood ?? null;

        const classifieds = await ClassifiedsService.queries.getClassifiedsBySeller(sellerId);
        const activeAds = classifieds.filter((ad) => ad.is_active);
        const allAds = classifieds.map((ad) => ({
          id: ad.id,
          public_id: ad.public_id,
          slug: ad.slug,
          geographic_path: ad.geographic_path,
          category_slug: ad.category_slug,
          subcategory_slug: ad.subcategory_slug,
          title: ad.title,
          price: ad.price,
          photos: ad.photos || [],
          category: ad.category,
          condition: ad.condition,
          created_at: ad.created_at,
        }));

        const vendedorPerfil: VendedorPerfil = {
          id: profile.id,
          name: profile.name || profile.username || "Vendedor",
          avatar_url: profile.avatar_url || null,
          neighborhood: profileNeighborhood || "Não informado",
          active_ads_count: activeAds.length,
          bio: profile.bio || "Vendedor na plataforma",
          member_since: profile.created_at || new Date().toISOString(),
          response_rate: 0,
          avg_rating: 0,
          total_reviews: 0,
          phone: profile.phone || null,
          whatsapp: profile.whatsapp || null,
          featured_ads: activeAds.slice(0, 3).map((ad) => ({
            id: ad.id,
            title: ad.title,
            price: ad.price,
            photos: ad.photos || [],
          })),
          all_ads: allAds,
          reviews: [],
        };

        return vendedorPerfil;
      } catch (error) {
        logger.error("[useVendedorPerfil] Error fetching seller profile:", error);
        return null;
      }
    },
    enabled: !!sellerId,
  });

  return {
    vendedor: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
