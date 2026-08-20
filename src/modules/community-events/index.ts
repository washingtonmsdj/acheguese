/**
 * Community Events - public module API.
 *
 * The product surface is being migrated from `src/features/events` into this
 * bounded context. Components/pages still listed from the legacy namespace are
 * compatibility-only; types, hooks and adapters already live here.
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
  EventCTA as EventCTAType,
} from "./types";

export { useEventTerritoryFilter, useFavorites } from "./hooks";
export { mapCommunityEventToEvent } from "./utils/eventAdapters";
export { parseEventCheckinQrPayload } from "./utils/checkinQr";
export * from "./constants";
