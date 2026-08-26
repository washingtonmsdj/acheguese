import { describe, expect, it } from "vitest";
import { parseEventCheckinQrPayload } from "./checkinQr";

describe("parseEventCheckinQrPayload", () => {
  it("accepts valid payload", () => {
    const payload = parseEventCheckinQrPayload({
      eventId: "11111111-1111-4111-8111-111111111111",
      checkinCode: "22222222-2222-4222-8222-222222222222",
      profileId: "33333333-3333-4333-8333-333333333333",
      timestamp: new Date().toISOString(),
    });

    expect(payload.eventId).toBe("11111111-1111-4111-8111-111111111111");
    expect(payload.checkinCode).toBe("22222222-2222-4222-8222-222222222222");
  });

  it("rejects payload without checkinCode", () => {
    expect(() =>
      parseEventCheckinQrPayload({
        eventId: "11111111-1111-4111-8111-111111111111",
      })
    ).toThrowError();
  });

  it("rejects payload with invalid uuid", () => {
    expect(() =>
      parseEventCheckinQrPayload({
        eventId: "not-uuid",
        checkinCode: "22222222-2222-4222-8222-222222222222",
      })
    ).toThrowError();
  });
});

