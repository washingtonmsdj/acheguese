/**
 * 🏆 USE PROFESSIONAL DETAIL - SSOT Hook (REFATORADO)
 */

import { useProfessionalById } from "@/modules/professionals/services/hooks/useProfessionalById";
import { useSessionContext } from "@/core/session";
import { useServiceAreas } from "@/core/service-areas";
import { profileService } from "@/core/profiles/services";
import { useQuery } from "@tanstack/react-query";
import { mapProfessionalToDetailView } from "@/modules/professionals/services/domain/professionalViewModels";
import type { ProfessionalDetailView } from "@/modules/professionals/services/domain/professionalViewModels";

export type ProfessionalData = ProfessionalDetailView;

export function useProfessionalDetail(id?: string) {
  const { user } = useSessionContext();

  const { professional, loading, error, refetch } = useProfessionalById({
    id: id || "",
    enabled: !!id,
  });

  const coverageQuery = useServiceAreas(professional?.profile_id ?? "");

  // Check ownership via ProfileService
  const { data: isOwner = false } = useQuery({
    queryKey: ["professional-owner", id, user?.id],
    queryFn: async () => {
      if (!user?.id || !id) return false;
      return await profileService.isProfileOwner(id, user.id);
    },
    enabled: !!user?.id && !!id,
    staleTime: 5 * 60 * 1000,
  });

  const mappedProfessional: ProfessionalData | null = professional
    ? mapProfessionalToDetailView(
        professional,
        (coverageQuery.data ?? []).map((area) => area.location_name),
      )
    : null;

  return {
    professional: mappedProfessional,
    loading: loading || Boolean(professional && !coverageQuery.isFetched),
    notFound: error?.message?.includes("não encontrado") || false,
    isOwner,
    refetch: () => {
      refetch();
      void coverageQuery.refetch();
    },
  };
}
