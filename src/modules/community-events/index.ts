/**
 * Community Events - public module API.
 *
 * The product surface is being migrated from `src/features/events` into this
 * bounded context. Only the pages/components still explicitly imported from
 * the legacy namespace remain compatibility debt.
 */

export {
  EventHero,
  EventTickets,
  EventDescription,
  EventCTA,
  EventCard,
  EventTicketManager,
} from "./components";

export {
  EventSchedule,
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
