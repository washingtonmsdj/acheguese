import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EducationService } from '../services';
import { PublicEducationLeadService } from '@/core/education/services/PublicEducationLeadService';
import type { EducationLead, EducationLeadStatus, SchoolShift } from '@/core/education';

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
    queryKey: ['education', 'leads', profileId, status, page],
    queryFn: async () => {
      if (!hasValidProfileId || !profileId) return { leads: [], totalCount: 0 };
      return EducationService.listLeads(profileId, { status, page, pageSize });
    },
    enabled: hasValidProfileId,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      fullName: string;
      email: string;
      phone: string;
      childName?: string;
      childAge?: number;
      interestNote?: string;
      sourceChannel?: string;
      // Campos específicos para matrícula escolar
      guardianName?: string;
      studentName?: string;
      studentAge?: number;
      desiredGrade?: string;
      desiredShift?: SchoolShift;
    }) => {
      if (!hasValidProfileId || !profileId) throw new Error('Valid profile ID required');
      const created = await EducationService.createLead({
        educationProfileId: profileId,
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        childName: payload.childName,
        childAge: payload.childAge,
        interestNote: payload.interestNote,
        sourceChannel: payload.sourceChannel,
        guardianName: payload.guardianName,
        studentName: payload.studentName,
        studentAge: payload.studentAge,
        desiredGrade: payload.desiredGrade,
        desiredShift: payload.desiredShift,
      });
      if (!created) throw new Error('Falha ao criar lead');
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education', 'leads', profileId] });
    },
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
      payload: Partial<EducationLead>;
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
    create: createMutation.mutateAsync,
    createPublic: createPublicMutation.mutateAsync,
    update: updateMutation.mutateAsync,
  };
}
