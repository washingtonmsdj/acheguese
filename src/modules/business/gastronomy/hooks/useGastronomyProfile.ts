/**
 * useGastronomyProfile - Hook para verificar se negócio tem perfil gastronômico
 *
 * Usado na página de empresas para detectar se deve exibir CTA de gastronomia
 *
 */

import { useQuery } from "@tanstack/react-query";
import { GastronomyFacade } from "../services";

const STALE_TIME_FIVE_MINUTES = 5 * 60 * 1000;

export function useGastronomyProfile(businessIdentifier: string | undefined) {
  return useQuery({
    queryKey: ["gastronomy-profile", businessIdentifier],
    queryFn: () => {
      if (!businessIdentifier) return null;
      return GastronomyFacade.queries.getGastronomyProfile(businessIdentifier);
    },
    enabled: !!businessIdentifier,
    staleTime: STALE_TIME_FIVE_MINUTES,
  });
}
