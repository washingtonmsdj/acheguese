import type { Event, EventStatus } from '../types';

import { getRecordValue } from '@/shared/utils/recordLookup';

export type OrganizerDashboardStats = {
  total: number;
  published: number;
  ongoing: number;
  completed: number;
  totalParticipants: number;
};

export type OrganizerParticipant = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  checkedInAt?: string | null;
  joinedAt?: string | null;
};

export function filterOrganizerEvents(events: Event[], search: string, statusFilter: EventStatus | 'all'): Event[] {
  const normalizedSearch = search.toLowerCase();

  return events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(normalizedSearch);
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
}

export function getOrganizerDashboardStats(events: Event[]): OrganizerDashboardStats {
  return events.reduce<OrganizerDashboardStats>(
    (stats, event) => {
      stats.total += 1;
      if (event.status === 'publicado') stats.published += 1;
      if (event.status === 'em_andamento') stats.ongoing += 1;
      if (event.status === 'finalizado') stats.completed += 1;
      stats.totalParticipants += event.participants_count;
      return stats;
    },
    {
      total: 0,
      published: 0,
      ongoing: 0,
      completed: 0,
      totalParticipants: 0,
    },
  );
}

export function getOrganizerEventStatusBadge(status: EventStatus): { label: string; className: string } {
  const config: Record<EventStatus, { label: string; className: string }> = {
    publicado: { label: 'Publicado', className: 'bg-green-500' },
    rascunho: { label: 'Rascunho', className: 'bg-gray-500' },
    cancelado: { label: 'Cancelado', className: 'bg-red-500' },
    finalizado: { label: 'Finalizado', className: 'bg-blue-500' },
    em_andamento: { label: 'Em Andamento', className: 'bg-amber-500' },
  };

  return getRecordValue(config, status) ?? config.rascunho;
}
