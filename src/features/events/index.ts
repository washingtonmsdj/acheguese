/**
 * EVENTS V2 - EXPORTS
 * 
 * Barrel file para facilitar imports
 * 
 * @version 2.0.0
 */

// ============================================================================
// COMPONENTS
// ============================================================================

export { EventHero } from './components/EventHero';
export { EventTickets } from './components/EventTickets';
export { EventDescription } from './components/EventDescription';
export { EventSchedule } from './components/EventSchedule';
export { EventCTA } from './components/EventCTA';
export { EventCard } from './components/EventCard';
export { EventSkeleton } from './components/EventSkeleton';

// ============================================================================
// PAGES
// ============================================================================

export { default as EventDetailPage } from './pages/EventDetailPage';
export { default as EventsListPage } from './pages/EventsListPage';

// ============================================================================
// TYPES
// ============================================================================

export type {
  Event,
  EventType,
  EventStatus,
  EventCategory,
  TicketType,
  TicketStatus,
  EventTicket,
  EventLocation,
  EventOrganizer,
  EventScheduleItem,
  EventGalleryItem,
  EventFAQ,
  EventRegistration,
  EventFilters,
  EventStats,
  EventCTA as EventCTAType,
} from './types';

// ============================================================================
// UTILS
// ============================================================================

export { 
  MOCK_EVENTS, 
  getMockEventById, 
  getMockEventBySlug 
} from './utils/mockData';
