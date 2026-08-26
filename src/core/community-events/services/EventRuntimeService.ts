import type { TerritoryFilter } from "@/core/location/types";
import { eventMutationService } from "@/core/community-events/services/EventMutationService";
import { eventsReadService } from "@/core/community-events/services/EventReadService";
import type {
  CreateEventInput,
  EventCheckInByCodeResult,
  EventFilters as GetEventsFilters,
  EventPageInput as GetEventsPageInput,
  EventPageOutput as GetEventsPageOutput,
  EventParticipantRow,
  EventSortBy,
  EventSortOrder,
  PublicEvent,
  PublicEventStatus,
  UpdateEventInput,
} from "@/core/community-events/types";

export type Event = PublicEvent;
export type CommunityEvent = PublicEvent;
export type {
  CreateEventInput,
  EventParticipantRow,
  EventSortBy,
  EventSortOrder,
  GetEventsFilters,
  GetEventsPageInput,
  GetEventsPageOutput,
  UpdateEventInput,
};

export class EventRuntimeService {
  async getEventById(id: string): Promise<Event | null> {
    return eventsReadService.getEventById(id);
  }

  async getEvents(filters?: GetEventsFilters): Promise<Event[]> {
    return eventsReadService.getEvents(filters);
  }

  async getEventsPage(input: GetEventsPageInput = {}): Promise<GetEventsPageOutput> {
    return eventsReadService.getEventsPage(input);
  }

  async getByBounds(
    bounds: [number, number, number, number],
    options: { limit?: number; status?: string[]; territoryFilter?: TerritoryFilter } = {},
  ): Promise<Event[]> {
    const statuses = options.status?.filter((status): status is PublicEventStatus =>
      status === "upcoming" || status === "ongoing" || status === "completed" || status === "cancelled",
    );

    return eventsReadService.getByBounds(bounds, {
      limit: options.limit,
      statuses: statuses && statuses.length > 0 ? statuses : undefined,
      territoryFilter: options.territoryFilter,
    });
  }

  async createEvent(profileId: string, input: CreateEventInput): Promise<Event> {
    return eventMutationService.createEvent(profileId, input);
  }

  async updateEvent(id: string, updates: UpdateEventInput): Promise<Event> {
    return eventMutationService.updateEvent(id, updates);
  }

  async deleteEvent(id: string): Promise<void> {
    return eventMutationService.deleteEvent(id);
  }

  async joinEvent(eventId: string, profileId: string): Promise<void> {
    return eventMutationService.joinEvent(eventId, profileId);
  }

  async leaveEvent(eventId: string, profileId: string): Promise<void> {
    return eventMutationService.leaveEvent(eventId, profileId);
  }

  async isParticipating(eventId: string, profileId: string): Promise<boolean> {
    return eventMutationService.isParticipating(eventId, profileId);
  }

  async getEventParticipants(eventId: string): Promise<EventParticipantRow[]> {
    return eventMutationService.getEventParticipants(eventId);
  }

  async getParticipantCheckinCode(eventId: string, profileId: string): Promise<string> {
    return eventMutationService.getParticipantCheckinCode(eventId, profileId);
  }

  async checkInEvent(eventId: string, profileId: string): Promise<string> {
    return eventMutationService.checkInEvent(eventId, profileId);
  }

  async checkInEventByCode(
    eventId: string,
    checkinCode: string,
  ): Promise<EventCheckInByCodeResult> {
    return eventMutationService.checkInEventByCode(eventId, checkinCode);
  }

  async getCheckInStatus(eventId: string, profileId: string): Promise<string | null> {
    return eventMutationService.getCheckInStatus(eventId, profileId);
  }

  async getEventsByOrganizerProfile(profileId: string, limit = 20): Promise<Event[]> {
    return eventsReadService.getEventsByOrganizerProfile(profileId, limit);
  }

  async getTotalEventsCount(): Promise<number> {
    return eventsReadService.getTotalEventsCount();
  }

  async getRecentEvents(limit = 10): Promise<Event[]> {
    return eventsReadService.getRecentEvents(limit);
  }

  async getEventsCreatedInPeriod(startDate: Date, endDate: Date): Promise<number> {
    return eventsReadService.getEventsCreatedInPeriod(startDate, endDate);
  }
}

export const eventRuntimeService = new EventRuntimeService();

export class EventsService {
  static getEvents = eventRuntimeService.getEvents.bind(eventRuntimeService);
  static getEventById = eventRuntimeService.getEventById.bind(eventRuntimeService);
  static createEvent = eventRuntimeService.createEvent.bind(eventRuntimeService);
  static updateEvent = eventRuntimeService.updateEvent.bind(eventRuntimeService);
  static deleteEvent = eventRuntimeService.deleteEvent.bind(eventRuntimeService);
  static joinEvent = eventRuntimeService.joinEvent.bind(eventRuntimeService);
  static leaveEvent = eventRuntimeService.leaveEvent.bind(eventRuntimeService);
  static isParticipating = eventRuntimeService.isParticipating.bind(eventRuntimeService);
  static getEventParticipants = eventRuntimeService.getEventParticipants.bind(eventRuntimeService);
  static getParticipantCheckinCode = eventRuntimeService.getParticipantCheckinCode.bind(eventRuntimeService);
  static checkInEvent = eventRuntimeService.checkInEvent.bind(eventRuntimeService);
  static checkInEventByCode = eventRuntimeService.checkInEventByCode.bind(eventRuntimeService);
  static getCheckInStatus = eventRuntimeService.getCheckInStatus.bind(eventRuntimeService);
  static getEventsByOrganizerProfile = eventRuntimeService.getEventsByOrganizerProfile.bind(eventRuntimeService);
  static getTotalEventsCount = eventRuntimeService.getTotalEventsCount.bind(eventRuntimeService);
  static getRecentEvents = eventRuntimeService.getRecentEvents.bind(eventRuntimeService);
  static getEventsCreatedInPeriod = eventRuntimeService.getEventsCreatedInPeriod.bind(eventRuntimeService);
  static getByBounds = eventRuntimeService.getByBounds.bind(eventRuntimeService);
}

export const eventService = EventsService;
