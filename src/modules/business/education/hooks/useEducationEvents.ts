import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { educationQueries, educationMutations } from '../services';
import type { EducationEvent, SchoolEventType } from '../types';

export interface EventFilters {
  isPublic?: boolean;
  upcoming?: boolean;
}

export function useEducationEvents(profileId?: string, filters: EventFilters = {}) {
  const queryClient = useQueryClient();
  const { isPublic, upcoming } = filters;

  const query = useQuery({
    queryKey: ['education', 'events', profileId, isPublic, upcoming],
    queryFn: async () => {
      if (!profileId) return [];
      return educationQueries.listEducationEvents(profileId, { isPublic, upcoming });
    },
    enabled: Boolean(profileId),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string;
      startsAt: string;
      endsAt?: string;
      location?: string;
      isPublic?: boolean;
      schoolEventType?: SchoolEventType;
    }) => {
      if (!profileId) throw new Error('Profile ID required');
      const result = await educationMutations.createEducationEvent({
        education_profile_id: profileId,
        title: payload.title,
        description: payload.description ?? null,
        starts_at: payload.startsAt,
        ends_at: payload.endsAt ?? null,
        location: payload.location ?? null,
        is_public: payload.isPublic ?? true,
        school_event_type: payload.schoolEventType ?? null,
      });
      if (result.error) throw result.error;
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education', 'events', profileId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      eventId,
      payload,
    }: {
      eventId: string;
      payload: Partial<EducationEvent>;
    }) => {
      const result = await educationMutations.updateEducationEvent(eventId, payload);
      if (result.error) throw result.error;
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education', 'events', profileId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const result = await educationMutations.deleteEducationEvent(eventId);
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education', 'events', profileId] });
    },
  });

  return {
    events: query.data ?? [],
    isLoading: query.isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
  };
}
