import { describe, expect, it } from "vitest";
import {
  decodePostFeedCursor,
  encodePostFeedCursor,
  postFeedKeysetFilter,
} from "../postFeedCursor";

const timestamp = "2026-07-13T22:40:00.000Z";
const postId = "11111111-1111-4111-8111-111111111111";

describe("post feed keyset cursor", () => {
  it("round-trips a deterministic timestamp and id cursor", () => {
    const decoded = decodePostFeedCursor(
      encodePostFeedCursor({ createdAt: timestamp, id: postId }),
    );

    expect(decoded).toEqual({ createdAt: timestamp, id: postId });
    expect(postFeedKeysetFilter(decoded)).toBe(
      `created_at.lt.${timestamp},and(created_at.eq.${timestamp},id.lt.${postId})`,
    );
  });

  it("accepts the former timestamp-only cursor without permitting malformed data", () => {
    expect(decodePostFeedCursor(timestamp)).toEqual({ createdAt: timestamp });
    expect(postFeedKeysetFilter({ createdAt: timestamp })).toBeNull();
    expect(() => decodePostFeedCursor("not-a-cursor")).toThrow("Invalid cursor");
    expect(() => decodePostFeedCursor("A".repeat(513))).toThrow("Invalid cursor");
    expect(() => decodePostFeedCursor("2026-" + "0".repeat(70))).toThrow(
      "Invalid cursor",
    );
  });

  it("emits a browser-safe base64url cursor without Node Buffer", () => {
    const encoded = encodePostFeedCursor({ createdAt: timestamp, id: postId });

    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encoded).not.toContain("=");
  });
});
