import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("public events action truthfulness", () => {
  const detail = readFileSync(
    "src/modules/community-events/pages/EventDetailPage.tsx",
    "utf8",
  );
  const share = readFileSync(
    "src/modules/community-events/components/EventShareModal.tsx",
    "utf8",
  );

  it("does not silently accept an unauthenticated favorite action", () => {
    const favoriteStart = detail.indexOf("const handleFavorite = () => {");
    const favoriteEnd = detail.indexOf("const handleShare = () => {", favoriteStart);
    const favoriteHandler = detail.slice(favoriteStart, favoriteEnd);
    const authGuard = favoriteHandler.indexOf("if (!activeProfile?.id)");
    const favoriteCommand = favoriteHandler.indexOf("void toggleFavorite(event.id)");

    expect(favoriteStart).toBeGreaterThanOrEqual(0);
    expect(favoriteEnd).toBeGreaterThan(favoriteStart);
    expect(authGuard).toBeGreaterThanOrEqual(0);
    expect(favoriteCommand).toBeGreaterThan(authGuard);
    expect(favoriteHandler).toContain("Faca login para salvar");
    expect(favoriteHandler).toContain("Entre com sua conta para salvar este evento.");
  });

  it("confirms clipboard copy only after a successful write", () => {
    const clipboardWrite = share.indexOf("await navigator.clipboard.writeText(fullUrl)");
    const copiedState = share.indexOf("setCopied(true)");

    expect(share).toContain("navigator.clipboard?.writeText");
    expect(clipboardWrite).toBeGreaterThanOrEqual(0);
    expect(copiedState).toBeGreaterThan(clipboardWrite);
    expect(share).toContain("setCopied(false)");
    expect(share).toContain("Nao foi possivel copiar o link neste navegador.");
  });

  it("surfaces QR generation failure and keeps unavailable options out", () => {
    expect(share).toContain("Nao foi possivel gerar o QR Code agora.");
    expect(share).toContain('aria-live="polite"');
    expect(share).not.toContain("Instagram,");
  });
});
