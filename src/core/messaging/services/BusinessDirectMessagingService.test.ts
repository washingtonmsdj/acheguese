import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  subscribe: vi.fn(),
  trackError: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: { rpc: mocks.rpc },
}));
vi.mock("@/core/realtime", () => ({
  realtimeService: {
    subscribeToBusinessDirectMessages: mocks.subscribe,
  },
}));
vi.mock("@/shared/utils/errorTracking", () => ({
  trackError: mocks.trackError,
}));

import { BusinessDirectMessagingService } from "./BusinessDirectMessagingService";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const BUSINESS_ID = "22222222-2222-4222-8222-222222222222";
const BUSINESS_PROFILE_ID = "33333333-3333-4333-8333-333333333333";
const THREAD_ID = "44444444-4444-4444-8444-444444444444";

function previewRow(index: number) {
  const suffix = index.toString().padStart(12, "0");
  return {
    id: `50000000-0000-4000-8000-${suffix}`,
    business_id: BUSINESS_ID,
    business_name: "Mercado Horizonte",
    business_slug: "mercado-horizonte",
    business_profile_id: BUSINESS_PROFILE_ID,
    business_avatar_url: "",
    customer_profile_id: PROFILE_ID,
    customer_name: "Cliente",
    customer_avatar_url: "",
    counterparty_profile_id: BUSINESS_PROFILE_ID,
    counterparty_name: "Mercado Horizonte",
    counterparty_avatar_url: "",
    participant_role: "customer" as const,
    last_message_at: `2026-09-21T12:00:0${index}+00:00`,
    last_message_text: `Mensagem ${index}`,
    unread_count: index,
    blocked_by_me: false,
    blocked_by_other: false,
    closed_at: null,
    created_at: "2026-09-21T11:00:00+00:00",
  };
}

function messageRow(index: number) {
  const suffix = index.toString().padStart(12, "0");
  return {
    id: `60000000-0000-4000-8000-${suffix}`,
    thread_id: THREAD_ID,
    sender_profile_id: index % 2 === 0 ? PROFILE_ID : BUSINESS_PROFILE_ID,
    body: `Mensagem ${index}`,
    is_removed: false,
    created_at: `2026-09-21T12:00:0${index}+00:00`,
  };
}

describe("BusinessDirectMessagingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates or reuses a Business thread through the server-owned command", async () => {
    mocks.rpc.mockResolvedValue({ data: THREAD_ID, error: null });
    const service = new BusinessDirectMessagingService();

    await expect(
      service.createOrGetThread({
        profileId: PROFILE_ID,
        businessId: BUSINESS_ID,
      }),
    ).resolves.toBe(THREAD_ID);

    expect(mocks.rpc).toHaveBeenCalledWith("create_business_direct_thread", {
      p_profile_id: PROFILE_ID,
      p_business_id: BUSINESS_ID,
    });
  });

  it("paginates the Business inbox with a paired cursor", async () => {
    mocks.rpc.mockResolvedValue({
      data: [previewRow(3), previewRow(2), previewRow(1)],
      error: null,
    });
    const service = new BusinessDirectMessagingService();

    const page = await service.listConversationPreviews({
      profileId: PROFILE_ID,
      limit: 2,
    });

    expect(mocks.rpc).toHaveBeenCalledWith(
      "list_business_direct_thread_previews",
      expect.objectContaining({ p_limit: 3 }),
    );
    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toEqual({
      lastMessageAt: "2026-09-21T12:00:02+00:00",
      id: "50000000-0000-4000-8000-000000000002",
    });
  });

  it("returns messages in chronological order while paging backwards", async () => {
    mocks.rpc.mockResolvedValue({
      data: [messageRow(3), messageRow(2), messageRow(1)],
      error: null,
    });
    const service = new BusinessDirectMessagingService();

    const page = await service.listMessagePage({
      profileId: PROFILE_ID,
      threadId: THREAD_ID,
      limit: 2,
    });

    expect(page.items.map((message) => message.id)).toEqual([
      "60000000-0000-4000-8000-000000000002",
      "60000000-0000-4000-8000-000000000003",
    ]);
  });

  it("trims private message content and keeps it out of telemetry", async () => {
    mocks.rpc.mockResolvedValue({ data: [messageRow(1)], error: null });
    const service = new BusinessDirectMessagingService();

    await service.sendMessage({
      profileId: PROFILE_ID,
      threadId: THREAD_ID,
      body: "  Olá, ainda está aberto?  ",
    });

    expect(mocks.rpc).toHaveBeenCalledWith("send_business_direct_message", {
      p_profile_id: PROFILE_ID,
      p_thread_id: THREAD_ID,
      p_body: "Olá, ainda está aberto?",
    });
    expect(mocks.trackError).not.toHaveBeenCalled();
  });

  it("delegates realtime to the canonical Realtime owner", () => {
    const subscription = { id: "rt:business:1" };
    mocks.subscribe.mockReturnValue(subscription);
    const service = new BusinessDirectMessagingService();

    expect(
      service.subscribeToThread(THREAD_ID, vi.fn()),
    ).toBe(subscription);
    expect(mocks.subscribe).toHaveBeenCalledWith(
      THREAD_ID,
      expect.any(Function),
    );
  });

  it.each([
    [
      () =>
        new BusinessDirectMessagingService().createOrGetThread({
          profileId: "invalid",
          businessId: BUSINESS_ID,
        }),
      "Profile ID",
    ],
    [
      () =>
        new BusinessDirectMessagingService().sendMessage({
          profileId: PROFILE_ID,
          threadId: THREAD_ID,
          body: " ",
        }),
      "message body",
    ],
  ])("rejects invalid input before transport", async (operation, message) => {
    await expect(operation()).rejects.toThrow(message);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
