import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const publicViewBroker = readFileSync(
  "supabase/functions/track-public-view/index.ts",
  "utf8",
);

describe("track-public-view RPC argument safety", () => {
  it("keeps RPC argument names explicit after entity validation", () => {
    expect(publicViewBroker).toContain('{ business_id: entityId }');
    expect(publicViewBroker).toContain('{ professional_id: entityId }');
    expect(publicViewBroker).toContain('{ vaga_id: entityId }');
    expect(publicViewBroker).not.toContain("argName");
    expect(publicViewBroker).toContain(
      'const counterRpc = VIEW_COUNTER_RPCS[entityType];',
    );
  });
});
