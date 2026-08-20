// Compatibility bridge. New event consumers must import from "@/core/events".
export {
  EventRuntimeService as CommunityEventsRuntimeService,
  EventsService,
  eventRuntimeService as communityEventsRuntimeService,
  eventService,
} from "@/core/events/services/EventRuntimeService";
export type {
  CommunityEvent,
  CreateEventInput,
  Event,
  EventParticipantRow,
  EventSortBy,
  EventSortOrder,
  GetEventsFilters,
  GetEventsPageInput,
  GetEventsPageOutput,
  UpdateEventInput,
} from "@/core/events/services/EventRuntimeService";
