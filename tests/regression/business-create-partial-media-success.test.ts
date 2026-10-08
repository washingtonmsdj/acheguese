import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const createPage = readFileSync("src/modules/business/pages/CriarEmpresaPage.tsx", "utf8");
const hook = readFileSync(
  "src/modules/business/hooks/useBusinessCreateMultiProfile.ts",
  "utf8",
);

describe("Business creation committed before optional media setup", () => {
  it("serializes form submissions until the committed create is resolved", () => {
    expect(createPage).toContain("const createSubmissionInFlightRef = useRef(false);");
    expect(createPage).toContain("const createdBusinessRef = useRef(false);");
    expect(createPage).toContain("if (createSubmissionInFlightRef.current || createdBusinessRef.current) return;");
    expect(createPage).toContain("createSubmissionInFlightRef.current = true;");
    expect(createPage).toContain("createdBusinessRef.current = true;");
    expect(createPage).toContain("createSubmissionInFlightRef.current = false;");
  });

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
