/**
 * useGastronomyProfile - Hook para verificar se negócio tem perfil gastronômico
 *
 * Usado na página de empresas para detectar se deve exibir CTA de gastronomia
 *
 * @version 2.0.0 - Atualizado para GastronomyFacade
 */

import { useQuery } from "@tanstack/react-query";
import { GastronomyFacade } from "../services";

const STALE_TIME_FIVE_MINUTES = 5 * 60 * 1000;

export function useGastronomyProfile(businessId: string | undefined) {
  return useQuery({
    queryKey: ["gastronomy-profile", businessId],
    queryFn: () => {
      if (!businessId) return null;
      return GastronomyFacade.queries.getGastronomyProfile(businessId);
    },
    enabled: !!businessId,
    staleTime: STALE_TIME_FIVE_MINUTES,
  });
}
