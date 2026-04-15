/**
 * Global type declarations for useCityNeighborhoodsPolygons
 */

declare global {
  interface Window {
    /**
     * Limpa o cache de polígonos de bairros.
     * 
     * @param cityId - ID da cidade para limpar cache específico. Se omitido, limpa todos os caches.
     * 
     * @example
     * // Limpar cache de uma cidade específica
     * clearNeighborhoodsCache('city-id-123')
     * 
     * @example
     * // Limpar todos os caches de bairros
     * clearNeighborhoodsCache()
     */
    clearNeighborhoodsCache: (cityId?: string) => void;
  }
}

export {};
