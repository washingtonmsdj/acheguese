import { describe, expect, it } from "vitest";

import { isEventCurrentOrFuture } from "@/core/community-events/eventFreshness";
import type { PublicEvent } from "@/core/community-events/types";

const NOW = Date.parse("2026-09-06T06:00:00.000Z");

function event(
  input: Pick<PublicEvent, "date" | "status"> & Partial<PublicEvent>,
): Pick<PublicEvent, "date" | "end_date" | "status"> {
  return {
    date: input.date,
    end_date: input.end_date,
    status: input.status,
  };
}

describe("eventFreshness", () => {
  it("keeps future upcoming events", () => {
    expect(
      isEventCurrentOrFuture(
        event({
          date: "2026-09-07T12:00:00.000Z",
          status: "upcoming",
        }),
        NOW,
      ),
    ).toBe(true);
  });

  it("rejects stale upcoming events", () => {
    expect(
      isEventCurrentOrFuture(
        event({
          date: "2026-09-05T12:00:00.000Z",
          status: "upcoming",
        }),
        NOW,
      ),
    ).toBe(false);
  });

  it("keeps ongoing events only while their active window is valid", () => {
    expect(
      isEventCurrentOrFuture(
        event({
          date: "2026-09-06T05:00:00.000Z",
          end_date: "2026-09-06T08:00:00.000Z",
          status: "ongoing",
        }),
        NOW,
      ),
    ).toBe(true);

    expect(
      isEventCurrentOrFuture(
        event({
          date: "2026-09-04T05:00:00.000Z",
          status: "ongoing",
        }),
        NOW,
      ),
    ).toBe(false);
  });

  it("rejects completed and cancelled events even with future timestamps", () => {
    for (const status of ["completed", "cancelled"] as const) {
      expect(
        isEventCurrentOrFuture(
          event({
            date: "2026-09-07T12:00:00.000Z",
            status,
          }),
          NOW,
        ),
      ).toBe(false);
    }
  });
});
