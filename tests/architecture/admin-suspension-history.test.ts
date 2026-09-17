import { describe, expect, it } from "vitest";
import { AdminSuspensionHistoryService } from "@/core/admin/services/AdminSuspensionHistoryService";
import type { DriverModerationEvent } from "@/core/mobility/services/DriverModerationEventsService";

const profile = {
  user_id: "user-1",
  is_suspended: false,
  suspended_until: null,
  suspension_reason: null,
  suspended_at: null,
  updated_at: "2026-01-01T00:00:00Z",
};

function event(
  input: Partial<DriverModerationEvent> &
    Pick<DriverModerationEvent, "id" | "action" | "created_at">,
): DriverModerationEvent {
  return {
    driver_profile_id: "profile-1",
    admin_profile_id: "admin-1",
    reason: null,
    metadata: {},
    ...input,
  };
}

describe("AdminSuspensionHistoryService", () => {
  it("pairs suspensions with the next reactivation and sorts newest first", () => {
    const history = AdminSuspensionHistoryService.build("profile-1", profile, [
      event({ id: "suspended", action: "suspended", created_at: "2026-02-01T00:00:00Z" }),
      event({ id: "reactivated", action: "reactivated", created_at: "2026-02-03T00:00:00Z" }),
    ]);

    expect(history.map(({ id }) => id)).toEqual(["reactivated", "suspended"]);
    expect(history.find(({ id }) => id === "suspended")).toMatchObject({
      lifted_at: "2026-02-03T00:00:00Z",
      lifted_by: "admin-1",
      is_active: false,
    });
  });

  it("uses the profile snapshot when no moderation event exists", () => {
    const history = AdminSuspensionHistoryService.build(
      "profile-1",
      { ...profile, is_suspended: true, suspended_at: null, suspended_until: "2026-05-01T00:00:00Z" },
      [],
      new Date("2026-04-01T00:00:00Z"),
    );

    expect(history).toEqual([
      expect.objectContaining({
        id: "profile-1-active-suspension",
        suspended_at: "2026-01-01T00:00:00Z",
        suspended_until: "2026-05-01T00:00:00Z",
        is_active: true,
      }),
    ]);
  });
});
