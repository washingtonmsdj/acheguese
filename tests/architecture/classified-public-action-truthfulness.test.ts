import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const page = readFileSync(
  resolve(root, "src/modules/classifieds/pages/ClassificadoDetailPage.tsx"),
  "utf8",
);

describe("classified public action truthfulness", () => {
  it("only exposes WhatsApp for a plausible persisted contact", () => {
    expect(page).toContain("onlyDigits(sellerWhatsAppNumber).length >= 10");
    expect(page).toContain('sellerContact?.whatsapp || ""');
    expect(page).not.toContain("sellerContact?.whatsapp || sellerContact?.phone");
    expect(page).toContain("hasWhatsApp={sellerHasValidWhatsApp}");
    expect(page).toContain("!sellerHasValidWhatsApp");
    expect(page).toContain("!openSafeExternalUrl(url");
    expect(page).toContain('title: "WhatsApp indisponível"');
  });


  it("does not ship a simulated inline seller conversation", () => {
    const retiredInlineChat = resolve(
      root,
      "src/modules/classifieds/components/detail/InlineChat.tsx",
    );

    expect(existsSync(retiredInlineChat)).toBe(false);
    expect(page).not.toContain("InlineChat");
    expect(page).not.toContain("Online agora");
    expect(page).not.toContain("Obrigado pelo interesse! Vou responder em breve.");
  });

  it("does not convert native-share cancellation into an automatic copy", () => {
    expect(page).toContain('error.name === "AbortError"');
    expect(page).toContain("if (!navigator.clipboard?.writeText)");
    expect(page).toContain('toast({ title: "Link copiado!" })');
  });

  it("requires authentication before opening the report form", () => {
    expect(page).toContain("const handleOpenReport = useCallback");
    expect(page).toContain("if (!activeProfile?.id)");
    expect(page).toContain("navigate(appUrls.auth.login)");
    expect(page).toContain("onClick={handleOpenReport}");
    expect(page).not.toContain("onClick={() => setReportOpen(true)}");
  });

  it("keeps report confirmation factual", () => {
    expect(page).toContain("Nossa equipe recebeu a denúncia para análise.");
    expect(page).not.toContain("Nossa equipe irá analisar em breve.");
  });
});
