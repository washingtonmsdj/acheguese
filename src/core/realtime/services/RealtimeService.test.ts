import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@/integrations/supabase";

vi.mock("@/integrations/supabase", () => ({ supabase: {} }));
vi.mock("@/shared/utils/errorTracking", () => ({
  trackError: vi.fn(),
  trackPerformance: vi.fn(),
}));
vi.mock("@/shared/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { RealtimeService } from "./RealtimeService";

type ChannelHandler = {
  kind: string;
  options: Record<string, unknown>;
  callback: (payload: never) => void;
};

function createFakeClient() {
  const channels: Array<{
    name: string;
    handlers: ChannelHandler[];
    statusCallback?: (status: string) => void;
    channel: {
      on: ReturnType<typeof vi.fn>;
      subscribe: ReturnType<typeof vi.fn>;
      send: ReturnType<typeof vi.fn>;
      track: ReturnType<typeof vi.fn>;
      untrack: ReturnType<typeof vi.fn>;
      presenceState: ReturnType<typeof vi.fn>;
    };
  }> = [];

  const channel = vi.fn((name: string) => {
    const handlers: ChannelHandler[] = [];
    const record = {
      name,
      handlers,
      statusCallback: undefined as ((status: string) => void) | undefined,
      channel: {} as (typeof channels)[number]["channel"],
    };
    const fakeChannel = {
      on: vi.fn(
        (
          kind: string,
          options: Record<string, unknown>,
          callback: (payload: never) => void,
        ) => {
          handlers.push({ kind, options, callback });
          return fakeChannel;
        },
      ),
      subscribe: vi.fn((callback?: (status: string) => void) => {
        record.statusCallback = callback;
        return fakeChannel;
      }),
      send: vi.fn().mockResolvedValue("ok"),
      track: vi.fn().mockResolvedValue("ok"),
      untrack: vi.fn().mockResolvedValue("ok"),
      presenceState: vi.fn().mockReturnValue({}),
    };
    record.channel = fakeChannel;
    channels.push(record);
    return fakeChannel;
  });
  const removeChannel = vi.fn().mockResolvedValue("ok");
  const client = { channel, removeChannel } as unknown as SupabaseClient;

  return { client, channel, channels, removeChannel };
}

const USER_ID = "11111111-1111-4111-8111-111111111111";
const CONVERSATION_ID = "22222222-2222-4222-8222-222222222222";
const ACTIVE_SUBSCRIPTION_LIMIT = 32;
const RECENT_EVENT_FINGERPRINT_LIMIT = 256;

function subscribeToConversation(service: RealtimeService, onEvent = vi.fn()) {
  return service.subscribe("messaging.classified-conversation-messages", {
    filterValues: { conversationId: CONVERSATION_ID },
    onEvent,
  });
}

describe("RealtimeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves closed registry bindings and validated filters", () => {
    const fake = createFakeClient();
    const service = new RealtimeService(fake.client);
    const onEvent = vi.fn();

    const subscription = service.subscribe("notifications.user", {
      filterValues: { userId: USER_ID },
      onEvent,
    });

    expect(fake.channel).toHaveBeenCalledOnce();
    expect(fake.channels[0].handlers).toHaveLength(2);
    expect(fake.channels[0].handlers[0].options).toMatchObject({
      event: "INSERT",
      table: "notifications",
      filter: `user_id=eq.${USER_ID}`,
    });
    expect(fake.channels[0].handlers[1].options).toMatchObject({
      event: "UPDATE",
      table: "notifications",
      filter: `user_id=eq.${USER_ID}`,
    });

    const payload = {
      eventType: "INSERT",
      new: { id: "notification-1" },
      old: {},
      commit_timestamp: "2026-07-15T09:00:00.000Z",
    } as never;
    fake.channels[0].handlers[0].callback(payload);
    fake.channels[0].handlers[0].callback(payload);
    expect(onEvent).toHaveBeenCalledOnce();
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        bindingId: "insert",
        eventType: "INSERT",
        row: { id: "notification-1" },
      }),
    );
    expect(subscription.topic).toBe("notifications.user");
  });

  it("rejects invalid or missing filters before opening a channel", () => {
    const fake = createFakeClient();
    const service = new RealtimeService(fake.client);

    expect(() =>
      service.subscribe("messaging.classified-conversation-messages", {
        filterValues: { conversationId: "not-a-uuid" },
        onEvent: vi.fn(),
      }),
    ).toThrow("Invalid realtime UUID filter");
    expect(() =>
      service.subscribe("messaging.classified-conversation-messages", {
        onEvent: vi.fn(),
      }),
    ).toThrow("Missing realtime filter: conversationId");
    expect(fake.channel).not.toHaveBeenCalled();
  });

  it("tracks status and removes a channel exactly once", async () => {
    const fake = createFakeClient();
    const service = new RealtimeService(fake.client);
    const onStatusChange = vi.fn();
    const onEvent = vi.fn();
    const subscription = service.subscribe(
      "messaging.classified-conversation-messages",
      {
        filterValues: { conversationId: CONVERSATION_ID },
        onEvent,
        onStatusChange,
      },
    );

    fake.channels[0].statusCallback?.("SUBSCRIBED");
    expect(subscription.status).toBe("SUBSCRIBED");
    expect(onStatusChange).toHaveBeenCalledWith("SUBSCRIBED");
    fake.channels[0].statusCallback?.("CHANNEL_ERROR");
    fake.channels[0].statusCallback?.("SUBSCRIBED");
    expect(subscription.status).toBe("SUBSCRIBED");
    expect(fake.channel).toHaveBeenCalledOnce();

    subscription.unsubscribe();
    subscription.unsubscribe();
    await vi.waitFor(() => expect(fake.removeChannel).toHaveBeenCalledOnce());
    expect(subscription.status).toBe("CLOSED");
    expect(service.getActiveSubscriptions()).toEqual([]);

    fake.channels[0].handlers[0].callback({
      eventType: "INSERT",
      new: { id: "late-message" },
      old: {},
    } as never);
    expect(onEvent).not.toHaveBeenCalled();
  });

  it("does not leak channels across repeated mount and unmount cycles", async () => {
    const fake = createFakeClient();
    const service = new RealtimeService(fake.client);

    for (let index = 0; index < 10; index += 1) {
      service
        .subscribe("messaging.classified-conversation-messages", {
          filterValues: { conversationId: CONVERSATION_ID },
          onEvent: vi.fn(),
        })
        .unsubscribe();
    }

    await vi.waitFor(() =>
      expect(fake.removeChannel).toHaveBeenCalledTimes(10),
    );
    expect(service.getActiveSubscriptions()).toEqual([]);
  });

  it("uses an ephemeral subscribed channel for broadcast", async () => {
    const fake = createFakeClient();
    const service = new RealtimeService(fake.client);
    const promise = service.sendBroadcast("mobility.driver-offer", USER_ID, {
      rideId: "ride-1",
    });

    fake.channels[0].statusCallback?.("SUBSCRIBED");
    await promise;

    expect(fake.channels[0].channel.send).toHaveBeenCalledWith({
      type: "broadcast",
      event: "ride_offered",
      payload: { rideId: "ride-1" },
    });
    expect(fake.removeChannel).toHaveBeenCalledOnce();
  });

  it("tracks and cleans up a bounded presence state", async () => {
    const fake = createFakeClient();
    const service = new RealtimeService(fake.client);
    const subscription = service.subscribeToPresence(
      "presence.conversation",
      CONVERSATION_ID,
      {
        presenceKey: USER_ID,
        initialState: { online: true },
      },
    );

    fake.channels[0].statusCallback?.("SUBSCRIBED");
    await vi.waitFor(() =>
      expect(fake.channels[0].channel.track).toHaveBeenCalledWith({
        online: true,
      }),
    );
    await expect(
      subscription.track({ value: "x".repeat(5_000) }),
    ).rejects.toThrow("Realtime presence state is too large");

    subscription.unsubscribe();
    await vi.waitFor(() => expect(fake.removeChannel).toHaveBeenCalledOnce());
    expect(fake.channels[0].channel.untrack).toHaveBeenCalledOnce();
  });

  it("accepts active subscriptions below the defensive local bound", () => {
    const fake = createFakeClient();
    const service = new RealtimeService(fake.client);

    for (let index = 0; index < ACTIVE_SUBSCRIPTION_LIMIT - 1; index += 1) {
      subscribeToConversation(service);
    }

    expect(service.getActiveSubscriptions()).toHaveLength(
      ACTIVE_SUBSCRIPTION_LIMIT - 1,
    );
    expect(fake.channel).toHaveBeenCalledTimes(ACTIVE_SUBSCRIPTION_LIMIT - 1);
  });

  it("accepts exactly the defensive active subscription bound", () => {
    const fake = createFakeClient();
    const service = new RealtimeService(fake.client);

    for (let index = 0; index < ACTIVE_SUBSCRIPTION_LIMIT; index += 1) {
      subscribeToConversation(service);
    }

    expect(service.getActiveSubscriptions()).toHaveLength(
      ACTIVE_SUBSCRIPTION_LIMIT,
    );
    expect(fake.channel).toHaveBeenCalledTimes(ACTIVE_SUBSCRIPTION_LIMIT);
  });

  it("rejects a subscription above the bound before opening a channel", () => {
    const fake = createFakeClient();
    const service = new RealtimeService(fake.client);

    for (let index = 0; index < ACTIVE_SUBSCRIPTION_LIMIT; index += 1) {
      subscribeToConversation(service);
    }

    expect(() => subscribeToConversation(service)).toThrow(
      "Realtime subscription limit reached",
    );
    expect(service.getActiveSubscriptions()).toHaveLength(
      ACTIVE_SUBSCRIPTION_LIMIT,
    );
    expect(fake.channel).toHaveBeenCalledTimes(ACTIVE_SUBSCRIPTION_LIMIT);
  });

  it("releases capacity immediately when a subscription is cleaned up", async () => {
    const fake = createFakeClient();
    const service = new RealtimeService(fake.client);
    const subscriptions = Array.from(
      { length: ACTIVE_SUBSCRIPTION_LIMIT },
      () => subscribeToConversation(service),
    );

    subscriptions[0].unsubscribe();
    expect(service.getActiveSubscriptions()).toHaveLength(
      ACTIVE_SUBSCRIPTION_LIMIT - 1,
    );

    expect(() => subscribeToConversation(service)).not.toThrow();
    expect(service.getActiveSubscriptions()).toHaveLength(
      ACTIVE_SUBSCRIPTION_LIMIT,
    );
    await vi.waitFor(() => expect(fake.removeChannel).toHaveBeenCalledOnce());
  });

  it("evicts the oldest fingerprint while retaining recent duplicate detection", () => {
    const fake = createFakeClient();
    const service = new RealtimeService(fake.client);
    const onEvent = vi.fn();

    subscribeToConversation(service, onEvent);
    const dispatch = fake.channels[0].handlers[0].callback;
    const payload = (index: number) =>
      ({
        eventType: "INSERT",
        new: { id: `message-${index}` },
        old: {},
        commit_timestamp: `version-${index}`,
      }) as never;

    for (let index = 0; index <= RECENT_EVENT_FINGERPRINT_LIMIT; index += 1) {
      dispatch(payload(index));
    }
    expect(onEvent).toHaveBeenCalledTimes(RECENT_EVENT_FINGERPRINT_LIMIT + 1);

    dispatch(payload(RECENT_EVENT_FINGERPRINT_LIMIT));
    expect(onEvent).toHaveBeenCalledTimes(RECENT_EVENT_FINGERPRINT_LIMIT + 1);

    dispatch(payload(0));
    expect(onEvent).toHaveBeenCalledTimes(RECENT_EVENT_FINGERPRINT_LIMIT + 2);
  });
});
