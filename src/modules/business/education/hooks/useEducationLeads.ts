import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EducationService } from '../services';
import { PublicEducationLeadService } from '@/core/education/services/PublicEducationLeadService';
import type {
  EducationLeadAdminPatch,
  EducationLeadStatus,
  SchoolShift,
} from '@/core/education';

export interface LeadFilters {
  status?: EducationLeadStatus;
  page?: number;
  pageSize?: number;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function useEducationLeads(profileId?: string, filters: LeadFilters = {}) {
  const queryClient = useQueryClient();
  const { status, page = 1, pageSize = 25 } = filters;
  const hasValidProfileId = Boolean(profileId && UUID_REGEX.test(profileId));

  const query = useQuery({
    queryKey: ['education', 'leads', profileId, status, page, pageSize],
    queryFn: async () => {
      if (!hasValidProfileId || !profileId) return { leads: [], totalCount: 0 };
      return EducationService.listLeads(profileId, { status, page, pageSize });
    },
    enabled: hasValidProfileId,
  });

  const createPublicMutation = useMutation({
    mutationFn: async (payload: {
      fullName: string;
      email: string;
      phone: string;
      childName?: string;
      childAge?: number;
      interestNote?: string;
      guardianName?: string;
      studentName?: string;
      studentAge?: number;
      desiredGrade?: string;
      desiredShift?: SchoolShift;
      honeypot: string;
      turnstileToken: string;
    }) => {
      if (!hasValidProfileId || !profileId) {
        throw new Error('Valid profile ID required');
      }
      return PublicEducationLeadService.create({
        educationProfileId: profileId,
        ...payload,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      leadId,
      payload,
    }: {
      leadId: string;
      payload: EducationLeadAdminPatch;
    }) => {
      const updated = await EducationService.updateLead(leadId, payload);
      if (!updated) throw new Error('Falha ao atualizar lead');
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education', 'leads', profileId] });
    },
  });

  return {
    leads: query.data?.leads ?? [],
    totalCount: query.data?.totalCount ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createPublic: createPublicMutation.mutateAsync,
    update: updateMutation.mutateAsync,
  };
}
