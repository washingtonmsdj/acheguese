/**
 * Community Events - canonical public module API.
 *
 * Product UI lives under this bounded context. Legacy `src/features/events`
 * paths exist only as compatibility bridges while deep imports are retired.
 */

export {
  EventHero,
  EventTickets,
  EventDescription,
  EventSchedule,
  EventCTA,
  EventCard,
  EventSkeleton,
  EventTicketManager,
  EventCalendar,
  EventFAQ,
  EventGallery,
  EventNotFound,
  EventsErrorBoundary,
  EventsGlobalSidebar,
  EventAnalyticsCard,
  EventShareModal,
  EventCheckin,
  EventRelated,
  EventReminders,
  EventReviews,
  EventsMap,
} from "./components";

export { default as EventDetailPage } from "./pages/EventDetailPage";
export { default as EventsListPage } from "./pages/EventsListPage";

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
