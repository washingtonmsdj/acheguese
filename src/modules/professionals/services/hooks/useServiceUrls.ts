/**
 * useServiceUrls
 * 
 * Hook centralizado para URLs do módulo de serviços.
 * Respeita contexto territorial quando disponível.
 * 
 * SSOT para navegação de serviços - nunca construir URLs manualmente.
 * 
 * @param routeResolved - Território resolvido pela rota (opcional).
 *   Quando dentro de TerritorialLayout, passar o resolved do useTerritorialContext().
 *   Quando fora (header, sidebar global), deixar undefined para usar activeTerritory.
 */

export { useServiceUrls } from "@/core/professional/hooks/useServiceUrls";
export type { ServiceUrls } from "@/core/professional/hooks/useServiceUrls";
