import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const hook = readFileSync(
  "src/core/notifications/useUnifiedNotifications.ts",
  "utf8",
);

describe("notification Realtime statistics failure boundary", () => {
  it("handles rejected stats refresh without detaching the Realtime handler", () => {
    expect(hook).toMatch(
      /void notificationService\s*\.getStats\(user\.id\)\s*\.then\([\s\S]*?\)\s*\.catch\(\(err: unknown\) => \{\s*logger\.error\("Erro ao atualizar estatisticas de notificacoes:", err\);\s*\}\);/,
    );
  });

  it("does not count an already-read Realtime INSERT as unread", () => {
    expect(hook).toContain(
      "unread: prev.unread + (newNotification.read ? 0 : 1),",
    );
    expect(hook).not.toContain("unread: prev.unread + 1,");
  });

  it("ignores soft-deleted notifications before deduplication and counters", () => {
    expect(hook).toMatch(
      /const newNotification = notification;\s*if \(newNotification\.deleted_at\) return;\s*if \(seenNotificationIdsRef\.current\.has\(newNotification\.id\)\) return;/,
    );
  });

  it("does not apply stats after an account switch", () => {
    expect(hook).toContain("if (activeUserIdRef.current === user.id) {");
    expect(hook).toContain("setStats((current) => ({ ...current, ...statsData }));");
  });
});
