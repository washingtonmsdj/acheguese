/**
 * useGastronomyStatus — Estado do vertical gastronomia para uma empresa
 *
 * Retorna se a empresa tem perfil gastronômico e qual o status.
 * Usado pelo dashboard para mostrar CTA ou status.
 */

import { useQuery } from '@tanstack/react-query';
import { GastronomyProfileService } from '@/core/gastronomy/GastronomyProfileService';

export type GastronomyActivationStatus =
  | 'not_configured'   // elegível mas sem perfil
  | 'active'           // perfil ativo
  | 'inactive'         // perfil inativo
  | 'temporarily_closed'
  | 'not_eligible';    // categoria não elegível

export function useGastronomyStatus(businessId: string, isEligible: boolean) {
  const { data, isLoading } = useQuery({
    queryKey: ['gastronomy-status', businessId],
    queryFn: () => GastronomyProfileService.getByBusinessId(businessId),
    enabled: !!businessId && isEligible,
    select: (result) => result.data,
  });

  if (!isEligible) {
    return { status: 'not_eligible' as GastronomyActivationStatus, profile: null, isLoading: false };
  }

  if (isLoading) {
    return { status: 'not_configured' as GastronomyActivationStatus, profile: null, isLoading: true };
  }

  if (!data) {
    return { status: 'not_configured' as GastronomyActivationStatus, profile: null, isLoading: false };
  }

  return {
    status: data.status as GastronomyActivationStatus,
    profile: data,
    isLoading: false,
  };
}
