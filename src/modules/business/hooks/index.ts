// Barrel export for business hooks

// Geographic Foundation Integration
export { useBusinessLocation } from './useBusinessLocation';
export { useBusinessCoverage } from './useBusinessCoverage';
export { useBusinessRollout } from './useBusinessRollout';

// Ads - consome modules/ads
export { useBusinessAd } from './useBusinessAd';

// Business hooks
export { useBusiness } from "@/core/business/hooks/useBusiness";
export * from "./useBusinessById";
export * from "./useBusinessCreate";
export { useBusinessEdit } from "./useBusinessEdit";
export { useBusinessFavorite, useBusinessFavorites } from "./useBusinessFavorite";
export { useBusinessRecommendation } from "./useBusinessRecommendation";
export * from "./useBusinessForm";
export * from "./useBusinessFormSteps";
export * from "./useBusinessGallery";
// useBusinessImageUpload já exportado por useBusinessCreate
export * from "./useBusinessList";
export * from "./useBusinessManagement";
export * from "./useBusinessMetrics";
export * from "./useBusinessNavigation";
export * from "./useBusinessProducts";
export * from "./useBusinessReviews";
export * from "./useBusinessServices";
export * from "./useBusinessUrls";
