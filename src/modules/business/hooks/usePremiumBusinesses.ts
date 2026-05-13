/**
 * Hook para gerenciar listagem de empresas com seção premium
 * Separa empresas premium (top 4 com rotação diária) das regulares
 * 
 * ✅ Tipagem forte - Usa Business do core
 * ✅ Rotação diária automática
 * ✅ Ordenação por rating e total de avaliações
 */

import { useMemo } from "react";
import type { Business } from "@/core/business/types";

interface UsePremiumBusinessesResult {
  premiumBusinesses: Business[];
  regularBusinesses: Business[];
  totalPremium: number;
  totalRegular: number;
}

export function usePremiumBusinesses(
  businesses: Business[],
  maxPremiumDisplay: number = 4,
): UsePremiumBusinessesResult {
  return useMemo(() => {
    // Separar empresas premium das normais
    const premium = businesses.filter((b) => b.is_premium === true);
    const regular = businesses.filter((b) => b.is_premium !== true);

    // Ordenar empresas premium por avaliação e total de avaliações
    const sortedPremium = [...premium].sort((a, b) => {
      // Primeiro por avaliação (rating)
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      if (ratingB !== ratingA) {
        return ratingB - ratingA;
      }
      // Depois por total de avaliações
      const reviewsA = a.total_reviews || 0;
      const reviewsB = b.total_reviews || 0;
      return reviewsB - reviewsA;
    });

    // Sistema de rotação diária (tipo OLX)
    // Usa a date atual para calcular um offset de rotação
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
        86400000,
    );
    const rotationOffset = dayOfYear % sortedPremium.length;

    // Rotaciona o array para que empresas diferentes apareçam a cada dia
    const rotatedPremium =
      sortedPremium.length > 0
        ? [
            ...sortedPremium.slice(rotationOffset),
            ...sortedPremium.slice(0, rotationOffset),
          ]
        : [];

    // Top N empresas premium para seção destacada (com rotação)
    const topPremium = rotatedPremium.slice(0, maxPremiumDisplay);

    // Empresas premium que não couberam na seção destacada
    const extraPremium = rotatedPremium.slice(maxPremiumDisplay);

    // Lista regular inclui empresas normais + premium extras
    const allRegular = [...extraPremium, ...regular];

    return {
      premiumBusinesses: topPremium,
      regularBusinesses: allRegular,
      totalPremium: premium.length,
      totalRegular: businesses.length,
    };
  }, [businesses, maxPremiumDisplay]);
}
