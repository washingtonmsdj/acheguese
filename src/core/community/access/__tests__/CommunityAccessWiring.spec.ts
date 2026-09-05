import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("community access wiring", () => {
  it("keeps resident-only community pages behind the central access policy", () => {
    const pages = [
      "src/core/community/pages/ComunidadePage.tsx",
      "src/core/community/pages/GruposPage.tsx",
      "src/core/community/pages/RecomendacoesPage.tsx",
      "src/core/community/pages/NovaRecomendacaoPage.tsx",
      "src/core/community-lost-found/pages/AchadosPerdidosPage.tsx",
      "src/core/community-lost-found/pages/NovoAchadoPerdidoPage.tsx",
      "src/core/community/pages/GrupoDetailPage.tsx",
    ];

    for (const page of pages) {
      const source = readProjectFile(page);

      expect(source, page).toContain("useCommunityAccess");
      expect(source, page).toContain("CommunityPortalGate");
      expect(source, page).toMatch(/communityAccess\.can\.[a-z_]+/);
    }
  });

  it("passes central permission flags into community feed actions and modals", () => {
    const pageSource = readProjectFile("src/core/community/pages/ComunidadePage.tsx");

    expect(pageSource).toContain("canReact={communityAccess.can.react}");
    expect(pageSource).toContain("canComment={communityAccess.can.comment}");
    expect(pageSource).toContain("canSave={communityAccess.can.save}");
    expect(pageSource).toContain("canReport={communityAccess.can.report}");
    expect(pageSource).toContain("canSendMessage={communityAccess.can.send_message}");
    expect(pageSource).toContain("canCreatePost={communityAccess.can.create_post}");
    expect(pageSource).toContain("canCreateAlert={communityAccess.can.create_alert}");
    expect(pageSource).toContain("canCreateIssue={communityAccess.can.create_issue}");
    expect(pageSource).toContain("commentBlockedMessage={getBlockedCommunityActionMessage");
  });
});
