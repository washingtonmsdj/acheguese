import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EducationService } from '../services';
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
      return EducationService.listEvents(profileId, { isPublic, upcoming });
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
      const created = await EducationService.createEvent(profileId, {
        title: payload.title,
        description: payload.description,
        startsAt: payload.startsAt,
        endsAt: payload.endsAt,
        location: payload.location,
        isPublic: payload.isPublic,
        schoolEventType: payload.schoolEventType,
      });
      if (!created) throw new Error('Falha ao criar evento');
      return created;
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
      const updated = await EducationService.updateEvent(eventId, payload);
      if (!updated) throw new Error('Falha ao atualizar evento');
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education', 'events', profileId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const removed = await EducationService.deleteEvent(eventId);
      if (!removed) throw new Error('Falha ao remover evento');
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
