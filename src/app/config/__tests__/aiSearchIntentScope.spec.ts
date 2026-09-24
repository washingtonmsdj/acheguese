import { describe, expect, it } from "vitest";
import { getActiveAISearchIntentTypes } from "../aiSearchIntentScope";

describe("AI assisted search lifecycle scope", () => {
  it("keeps only Business intents active in the current MVP", () => {
    expect(getActiveAISearchIntentTypes()).toEqual(["business_search"]);
  });
});
