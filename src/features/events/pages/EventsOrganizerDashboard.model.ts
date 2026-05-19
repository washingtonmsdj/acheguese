import type { Event, EventStatus } from '../types';

export type OrganizerDashboardStats = {
  total: number;
  published: number;
  draft: number;
  totalParticipants: number;
  totalViews: number;
  totalRevenue: number;
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
      if (event.status === 'rascunho') stats.draft += 1;
      stats.totalParticipants += event.participants_count;
      stats.totalViews += event.views_count;
      if (!event.is_free) {
        stats.totalRevenue += event.tickets.reduce((sum, ticket) => sum + ticket.quantity_sold * ticket.price, 0);
      }
      return stats;
    },
    {
      total: 0,
      published: 0,
      draft: 0,
      totalParticipants: 0,
      totalViews: 0,
      totalRevenue: 0,
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

  return config[status] ?? config.rascunho;
}
