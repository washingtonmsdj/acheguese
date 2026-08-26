// Compatibility bridge. New event consumers must import from "@/core/community-events".
export {
  EventRuntimeService as CommunityEventsRuntimeService,
  EventsService,
  eventRuntimeService as communityEventsRuntimeService,
  eventService,
} from "@/core/community-events/services/EventRuntimeService";
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
} from "@/core/community-events/services/EventRuntimeService";
