import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { educationMutations } from '../services';
import { supabase } from '@/integrations/supabase';
import type { EducationLeadStatus, EducationLead } from '../types';

export interface PipelineMove {
  leadId: string;
  toStatus: EducationLeadStatus;
  lostReason?: string;
  ownerUserId?: string | null;
}

export function useLeadPipeline(profileId?: string) {
  const queryClient = useQueryClient();

  const summaryQuery = useQuery({
    queryKey: ['education', 'pipeline', profileId],
    queryFn: async () => {
      if (!profileId) return { total: 0, byStatus: {} as Record<string, number> };
      const { data, error } = await supabase
        .from('education_leads')
        .select('status')
        .eq('education_profile_id', profileId);

      if (error) {
        throw error;
      }

      const byStatus: Record<string, number> = {};
      for (const lead of (data ?? []) as Array<Pick<EducationLead, 'status'>>) {
        byStatus[lead.status] = (byStatus[lead.status] ?? 0) + 1;
      }

      return {
        total: (data ?? []).length,
        byStatus,
      };
    },
    enabled: Boolean(profileId),
  });

  const moveMutation = useMutation({
    mutationFn: async (move: PipelineMove) => {
      const result = await educationMutations.moveLeadToStatus(
        move.leadId,
        move.toStatus,
        {
          lostReason: move.lostReason,
          ownerUserId: move.ownerUserId,
        }
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

