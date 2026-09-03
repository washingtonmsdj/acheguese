import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  DEFENSIVE_LOCAL_BOUNDS,
  findHardcodeViolations,
} from "../../tools/architecture/validate-ssot-hardcodes";

const LIMIT_VIOLATION_TYPE = "Limite operacional hardcoded";

describe("validate-ssot-hardcodes defensive local bounds", () => {
  it("registers only the reviewed local bounds with ownership and rationale", () => {
    expect(DEFENSIVE_LOCAL_BOUNDS).toEqual([
      expect.objectContaining({
        file: "src/core/realtime/services/RealtimeService.ts",
        constant: "MAX_ACTIVE_SUBSCRIPTIONS",
        value: 32,
        classification: "defensive-local-bound",
      }),
      expect.objectContaining({
        file: "src/core/realtime/services/RealtimeService.ts",
        constant: "MAX_RECENT_EVENT_FINGERPRINTS",
        value: 256,
        classification: "defensive-local-bound",
      }),
      expect.objectContaining({
        file: "src/core/posts/services/postFeedCursor.ts",
        constant: "MAX_CURSOR_LENGTH",
        value: 512,
        classification: "defensive-local-bound",
      }),
    ]);

    for (const bound of DEFENSIVE_LOCAL_BOUNDS) {
      expect(bound.scope.length).toBeGreaterThan(0);
      expect(bound.rationale.length).toBeGreaterThan(0);
    }
  });

  it("accepts the exact reviewed declarations in their owner files", () => {
    const files = [
      "src/core/realtime/services/RealtimeService.ts",
      "src/core/posts/services/postFeedCursor.ts",
    ];

    const limitViolations = files.flatMap((file) =>
      findHardcodeViolations(
        file,
        readFileSync(resolve(process.cwd(), file), "utf8"),
      ).filter((violation) => violation.type === LIMIT_VIOLATION_TYPE),
    );

    expect(limitViolations).toEqual([]);
  });

  it("does not allow the same declaration in a different file", () => {
    const findings = findHardcodeViolations(
      "src/core/realtime/services/AnotherService.ts",
      "const MAX_ACTIVE_SUBSCRIPTIONS = 32;",
    );

    expect(findings).toEqual([
      expect.objectContaining({ type: LIMIT_VIOLATION_TYPE }),
    ]);
  });

  it("requires review when a registered value changes", () => {
    const findings = findHardcodeViolations(
      "src/core/realtime/services/RealtimeService.ts",
      "const MAX_ACTIVE_SUBSCRIPTIONS = 33;",
    );

    expect(findings).toEqual([
      expect.objectContaining({ type: LIMIT_VIOLATION_TYPE }),
    ]);
  });

  it("continues to reject unregistered limits in a registered owner file", () => {
    const findings = findHardcodeViolations(
      "src/core/realtime/services/RealtimeService.ts",
      "const MAX_UNREVIEWED_QUEUE = 10;",
    );

    expect(findings).toEqual([
      expect.objectContaining({ type: LIMIT_VIOLATION_TYPE }),
    ]);
  });
});
