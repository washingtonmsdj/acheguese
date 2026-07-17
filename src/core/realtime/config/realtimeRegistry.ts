export type RealtimePostgresEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

export type RealtimeFilterValidator = "uuid";

export interface RealtimeBindingDefinition {
  id: string;
  table: string;
  event: RealtimePostgresEvent;
  filter?: {
    column: string;
    valueKey: string;
    validator: RealtimeFilterValidator;
  };
}

export interface RealtimeTopicDefinition {
  bindings: readonly RealtimeBindingDefinition[];
}

export const REALTIME_PRESENCE_REGISTRY = {
  "presence.community-group": {
    channelPrefix: "presence:community-group",
    maxStateBytes: 8_192,
  },
  "presence.conversation": {
    channelPrefix: "presence:conversation",
    maxStateBytes: 4_096,
  },
} as const;

export type RealtimePresenceTopic = keyof typeof REALTIME_PRESENCE_REGISTRY;

export const REALTIME_BROADCAST_REGISTRY = {
  "mobility.driver-offer": {
    channelPrefix: "driver",
    event: "ride_offered",
    maxPayloadBytes: 8_192,
  },
  "mobility.passenger-expired": {
    channelPrefix: "passenger",
    event: "ride_expired",
    maxPayloadBytes: 8_192,
  },
} as const;

export type RealtimeBroadcastTopic = keyof typeof REALTIME_BROADCAST_REGISTRY;

/**
 * Closed registry for every client-side Postgres Changes subscription.
 *
 * Tables, events and filter columns are code-owned. Callers only provide
 * validated values for the declared filter keys.
 */
export const REALTIME_TOPIC_REGISTRY = {
  "family.alerts": {
    bindings: [
      {
        id: "insert",
        table: "family_location_alerts",
        event: "INSERT",
      },
    ],
  },
  "family.locations": {
    bindings: [
      {
        id: "changes",
        table: "family_locations",
        event: "*",
      },
    ],
  },
  "gastronomy.business-orders": {
    bindings: [
      {
        id: "orders",
        table: "orders",
        event: "*",
        filter: {
          column: "source_id",
          valueKey: "businessId",
          validator: "uuid",
        },
      },
    ],
  },
  "gastronomy.order-details": {
    bindings: [
      {
        id: "order",
        table: "orders",
        event: "*",
        filter: {
          column: "id",
          valueKey: "orderId",
          validator: "uuid",
        },
      },
      {
        id: "timeline",
        table: "order_timeline_events",
        event: "*",
        filter: {
          column: "order_id",
          valueKey: "orderId",
          validator: "uuid",
        },
      },
    ],
  },
  "gastronomy.order-tracking": {
    bindings: [
      {
        id: "ride-request",
        table: "ride_requests",
        event: "*",
        filter: {
          column: "source_id",
          valueKey: "orderId",
          validator: "uuid",
        },
      },
    ],
  },
  "metrics.operational": {
    bindings: [
      { id: "profiles", table: "profiles", event: "*" },
      { id: "rides", table: "rides", event: "*" },
      { id: "posts", table: "posts", event: "*" },
    ],
  },
  "community.group-messages": {
    bindings: [
      {
        id: "changes",
        table: "group_messages_new",
        event: "*",
        filter: {
          column: "group_id",
          valueKey: "groupId",
          validator: "uuid",
        },
      },
    ],
  },
  "messaging.classified-conversation-messages": {
    bindings: [
      {
        id: "insert",
        table: "messages",
        event: "INSERT",
        filter: {
          column: "conversation_id",
          valueKey: "conversationId",
          validator: "uuid",
        },
      },
    ],
  },
  "messaging.community-thread-messages": {
    bindings: [
      {
        id: "insert",
        table: "community_direct_messages",
        event: "INSERT",
        filter: {
          column: "thread_id",
          valueKey: "threadId",
          validator: "uuid",
        },
      },
    ],
  },
  "mobility.driver-rides": {
    bindings: [
      {
        id: "update",
        table: "ride_requests",
        event: "UPDATE",
        filter: {
          column: "driver_profile_id",
          valueKey: "profileId",
          validator: "uuid",
        },
      },
    ],
  },
  "mobility.passenger-rides": {
    bindings: [
      {
        id: "update",
        table: "ride_requests",
        event: "UPDATE",
        filter: {
          column: "passenger_profile_id",
          valueKey: "profileId",
          validator: "uuid",
        },
      },
    ],
  },
  "mobility.ride-by-id": {
    bindings: [
      {
        id: "update",
        table: "ride_requests",
        event: "UPDATE",
        filter: {
          column: "id",
          valueKey: "rideId",
          validator: "uuid",
        },
      },
    ],
  },
  "notifications.user": {
    bindings: [
      {
        id: "insert",
        table: "notifications",
        event: "INSERT",
        filter: {
          column: "user_id",
          valueKey: "userId",
          validator: "uuid",
        },
      },
      {
        id: "update",
        table: "notifications",
        event: "UPDATE",
        filter: {
          column: "user_id",
          valueKey: "userId",
          validator: "uuid",
        },
      },
    ],
  },
  "tracking.device-position": {
    bindings: [
      {
        id: "position",
        table: "device_locations",
        event: "*",
        filter: {
          column: "device_id",
          valueKey: "entityId",
          validator: "uuid",
        },
      },
    ],
  },
  "tracking.driver-position": {
    bindings: [
      {
        id: "position",
        table: "driver_locations",
        event: "*",
        filter: {
          column: "driver_profile_id",
          valueKey: "entityId",
          validator: "uuid",
        },
      },
    ],
  },
  "tracking.user-position": {
    bindings: [
      {
        id: "position",
        table: "user_locations",
        event: "*",
        filter: {
          column: "user_id",
          valueKey: "entityId",
          validator: "uuid",
        },
      },
    ],
  },
  "tracking.vehicle-position": {
    bindings: [
      {
        id: "position",
        table: "vehicle_locations",
        event: "*",
        filter: {
          column: "vehicle_id",
          valueKey: "entityId",
          validator: "uuid",
        },
      },
    ],
  },
  "tryon.generation": {
    bindings: [
      {
        id: "update",
        table: "tryon_generations",
        event: "UPDATE",
        filter: {
          column: "id",
          valueKey: "generationId",
          validator: "uuid",
        },
      },
    ],
  },
} as const satisfies Record<string, RealtimeTopicDefinition>;

export type RealtimeTopic = keyof typeof REALTIME_TOPIC_REGISTRY;
export type RealtimeStreamKey = RealtimeTopic | RealtimePresenceTopic;

export function getRealtimeTopicDefinition(
  topic: RealtimeTopic,
): RealtimeTopicDefinition {
  return REALTIME_TOPIC_REGISTRY[topic];
}

export function getRealtimePresenceDefinition(topic: RealtimePresenceTopic) {
  return REALTIME_PRESENCE_REGISTRY[topic];
}

export function getRealtimeBroadcastDefinition(topic: RealtimeBroadcastTopic) {
  return REALTIME_BROADCAST_REGISTRY[topic];
}
