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
    subscribeToCommunityDirectMessages: mocks.subscribe,
  },
}));
vi.mock("@/shared/utils/errorTracking", () => ({
  trackError: mocks.trackError,
}));

import { CommunityDirectMessagingService } from "./CommunityDirectMessagingService";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const COMMUNITY_ID = "22222222-2222-4222-8222-222222222222";
const POST_ID = "33333333-3333-4333-8333-333333333333";
const RECIPIENT_ID = "44444444-4444-4444-8444-444444444444";
const THREAD_ID = "55555555-5555-4555-8555-555555555555";

function threadRow(index: number) {
  const suffix = index.toString().padStart(12, "0");
  return {
    id: `60000000-0000-4000-8000-${suffix}`,
    community_id: COMMUNITY_ID,
    context_post_id: POST_ID,
    post_title: `Publicacao ${index}`,
    post_type: "discussao",
    post_image_url: "",
    other_profile_id: RECIPIENT_ID,
    other_profile_name: "Pessoa da comunidade",
    other_profile_avatar: "",
    other_profile_verified: true,
    last_message_at: `2026-07-15T08:00:0${index}+00:00`,
    last_message_text: `Mensagem ${index}`,
    unread_count: index,
    blocked_by_me: false,
    blocked_by_other: false,
    closed_at: null,
    created_at: "2026-07-15T07:00:00+00:00",
  };
}

function messageRow(index: number) {
  const suffix = index.toString().padStart(12, "0");
  return {
    id: `70000000-0000-4000-8000-${suffix}`,
    thread_id: THREAD_ID,
    sender_profile_id: index % 2 === 0 ? PROFILE_ID : RECIPIENT_ID,
    body: `Mensagem ${index}`,
    is_removed: false,
    created_at: `2026-07-15T08:00:0${index}+00:00`,
  };
}

describe("CommunityDirectMessagingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a Community thread without using a Classified identifier", async () => {
    mocks.rpc.mockResolvedValue({ data: THREAD_ID, error: null });
    const service = new CommunityDirectMessagingService();

    await expect(
      service.createOrGetThread({
        profileId: PROFILE_ID,
        communityId: COMMUNITY_ID,
        postId: POST_ID,
        recipientProfileId: RECIPIENT_ID,
      }),
    ).resolves.toBe(THREAD_ID);
    expect(mocks.rpc).toHaveBeenCalledWith("create_community_direct_thread", {
      p_profile_id: PROFILE_ID,
      p_community_id: COMMUNITY_ID,
      p_post_id: POST_ID,
      p_recipient_profile_id: RECIPIENT_ID,
    });
  });

  it("paginates the inbox with limit plus one and a paired cursor", async () => {
    mocks.rpc.mockResolvedValue({
      data: [threadRow(3), threadRow(2), threadRow(1)],
      error: null,
    });
    const service = new CommunityDirectMessagingService();
    const page = await service.listConversationPreviews({
      profileId: PROFILE_ID,
      limit: 2,
    });

    expect(mocks.rpc).toHaveBeenCalledWith(
      "list_community_direct_thread_previews",
      expect.objectContaining({ p_limit: 3 }),
    );
    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toEqual({
      lastMessageAt: "2026-07-15T08:00:02+00:00",
      id: "60000000-0000-4000-8000-000000000002",
    });
  });

  it("returns a chronological message page while paging backwards", async () => {
    mocks.rpc.mockResolvedValue({
      data: [messageRow(3), messageRow(2), messageRow(1)],
      error: null,
    });
    const service = new CommunityDirectMessagingService();
    const page = await service.listMessagePage({
      profileId: PROFILE_ID,
      threadId: THREAD_ID,
      limit: 2,
    });

    expect(page.items.map((message) => message.id)).toEqual([
      "70000000-0000-4000-8000-000000000002",
      "70000000-0000-4000-8000-000000000003",
    ]);
    expect(page.nextCursor).toEqual({
      createdAt: "2026-07-15T08:00:02+00:00",
      id: "70000000-0000-4000-8000-000000000002",
    });
  });

  it("trims message content but never includes it in error telemetry", async () => {
    mocks.rpc.mockResolvedValue({ data: [messageRow(1)], error: null });
    const service = new CommunityDirectMessagingService();
    await service.sendMessage({
      profileId: PROFILE_ID,
      threadId: THREAD_ID,
      body: "  texto privado  ",
    });

    expect(mocks.rpc).toHaveBeenCalledWith("send_community_direct_message", {
      p_profile_id: PROFILE_ID,
      p_thread_id: THREAD_ID,
      p_body: "texto privado",
    });
    expect(mocks.trackError).not.toHaveBeenCalled();
  });

  it.each([
    [
      () =>
        new CommunityDirectMessagingService().createOrGetThread({
          profileId: "invalid",
          communityId: COMMUNITY_ID,
          postId: POST_ID,
          recipientProfileId: RECIPIENT_ID,
        }),
      "Profile ID",
    ],
    [
      () =>
        new CommunityDirectMessagingService().sendMessage({
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
