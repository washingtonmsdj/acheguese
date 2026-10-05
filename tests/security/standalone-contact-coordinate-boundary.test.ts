import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isValidCoordinates } from "../../src/shared/validation";

const contactBar = readFileSync(
  "src/shared/components/standalone/StandaloneContactBar.tsx",
  "utf8",
);

describe("StandaloneContactBar coordinate boundary", () => {
  it("treats zero coordinates as valid and rejects non-finite/out-of-range values", () => {
    expect(isValidCoordinates(0, 0)).toBe(true);
    expect(isValidCoordinates(-90, -180)).toBe(true);
    expect(isValidCoordinates(90, 180)).toBe(true);
    expect(isValidCoordinates(Number.NaN, 0)).toBe(false);
    expect(isValidCoordinates(0, Number.POSITIVE_INFINITY)).toBe(false);
    expect(isValidCoordinates(91, 0)).toBe(false);
    expect(isValidCoordinates(0, 181)).toBe(false);
  });

  it("uses the shared coordinate validator instead of truthiness checks", () => {
    expect(contactBar).toContain('import { isValidCoordinates } from "@/shared/validation";');
    expect(contactBar).toContain("const hasCoordinates = isValidCoordinates(");
    expect(contactBar).toContain("(hasCoordinates || business.address)");
    expect(contactBar).not.toContain("business.latitude && business.longitude");
    expect(contactBar).not.toContain("business.latitude || business.address");
  });
});