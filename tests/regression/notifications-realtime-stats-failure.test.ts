import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const hook = readFileSync(
  "src/core/notifications/useUnifiedNotifications.ts",
  "utf8",
);
const service = readFileSync(
  "src/core/notifications/services/NotificationService.ts",
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

  it("propagates statistics query errors rather than reporting a false empty inbox", () => {
    expect(service).toMatch(
      /catch \(error\) \{\s*logger\.error\("Error getting notification stats:", error\);\s*throw error;\s*\}/,
    );
    expect(service).not.toContain(
      'logger.error("Error getting notification stats:", error);\n      return { total: 0, unread: 0 };',
    );
  });

  it("rejects stale stats responses after a newer update", () => {
    expect(hook).toContain("const statsRequestRef = useRef(0);");
    expect(hook).toContain("const statsRequestId = ++statsRequestRef.current;");
    expect(hook).toContain("statsRequestRef.current === statsRequestId");
    expect(hook).toContain("++statsRequestRef.current;");
  });

  it("does not apply stats after an account switch", () => {
    expect(hook).toContain("if (activeUserIdRef.current === user.id) {");
    expect(hook).toContain("setStats((current) => ({ ...current, ...statsData }));");
  });
});
