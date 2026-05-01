import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { educationQueries, educationMutations } from '../services';
import type { EducationLead, EducationLeadStatus, SchoolShift } from '../types';

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
      return educationQueries.listEducationLeads(profileId, { status, page, pageSize });
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
      const result = await educationMutations.createEducationLead({
        education_profile_id: profileId,
        full_name: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        child_name: payload.childName ?? null,
        child_age: payload.childAge ?? null,
        interest_note: payload.interestNote ?? null,
        source_channel: payload.sourceChannel ?? 'website',
        status: 'new',
        owner_user_id: null,
        first_contact_at: null,
        lost_reason: null,
        guardian_name: payload.guardianName ?? null,
        student_name: payload.studentName ?? null,
        student_age: payload.studentAge ?? null,
        desired_grade: payload.desiredGrade ?? null,
        desired_shift: payload.desiredShift ?? null,
      });
      if (result.error) throw result.error;
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education', 'leads', profileId] });
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
      const result = await educationMutations.updateEducationLead(leadId, payload);
      if (result.error) throw result.error;
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education', 'leads', profileId] });
    },
  });

  return {
    leads: query.data?.leads ?? [],
    totalCount: query.data?.totalCount ?? 0,
    isLoading: query.isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
  };
}
