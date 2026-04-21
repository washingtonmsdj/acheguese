import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminNotificationsService } from "../AdminNotificationsService";

const rpcMock = vi.fn();

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

vi.mock("@/core/profiles/services/ProfileService", () => ({
  profileService: {
    getProfilesByIds: vi.fn(async () => []),
  },
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe("AdminNotificationsService", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("maps channel stats from admin RPC", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          total_push_subscriptions: 12,
          active_push_subscriptions: 10,
          inactive_push_subscriptions: 2,
          users_with_push_subscriptions: 7,
          email_sent_24h: 30,
          email_delivered_24h: 27,
          email_failed_24h: 3,
        },
      ],
      error: null,
    });

    const result = await adminNotificationsService.getChannelStats();

    expect(result).toEqual({
      totalPushSubscriptions: 12,
      activePushSubscriptions: 10,
      inactivePushSubscriptions: 2,
      usersWithPushSubscriptions: 7,
      emailSent24h: 30,
      emailDelivered24h: 27,
      emailFailed24h: 3,
    });
  });

  it("maps template stats list from admin RPC", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          template: "welcome_email",
          total: 11,
          sent: 11,
          delivered: 9,
          failed: 2,
          opened: 4,
          clicked: 1,
          last_sent_at: "2026-04-21T12:00:00.000Z",
        },
      ],
      error: null,
    });

    const result = await adminNotificationsService.getTemplateStats(5);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      template: "welcome_email",
      total: 11,
      sent: 11,
      delivered: 9,
      failed: 2,
      opened: 4,
      clicked: 1,
      lastSentAt: "2026-04-21T12:00:00.000Z",
    });
  });

  it("maps delivery audit rows and total count", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: "a-1",
          user_id: "u-1",
          email: "test@example.com",
          template: "digest",
          subject: "Digest semanal",
          status: "delivered",
          provider_id: "provider-1",
          error_message: null,
          metadata: { tenant: "acheguese" },
          created_at: "2026-04-21T10:00:00.000Z",
          total_count: 42,
        },
      ],
      error: null,
    });

    const result = await adminNotificationsService.getEmailDeliveryAudit({
      page: 2,
      limit: 10,
    });

    expect(result.total).toBe(42);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(5);
    expect(result.data[0]).toMatchObject({
      id: "a-1",
      userId: "u-1",
      email: "test@example.com",
      template: "digest",
      status: "delivered",
      createdAt: "2026-04-21T10:00:00.000Z",
    });
  });

  it("returns safe fallback when RPC fails", async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: "forbidden" },
    });

    const result = await adminNotificationsService.getChannelStats();
    expect(result.totalPushSubscriptions).toBe(0);
    expect(result.emailFailed24h).toBe(0);
  });
});

