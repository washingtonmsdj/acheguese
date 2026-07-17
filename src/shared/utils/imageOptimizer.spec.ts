import { describe, expect, it } from "vitest";

import {
  assertSafeSourceImageDimensions,
  IMAGE_SOURCE_LIMITS,
} from "./imageOptimizer";

describe("assertSafeSourceImageDimensions", () => {
  it("accepts ordinary post images", () => {
    expect(() => assertSafeSourceImageDimensions(4032, 3024)).not.toThrow();
  });

  it("rejects oversized dimensions and decompression-style pixel counts", () => {
    expect(() =>
      assertSafeSourceImageDimensions(IMAGE_SOURCE_LIMITS.maxDimension + 1, 1),
    ).toThrow(/safe processing limit/);
    expect(() => assertSafeSourceImageDimensions(10_000, 10_000)).toThrow(
      /safe processing limit/,
    );
  });

  it("rejects invalid dimensions", () => {
    expect(() => assertSafeSourceImageDimensions(0, 100)).toThrow();
    expect(() => assertSafeSourceImageDimensions(Number.NaN, 100)).toThrow();
  });
});
