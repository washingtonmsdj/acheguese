import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';
import type { Event } from '../types';

export type ViewMode = 'grid' | 'list';
export type SortOption = 'data-asc' | 'data-desc' | 'popularidade' | 'preco-asc' | 'preco-desc' | 'alfabetica';

export type EventsListFilters = {
  category: string;
  dateFilter: string;
  typeFilter: string;
  priceFilter: string;
  search: string;
  sortBy: SortOption;
};

export type EventsListStats = {
  total: number;
  upcoming: number;
  participants: number;
};

export function filterAndSortEvents(events: Event[], filters: EventsListFilters): Event[] {
  const { category, dateFilter, typeFilter, priceFilter, search, sortBy } = filters;
  let filtered = [...events];

  if (category !== 'todos') {
    filtered = filtered.filter((event) => event.category === category);
  }

  if (dateFilter !== 'todos') {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    filtered = filtered.filter((event) => {
      const eventDate = new Date(event.start_date);

      switch (dateFilter) {
        case 'hoje':
          return eventDate.toDateString() === today.toDateString();
        case 'semana': {
          const weekEnd = new Date(today);
          weekEnd.setDate(weekEnd.getDate() + 7);
          return eventDate >= today && eventDate <= weekEnd;
        }
        case 'mes':
          return eventDate.getMonth() === today.getMonth() && eventDate.getFullYear() === today.getFullYear();
        case 'proximo-mes': {
          const nextMonth = new Date(today);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          return eventDate.getMonth() === nextMonth.getMonth() && eventDate.getFullYear() === nextMonth.getFullYear();
        }
        default:
          return true;
      }
    });
  }

  if (typeFilter !== 'todos') {
    filtered = filtered.filter((event) => event.location.type === typeFilter);
  }

  if (priceFilter === 'gratuito') {
    filtered = filtered.filter((event) => event.is_free);
  } else if (priceFilter === 'pago') {
    filtered = filtered.filter((event) => !event.is_free);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      (event) =>
        event.title.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower) ||
        event.location.neighborhood?.toLowerCase().includes(searchLower) ||
        event.location.city?.toLowerCase().includes(searchLower),
    );
  }

  filtered.sort((a, b) => compareEvents(a, b, sortBy));
  return filtered;
}

export function paginateEvents(events: Event[], currentPage: number, itemsPerPage: number): Event[] {
  const startIndex = (currentPage - 1) * itemsPerPage;
  return events.slice(startIndex, startIndex + itemsPerPage);
}

export function getEventsListStats(events: Event[]): EventsListStats {
  return {
    total: events.length,
    upcoming: events.filter((event) => event.status === 'publicado').length,
    participants: events.reduce((acc, event) => acc + event.participants_count, 0),
  };
}

export function getActiveFiltersCount(filters: Omit<EventsListFilters, 'sortBy'>): number {
  return [filters.category, filters.dateFilter, filters.typeFilter, filters.priceFilter].filter((value) => value !== 'todos').length +
    (filters.search ? 1 : 0);
}

export function getEventsListPageTitle(resolved?: ResolvedTerritory): string {
  if (!resolved) return 'Eventos Locais | Achegue-se';

  if (resolved.kind === 'location') {
    return `Eventos em ${resolved.location.name} | Achegue-se`;
  }

  return `Eventos - ${resolved.group.name} | Achegue-se`;
}

export function getEventsListPageDescription(resolved?: ResolvedTerritory): string {
  if (!resolved) return 'Descubra eventos incríveis na sua comunidade. Cultura, esporte, educação e muito mais!';

  if (resolved.kind === 'location') {
    return `Descubra eventos incríveis em ${resolved.location.name}. Cultura, esporte, educação e muito mais acontecendo na sua região!`;
  }

  return `Eventos do ${resolved.group.name}. Cultura, esporte, educação e muito mais acontecendo na comunidade!`;
}

function compareEvents(a: Event, b: Event, sortBy: SortOption): number {
  switch (sortBy) {
    case 'data-asc':
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    case 'data-desc':
      return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
    case 'popularidade':
      return b.participants_count - a.participants_count;
    case 'preco-asc':
      return getLowestTicketPrice(a) - getLowestTicketPrice(b);
    case 'preco-desc':
      return getHighestTicketPrice(b) - getHighestTicketPrice(a);
    case 'alfabetica':
      return a.title.localeCompare(b.title);
    default:
      return 0;
  }
}

function getLowestTicketPrice(event: Event): number {
  if (event.is_free) return 0;
  const prices = event.tickets.map((ticket) => ticket.price);
  return prices.length > 0 ? Math.min(...prices) : 0;
}

function getHighestTicketPrice(event: Event): number {
  if (event.is_free) return 0;
  const prices = event.tickets.map((ticket) => ticket.price);
  return prices.length > 0 ? Math.max(...prices) : 0;
}
