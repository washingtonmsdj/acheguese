import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const hook = readFileSync(
  "src/modules/business/hooks/useBusinessCreateMultiProfile.ts",
  "utf8",
);

describe("Business creation committed before optional media setup", () => {
  it("creates the business only through the canonical owner", () => {
    expect(hook).toContain("await BusinessService.createBusiness(inputWithLocation)");
    expect(hook).not.toContain("MultiProfileService.create");
  });

  it("reports partial media setup without treating the committed creation as failed", () => {
    expect(hook).toContain("let mediaSetupIncomplete = false;");
    expect(hook).toContain("mediaSetupIncomplete = true;");
    expect(hook).toContain("toast.warning(");
    expect(hook).toContain("result.mediaSetupIncomplete");
    expect(hook).toContain("profile_id: profileId,");
  });

  it("logs optional upload failures and keeps one canonical media update", () => {
    expect(hook).toContain("logger.error(\"Falha ao associar mídia à empresa criada:\", error)");
    expect(hook.match(/BusinessService\.updateBusiness\(profileId,/g)).toHaveLength(1);
  });
});
