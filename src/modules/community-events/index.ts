/**
 * Community Events - public module API.
 *
 * Transitional facade while the legacy implementation under `src/features/events`
 * is migrated into this bounded context. New consumers must import from this
 * module API instead of reaching into the legacy namespace.
 */

export {
  EventHero,
  EventTickets,
  EventDescription,
  EventSchedule,
  EventCTA,
  EventCard,
  EventSkeleton,
  EventDetailPage,
  EventsListPage,
} from "@/features/events";

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
  EventCTAType,
} from "@/features/events";
