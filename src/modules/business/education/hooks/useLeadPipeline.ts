import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EducationService } from '../services';
import type { EducationLeadStatus } from '../types';

export interface PipelineMove {
  leadId: string;
  toStatus: EducationLeadStatus;
  lostReason?: string;
  ownerUserId?: string | null;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function useLeadPipeline(profileId?: string) {
  const queryClient = useQueryClient();
  const hasValidProfileId = Boolean(profileId && UUID_REGEX.test(profileId));

  const summaryQuery = useQuery({
    queryKey: ['education', 'pipeline', profileId],
    queryFn: async () => {
      if (!hasValidProfileId || !profileId) return { total: 0, byStatus: {} as Record<string, number> };
      return EducationService.getLeadsPipelineSummary(profileId);
    },
    enabled: hasValidProfileId,
  });

  const moveMutation = useMutation({
    mutationFn: async (move: PipelineMove) => {
      const updated = await EducationService.moveLeadInPipeline(move);
      if (!updated) throw new Error('Falha ao mover lead no pipeline');
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education', 'leads', profileId] });
      queryClient.invalidateQueries({ queryKey: ['education', 'pipeline', profileId] });
    },
  });

  return {
    summary: summaryQuery.data,
    isLoading: summaryQuery.isLoading,
    moveLead: moveMutation.mutateAsync,
    isMoving: moveMutation.isPending,
  };
}
