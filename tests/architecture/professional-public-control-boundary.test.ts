import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(
  resolve(process.cwd(), "src/modules/professionals/pages/ProfissionalPublicPage.tsx"),
  "utf8",
);

describe("professional public control boundary", () => {
  it("does not expose fake profile tabs without navigation or state", () => {
    expect(page).not.toContain("function ProfileTabs()");
    expect(page).not.toContain("<ProfileTabs />");
    expect(page).not.toContain('{ label: "Trabalhos", active: false }');
    expect(page).not.toContain('{ label: "Recomendações", active: false }');
  });

  it("does not expose a report button without a canonical report action", () => {
    expect(page).not.toContain("Denunciar perfil");
    expect(page).not.toContain("<Flag");
  });

  it("keeps the real lead/conversation action available", () => {
    expect(page).toContain("<ProfessionalLeadRequestDialog");
    expect(page).toContain("ConversationButton");
    expect(page).toContain("disabled={!profile.is_accepting_clients}");
  });
});
