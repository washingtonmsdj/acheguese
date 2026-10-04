import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("MVP Business detail navigation", () => {
  it("keeps the active Business shell on certified MVP destinations", () => {
    const source = readFileSync(
      "src/modules/business/company/pages/EmpresaDetailLayout.tsx",
      "utf8",
    );

    expect(source).toContain("LAUNCH_URLS.business");
    expect(source).toContain("LAUNCH_URLS.search");
    expect(source).not.toContain("notifications");
    expect(source).not.toContain("@/app/config/lifecycleRegistry");

    expect(source).not.toContain('to="/explorar"');
    expect(source).not.toContain('to="/favoritos"');
    expect(source).not.toContain("servicos, eventos");
    expect(source).not.toContain("Ctrl K");
  });
});
