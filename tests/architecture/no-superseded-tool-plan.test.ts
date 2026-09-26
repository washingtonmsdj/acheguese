import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("superseded tool planning hygiene", () => {
  it("keeps completed Lovable implementation plans out of the live tree", () => {
    expect(existsSync(".lovable/plan.md")).toBe(false);
  });
});
