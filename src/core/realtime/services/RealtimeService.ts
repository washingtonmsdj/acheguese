/**
 * Client-side Realtime SSOT.
 *
 * Supabase owns transport reconnection and exponential backoff. This service
 * owns the allowed topics, input validation, lifecycle, limits and telemetry.
 */

import { supabase } from "@/integrations/supabase";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  SupabaseClient,
} from "@/integrations/supabase";
import {
  getRealtimeBroadcastDefinition,
  getRealtimePresenceDefinition,
  getRealtimeTopicDefinition,
  type RealtimeBroadcastTopic,
  type RealtimePresenceTopic,
  type RealtimeStreamKey,
  type RealtimeTopic,
} from "../config/realtimeRegistry";
import { logger } from "@/shared/utils/logger";
import { trackError, trackPerformance } from "@/shared/utils/errorTracking";

type RealtimeRow = Record<string, unknown>;
type RealtimeChangePayload = RealtimePostgresChangesPayload<RealtimeRow>;

export type RealtimeConnectionStatus =
  | "CONNECTING"
  | "SUBSCRIBED"
  | "TIMED_OUT"
  | "CLOSED"
  | "CHANNEL_ERROR";

export interface RealtimeEvent {
  bindingId: string;
  eventType: "INSERT" | "UPDATE" | "DELETE";
  row: RealtimeRow;
  oldRow: RealtimeRow;
  payload: RealtimeChangePayload;
}

export interface RealtimeRowChange {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  row: RealtimeRow;
}

export interface RealtimeSubscription {
  readonly id: string;
  readonly topic: RealtimeStreamKey;
  readonly channel: RealtimeChannel;
  status: RealtimeConnectionStatus;
  unsubscribe: () => void;
}

export type RealtimePresenceStateValue = string | number | boolean | null;
export type RealtimePresenceState = Record<string, RealtimePresenceStateValue>;

export interface RealtimePresenceSubscription extends RealtimeSubscription {
  track: (state: RealtimePresenceState) => Promise<void>;
  untrack: () => Promise<void>;
}

export interface RealtimePresenceOptions {
  presenceKey: string;
  initialState: RealtimePresenceState;
  onSync?: (state: ReturnType<RealtimeChannel["presenceState"]>) => void;
  onJoin?: (key: string, presences: unknown[]) => void;
  onLeave?: (key: string, presences: unknown[]) => void;
  onStatusChange?: (status: RealtimeConnectionStatus) => void;
}

export interface RealtimeSubscribeOptions {
  filterValues?: Readonly<Record<string, string>>;
  onEvent: (event: RealtimeEvent) => void;
  onStatusChange?: (status: RealtimeConnectionStatus) => void;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_ACTIVE_SUBSCRIPTIONS = 32;
const MAX_RECENT_EVENT_FINGERPRINTS = 256;
const BROADCAST_SUBSCRIBE_TIMEOUT_MS = 5_000;

function validateFilterValue(validator: "uuid", value: string): void {
  if (validator === "uuid" && !UUID_PATTERN.test(value)) {
    throw new Error("Invalid realtime UUID filter");
  }
}

function normalizeStatus(status: string): RealtimeConnectionStatus {
  switch (status) {
    case "SUBSCRIBED":
    case "TIMED_OUT":
    case "CLOSED":
    case "CHANNEL_ERROR":
      return status;
    default:
      return "CONNECTING";
  }
}

function serializedPayloadBytes(payload: unknown): number {
  const serialized = JSON.stringify(payload);
  return new TextEncoder().encode(serialized).byteLength;
}

function buildEventFingerprint(
  bindingId: string,
  payload: RealtimeChangePayload,
): string | null {
  const row = payload.eventType === "DELETE" ? payload.old : payload.new;
  const rowId = typeof row.id === "string" ? row.id : null;
  if (!rowId) return null;
  const metadata = payload as RealtimeChangePayload & {
    commit_timestamp?: string;
  };
  const version =
    metadata.commit_timestamp ??
    (typeof row.updated_at === "string" ? row.updated_at : null) ??
    (typeof row.created_at === "string" ? row.created_at : null);
  return version
    ? `${bindingId}:${payload.eventType}:${rowId}:${version}`
    : null;
}

export class RealtimeService {
  private readonly subscriptions = new Map<string, RealtimeSubscription>();
  private sequence = 0;

  constructor(private readonly client: SupabaseClient = supabase) {}

  subscribe(
    topic: RealtimeTopic,
    options: RealtimeSubscribeOptions,
  ): RealtimeSubscription {
    if (this.subscriptions.size >= MAX_ACTIVE_SUBSCRIPTIONS) {
      throw new Error("Realtime subscription limit reached");
    }

    const definition = getRealtimeTopicDefinition(topic);
    const subscriptionId = this.nextSubscriptionId(topic);
    const startedAt = performance.now();
    let closed = false;
    const recentEvents = new Set<string>();

    try {
      const resolvedBindings = definition.bindings.map((binding) => {
        let filter: string | undefined;
        if (binding.filter) {
          const value = options.filterValues?.[binding.filter.valueKey];
          if (!value) {
            throw new Error(
              `Missing realtime filter: ${binding.filter.valueKey}`,
            );
          }
          validateFilterValue(binding.filter.validator, value);
          filter = `${binding.filter.column}=eq.${value}`;
        }
        return { binding, filter };
      });

      let channel = this.client.channel(subscriptionId);

      for (const { binding, filter } of resolvedBindings) {
        channel = channel.on(
          "postgres_changes",
          {
            event: binding.event,
            schema: "public",
            table: binding.table,
            filter,
          },
          (payload) => {
            if (closed) return;
            try {
              const typedPayload = payload as RealtimeChangePayload;
              const eventType = typedPayload.eventType;
              const fingerprint = buildEventFingerprint(
                binding.id,
                typedPayload,
              );
              if (fingerprint && recentEvents.has(fingerprint)) return;
              if (fingerprint) {
                recentEvents.add(fingerprint);
                if (recentEvents.size > MAX_RECENT_EVENT_FINGERPRINTS) {
                  const oldest = recentEvents.values().next().value;
                  if (oldest) recentEvents.delete(oldest);
                }
              }
              options.onEvent({
                bindingId: binding.id,
                eventType,
                row:
                  eventType === "DELETE" ? typedPayload.old : typedPayload.new,
                oldRow: typedPayload.old,
                payload: typedPayload,
              });
            } catch (error) {
              trackError(error, {
                component: "RealtimeService",
                action: "dispatchEvent",
                metadata: { topic, bindingId: binding.id },
              });
            }
          },
        );
      }

      const subscription: RealtimeSubscription = {
        id: subscriptionId,
        topic,
        channel,
        status: "CONNECTING",
        unsubscribe: () => {
          if (closed) return;
          closed = true;
          subscription.status = "CLOSED";
          this.subscriptions.delete(subscriptionId);
          void this.client.removeChannel(channel).catch((error) => {
            trackError(error, {
              component: "RealtimeService",
              action: "removeChannel",
              metadata: { topic },
            });
          });
        },
      };

      this.subscriptions.set(subscriptionId, subscription);
      channel.subscribe((rawStatus) => {
        if (closed) return;
        const status = normalizeStatus(String(rawStatus));
        subscription.status = status;
        options.onStatusChange?.(status);

        if (status === "SUBSCRIBED") {
          trackPerformance(
            "realtime_subscription_latency_ms",
            performance.now() - startedAt,
            { topic },
          );
        } else if (status === "TIMED_OUT" || status === "CHANNEL_ERROR") {
          trackError(
            new Error(`Realtime subscription ${status.toLowerCase()}`),
            {
              component: "RealtimeService",
              action: "channelStatus",
              metadata: { topic, status },
            },
          );
        }
      });

      return subscription;
    } catch (error) {
      trackError(error, {
        component: "RealtimeService",
        action: "subscribe",
        metadata: { topic },
      });
      throw error;
    }
  }

  subscribeToPresence(
    topic: RealtimePresenceTopic,
    scopeId: string,
    options: RealtimePresenceOptions,
  ): RealtimePresenceSubscription {
    if (this.subscriptions.size >= MAX_ACTIVE_SUBSCRIPTIONS) {
      throw new Error("Realtime subscription limit reached");
    }
    if (
      !UUID_PATTERN.test(scopeId) ||
      !UUID_PATTERN.test(options.presenceKey)
    ) {
      throw new Error("Invalid realtime presence scope");
    }

    const definition = getRealtimePresenceDefinition(topic);
    this.validatePresenceState(options.initialState, definition.maxStateBytes);
    const subscriptionId = this.nextSubscriptionId(topic);
    const startedAt = performance.now();
    let closed = false;

    const channel = this.client
      .channel(`${definition.channelPrefix}:${scopeId}`, {
        config: { presence: { key: options.presenceKey } },
      })
      .on("presence", { event: "sync" }, () => {
        if (!closed) options.onSync?.(channel.presenceState());
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        if (!closed) options.onJoin?.(key, newPresences);
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        if (!closed) options.onLeave?.(key, leftPresences);
      });

    const untrack = async () => {
      await channel.untrack();
    };
    const track = async (state: RealtimePresenceState) => {
      this.validatePresenceState(state, definition.maxStateBytes);
      const result = await channel.track(state);
      if (result !== "ok") {
        throw new Error("Realtime presence state was not acknowledged");
      }
    };

    const subscription: RealtimePresenceSubscription = {
      id: subscriptionId,
      topic,
      channel,
      status: "CONNECTING",
      track,
      untrack,
      unsubscribe: () => {
        if (closed) return;
        closed = true;
        subscription.status = "CLOSED";
        this.subscriptions.delete(subscriptionId);
        void untrack()
          .catch((error) => {
            trackError(error, {
              component: "RealtimeService",
              action: "untrackPresence",
              metadata: { topic },
            });
          })
          .finally(() => this.client.removeChannel(channel));
      },
    };

    this.subscriptions.set(subscriptionId, subscription);
    channel.subscribe((rawStatus) => {
      if (closed) return;
      const status = normalizeStatus(String(rawStatus));
      subscription.status = status;
      options.onStatusChange?.(status);
      if (status === "SUBSCRIBED") {
        trackPerformance(
          "realtime_presence_latency_ms",
          performance.now() - startedAt,
          { topic },
        );
        void track(options.initialState).catch((error) => {
          trackError(error, {
            component: "RealtimeService",
            action: "trackPresence",
            metadata: { topic },
          });
        });
      }
    });

    return subscription;
  }

  async sendBroadcast(
    topic: RealtimeBroadcastTopic,
    scopeId: string,
    payload: unknown,
  ): Promise<void> {
    if (!UUID_PATTERN.test(scopeId)) {
      throw new Error("Invalid realtime broadcast scope");
    }
    const definition = getRealtimeBroadcastDefinition(topic);
    if (serializedPayloadBytes(payload) > definition.maxPayloadBytes) {
      throw new Error("Realtime broadcast payload is too large");
    }

    const channel = this.client.channel(
      `${definition.channelPrefix}:${scopeId}`,
    );
    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = globalThis.setTimeout(() => {
          reject(new Error("Realtime broadcast channel timed out"));
        }, BROADCAST_SUBSCRIBE_TIMEOUT_MS);

        channel.subscribe((rawStatus) => {
          const status = normalizeStatus(String(rawStatus));
          if (status === "SUBSCRIBED") {
            globalThis.clearTimeout(timeout);
            resolve();
          } else if (status === "TIMED_OUT" || status === "CHANNEL_ERROR") {
            globalThis.clearTimeout(timeout);
            reject(new Error(`Realtime broadcast ${status.toLowerCase()}`));
          }
        });
      });

      const result = await channel.send({
        type: "broadcast",
        event: definition.event,
        payload,
      });
      if (result !== "ok") {
        throw new Error("Realtime broadcast was not acknowledged");
      }
    } catch (error) {
      trackError(error, {
        component: "RealtimeService",
        action: "sendBroadcast",
        metadata: { topic },
      });
      throw error;
    } finally {
      await this.client.removeChannel(channel);
    }
  }

  subscribeToGroupMessages(
    groupId: string,
    onMessage: (change: RealtimeRowChange) => void,
  ): RealtimeSubscription {
    return this.subscribe("community.group-messages", {
      filterValues: { groupId },
      onEvent: ({ eventType, row }) => onMessage({ eventType, row }),
    });
  }

  subscribeToClassifiedMessages(
    conversationId: string,
    onMessage: (message: RealtimeRow) => void,
  ): RealtimeSubscription {
    return this.subscribe("messaging.classified-conversation-messages", {
      filterValues: { conversationId },
      onEvent: ({ row }) => onMessage(row),
    });
  }

  subscribeToCommunityDirectMessages(
    threadId: string,
    onMessage: (message: RealtimeRow) => void,
  ): RealtimeSubscription {
    return this.subscribe("messaging.community-thread-messages", {
      filterValues: { threadId },
      onEvent: ({ row }) => onMessage(row),
    });
  }

  unsubscribe(subscriptionId: string): void {
    this.subscriptions.get(subscriptionId)?.unsubscribe();
  }

  unsubscribeAll(): void {
    for (const subscription of Array.from(this.subscriptions.values())) {
      subscription.unsubscribe();
    }
    logger.info("All realtime subscriptions removed");
  }

  getSubscription(subscriptionId: string): RealtimeSubscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  getActiveSubscriptions(): ReadonlyArray<{
    id: string;
    topic: RealtimeStreamKey;
    status: RealtimeConnectionStatus;
  }> {
    return Array.from(this.subscriptions.values(), (subscription) => ({
      id: subscription.id,
      topic: subscription.topic,
      status: subscription.status,
    }));
  }

  private nextSubscriptionId(topic: RealtimeStreamKey): string {
    this.sequence += 1;
    return `rt:${topic}:${this.sequence}`;
  }

  private validatePresenceState(
    state: RealtimePresenceState,
    maxStateBytes: number,
  ): void {
    if (serializedPayloadBytes(state) > maxStateBytes) {
      throw new Error("Realtime presence state is too large");
    }
  }
}

export const realtimeService = new RealtimeService();
