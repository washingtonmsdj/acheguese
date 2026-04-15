/**
 * 🏆 USE BUSINESS DATA - Hook Agregador para Dados Completos de Empresa
 *
 * ✅ Combina múltiplos hooks em um único
 * ✅ Usa React Query para cache
 * ✅ Carrega: business, products, services, reviews, gallery
 * 
 * @param idOrSlug - ID (UUID) ou slug da empresa
 */

import { useMemo } from "react";
import { useBusinessById } from "./useBusinessById";
import { useBusinessProducts } from "./useBusinessProducts";
import { useBusinessServices } from "./useBusinessServices";
import { useBusinessReviews } from "./useBusinessReviews";
import { useBusinessGallery } from "./useBusinessGallery";
import { useBusiness } from "./useBusiness";

export function useBusinessData(idOrSlug: string) {
  // Tenta usar useBusinessById se for UUID, senão usa useBusiness
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isUuid = uuidPattern.test(idOrSlug);

  const byIdResult = useBusinessById(isUuid ? idOrSlug : undefined);
  const bySlugResult = useBusiness(!isUuid ? idOrSlug : "");

  const business = isUuid ? byIdResult.business : bySlugResult.business;
  const businessLoading = isUuid ? byIdResult.isLoading : bySlugResult.isLoading;
  const businessError = isUuid ? byIdResult.error : bySlugResult.error;

  const { products, isLoading: productsLoading } = useBusinessProducts(
    business?.id,
  );
  const { services, isLoading: servicesLoading } = useBusinessServices(
    business?.id,
  );
  const { reviews, isLoading: reviewsLoading } = useBusinessReviews(
    business?.id,
  );
  const { gallery, isLoading: galleryLoading } = useBusinessGallery(
    business?.id,
  );

  const isLoading =
    businessLoading ||
    productsLoading ||
    servicesLoading ||
    reviewsLoading ||
    galleryLoading;

  const averageRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  }, [reviews]);

  const totalReviews = reviews?.length || 0;

  return {
    business: business || undefined,
    products: products || [],
    services: services || [],
    reviews: reviews || [],
    gallery: gallery || [],
    isLoading,
    error: businessError,
    averageRating,
    totalReviews,
  };
}
