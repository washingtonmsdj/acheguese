import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const publicViewBroker = readFileSync(
  "supabase/functions/track-public-view/index.ts",
  "utf8",
);

describe("track-public-view RPC dispatch safety", () => {
  it("keeps RPC names and argument names explicit after entity validation", () => {
    expect(publicViewBroker).toContain('"increment_business_views"');
    expect(publicViewBroker).toContain('"increment_professional_views"');
    expect(publicViewBroker).toContain('"increment_vaga_view_count"');
    expect(publicViewBroker).toContain('{ business_id: entityId }');
    expect(publicViewBroker).toContain('{ professional_id: entityId }');
    expect(publicViewBroker).toContain('{ vaga_id: entityId }');
    expect(publicViewBroker).toContain("supabaseAdmin.rpc(functionName, rpcArgs)");
    expect(publicViewBroker).not.toContain("VIEW_COUNTER_RPCS");
    expect(publicViewBroker).not.toContain("argName");
    expect(publicViewBroker).not.toContain("[entityType]");
  });
});
