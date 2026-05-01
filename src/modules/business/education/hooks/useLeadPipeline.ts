import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { educationMutations, educationQueries } from '../services';
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

      const counts = await educationQueries.countLeadsByStatus(profileId);
      const byStatus: Record<string, number> = {
        new: counts.new,
        contacted: counts.contacted,
        visit_scheduled: counts.visit_scheduled,
        proposal_sent: counts.proposal_sent,
        enrolled: counts.enrolled,
        lost: counts.lost,
      };

      return {
        total: counts.total,
        byStatus,
      };
    },
    enabled: hasValidProfileId,
  });

  const moveMutation = useMutation({
    mutationFn: async (move: PipelineMove) => {
      const result = await educationMutations.moveLeadToStatus(
        move.leadId,
        move.toStatus,
        {
          lostReason: move.lostReason,
          ownerUserId: move.ownerUserId,
        },
      );
      if (result.error) throw result.error;
      return result.data!;
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
