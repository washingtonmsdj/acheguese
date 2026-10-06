import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(path), "utf8");
}

describe("Notifications active MVP surface", () => {
  it("does not present a failed inbox read as an empty inbox", () => {
    const center = readProjectFile(
      "src/app/components/notifications/NotificationCenter.tsx",
    );

    expect(center).toContain("error,");
    expect(center).toContain("refresh,");
    expect(center).toContain("if (error)");
    expect(center).toContain("Não foi possível carregar suas notificações");
    expect(center).toContain("Sua caixa de entrada não foi tratada como vazia.");
    expect(center).toContain("onClick={() => void refresh()}");
    expect(center).toContain("Tentar novamente");
  });

  it("keeps long notification actions responsive on narrow screens", () => {
    const center = readProjectFile(
      "src/app/components/notifications/NotificationCenter.tsx",
    );
    const page = readProjectFile("src/app/pages/NotificationsPage.tsx");

    expect(center).toContain(
      "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
    );
    expect(center).toContain("w-full border-territory-border");
    expect(center).toContain("sm:w-auto");

    expect(page).toContain(
      "flex flex-col gap-4 rounded-3xl border border-territory-border",
    );
    expect(page).toContain("sm:flex-row sm:items-start sm:justify-between");
    expect(page).toContain("w-full border-territory-border");
    expect(page).toContain("sm:w-auto");
  });
});
