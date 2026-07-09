import type { TerritoryFilter } from "@/core/location/types";
import {
  eventMutationService,
  eventsReadService,
  type CreateEventInput,
  type EventCheckInByCodeResult,
  type EventFilters as GetEventsFilters,
  type EventPageInput as GetEventsPageInput,
  type EventPageOutput as GetEventsPageOutput,
  type EventParticipantRow,
  type EventSortBy,
  type EventSortOrder,
  type PublicEvent,
  type PublicEventStatus,
  type UpdateEventInput,
} from "@/core/verticals/events";

export type CommunityEvent = PublicEvent;

export type Event = CommunityEvent;
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

class CommunityEventsRuntimeService {
  async getEventById(id: string): Promise<CommunityEvent | null> {
    return eventsReadService.getEventById(id);
  }

  async getEvents(filters?: GetEventsFilters): Promise<CommunityEvent[]> {
    return eventsReadService.getEvents(filters);
  }

  async getEventsPage(input: GetEventsPageInput = {}): Promise<GetEventsPageOutput> {
    return eventsReadService.getEventsPage(input);
  }

  async getByBounds(
    bounds: [number, number, number, number],
    options: { limit?: number; status?: string[]; territoryFilter?: TerritoryFilter } = {},
  ): Promise<CommunityEvent[]> {
    const statuses = options.status?.filter((status): status is PublicEventStatus =>
      status === "upcoming" || status === "ongoing" || status === "completed" || status === "cancelled",
    );
    return eventsReadService.getByBounds(bounds, {
      limit: options.limit,
      statuses: statuses && statuses.length > 0 ? statuses : undefined,
      territoryFilter: options.territoryFilter,
    });
  }

  async createEvent(profileId: string, input: CreateEventInput): Promise<CommunityEvent> {
    return eventMutationService.createEvent(profileId, input);
  }

  async updateEvent(id: string, updates: UpdateEventInput): Promise<CommunityEvent> {
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

  async getEventsByOrganizerProfile(profileId: string, limit = 20): Promise<CommunityEvent[]> {
    return eventsReadService.getEventsByOrganizerProfile(profileId, limit);
  }

  async getTotalEventsCount(): Promise<number> {
    return eventsReadService.getTotalEventsCount();
  }

  async getRecentEvents(limit = 10): Promise<CommunityEvent[]> {
    return eventsReadService.getRecentEvents(limit);
  }

  async getEventsCreatedInPeriod(startDate: Date, endDate: Date): Promise<number> {
    return eventsReadService.getEventsCreatedInPeriod(startDate, endDate);
  }
}

export const communityEventsRuntimeService = new CommunityEventsRuntimeService();

export class EventsService {
  static getEvents = communityEventsRuntimeService.getEvents.bind(communityEventsRuntimeService);
  static getEventById = communityEventsRuntimeService.getEventById.bind(communityEventsRuntimeService);
  static createEvent = communityEventsRuntimeService.createEvent.bind(communityEventsRuntimeService);
  static updateEvent = communityEventsRuntimeService.updateEvent.bind(communityEventsRuntimeService);
  static deleteEvent = communityEventsRuntimeService.deleteEvent.bind(communityEventsRuntimeService);
  static joinEvent = communityEventsRuntimeService.joinEvent.bind(communityEventsRuntimeService);
  static leaveEvent = communityEventsRuntimeService.leaveEvent.bind(communityEventsRuntimeService);
  static isParticipating = communityEventsRuntimeService.isParticipating.bind(communityEventsRuntimeService);
  static getEventParticipants = communityEventsRuntimeService.getEventParticipants.bind(communityEventsRuntimeService);
  static getParticipantCheckinCode = communityEventsRuntimeService.getParticipantCheckinCode.bind(communityEventsRuntimeService);
  static checkInEvent = communityEventsRuntimeService.checkInEvent.bind(communityEventsRuntimeService);
  static checkInEventByCode = communityEventsRuntimeService.checkInEventByCode.bind(communityEventsRuntimeService);
  static getCheckInStatus = communityEventsRuntimeService.getCheckInStatus.bind(communityEventsRuntimeService);
  static getEventsByOrganizerProfile = communityEventsRuntimeService.getEventsByOrganizerProfile.bind(communityEventsRuntimeService);
  static getTotalEventsCount = communityEventsRuntimeService.getTotalEventsCount.bind(communityEventsRuntimeService);
  static getRecentEvents = communityEventsRuntimeService.getRecentEvents.bind(communityEventsRuntimeService);
  static getEventsCreatedInPeriod = communityEventsRuntimeService.getEventsCreatedInPeriod.bind(communityEventsRuntimeService);
  static getByBounds = communityEventsRuntimeService.getByBounds.bind(communityEventsRuntimeService);
}

export const eventService = EventsService;
