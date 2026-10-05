import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const passiveRuntime = readFileSync(
  "src/core/maps/components/v3/MapLibrePassiveRuntime.tsx",
  "utf8",
);

describe("passive map logger dispatch", () => {
  it("keeps logger severity dispatch explicit", () => {
    expect(passiveRuntime).toContain('if (level === "warn")');
    expect(passiveRuntime).toContain("logger.warn(message, context)");
    expect(passiveRuntime).toContain("logger.debug(message, context)");
    expect(passiveRuntime).not.toContain("logger[level]");
  });
});
