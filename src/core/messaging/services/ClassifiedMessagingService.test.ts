import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  buildPublicUrl: vi.fn(() => "/classificados/anuncio-teste"),
  trackError: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: { rpc: mocks.rpc, from: vi.fn() },
}));
vi.mock("@/core/classifieds/services", () => ({
  classifiedUrlService: { buildPublicUrl: mocks.buildPublicUrl },
  getClassifiedById: vi.fn(),
}));
vi.mock("@/core/profiles/services", () => ({
  profileService: { getProfileById: vi.fn() },
}));
vi.mock("@/core/trust", () => ({
  TrustIncidentService: { reportClassifiedMessage: vi.fn() },
}));
vi.mock("@/core/realtime", () => ({
  realtimeService: { subscribeToClassifiedMessages: vi.fn() },
}));
vi.mock("@/shared/utils/errorTracking", () => ({
  trackError: mocks.trackError,
}));
vi.mock("@/shared/utils/logger", () => ({
  logger: { error: vi.fn() },
}));

import { ClassifiedMessagingService } from "./ClassifiedMessagingService";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";

function previewRow(index: number) {
  const suffix = index.toString().padStart(12, "0");
  return {
    id: `20000000-0000-4000-8000-${suffix}`,
    classified_id: `30000000-0000-4000-8000-${suffix}`,
    buyer_id: PROFILE_ID,
    seller_id: `40000000-0000-4000-8000-${suffix}`,
    status: "active",
    last_message_at: `2026-07-15T12:00:0${index}+00:00`,
    created_at: "2026-07-15T10:00:00+00:00",
    updated_at: "2026-07-15T12:00:00+00:00",
    is_active: true,
    blocked_by: null,
    block_reason: null,
    classified_title: `Anuncio ${index}`,
    classified_price: 100 + index,
    classified_photo: "https://example.test/photo.jpg",
    classified_public_id: `PUB-${index}`,
    classified_slug: `anuncio-${index}`,
    other_user_id: `40000000-0000-4000-8000-${suffix}`,
    other_user_name: `Pessoa ${index}`,
    other_user_avatar: "",
    last_message_text: `Mensagem ${index}`,
    unread_count: index,
  };
}

describe("ClassifiedMessagingService inbox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads one bounded RPC page and emits a deterministic keyset cursor", async () => {
    mocks.rpc.mockResolvedValue({
      data: [previewRow(1), previewRow(2), previewRow(3)],
      error: null,
    });
    const service = new ClassifiedMessagingService();

    const page = await service.listConversationPreviews({
      profileId: PROFILE_ID,
      limit: 2,
      search: "  padaria  ",
    });

    expect(mocks.rpc).toHaveBeenCalledOnce();
    expect(mocks.rpc).toHaveBeenCalledWith(
      "list_classified_conversation_previews",
      expect.objectContaining({
        p_profile_id: PROFILE_ID,
        p_limit: 3,
        p_search: "padaria",
      }),
    );
    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toEqual({
      lastMessageAt: "2026-07-15T12:00:02+00:00",
      id: "20000000-0000-4000-8000-000000000002",
    });
    expect(page.items[0]?.classified_public_url).toBe(
      "/classificados/anuncio-teste",
    );
  });

  it("passes both cursor columns and ends pagination without an extra row", async () => {
    mocks.rpc.mockResolvedValue({ data: [previewRow(3)], error: null });
    const service = new ClassifiedMessagingService();
    const cursor = {
      lastMessageAt: "2026-07-15T12:00:02+00:00",
      id: "20000000-0000-4000-8000-000000000002",
    };

    const page = await service.listConversationPreviews({
      profileId: PROFILE_ID,
      cursor,
    });

    expect(mocks.rpc).toHaveBeenCalledWith(
      "list_classified_conversation_previews",
      expect.objectContaining({
        p_cursor_last_message_at: cursor.lastMessageAt,
        p_cursor_id: cursor.id,
      }),
    );
    expect(page.nextCursor).toBeNull();
  });

  it.each([
    [{ profileId: "not-a-uuid" }, "Profile ID"],
    [
      { profileId: PROFILE_ID, search: "x".repeat(101) },
      "exceeds 100 characters",
    ],
    [
      {
        profileId: PROFILE_ID,
        cursor: { lastMessageAt: "invalid", id: PROFILE_ID },
      },
      "cursor",
    ],
  ])(
    "rejects invalid input before calling Supabase",
    async (query, message) => {
      const service = new ClassifiedMessagingService();
      await expect(service.listConversationPreviews(query)).rejects.toThrow(
        message,
      );
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );

  it("fails closed when the read model violates its runtime schema", async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ ...previewRow(1), other_user_id: "invalid" }],
      error: null,
    });
    const service = new ClassifiedMessagingService();

    await expect(
      service.listConversationPreviews({ profileId: PROFILE_ID }),
    ).rejects.toThrow("Invalid classified conversation preview response");
    expect(mocks.trackError).toHaveBeenCalledOnce();
  });
});
