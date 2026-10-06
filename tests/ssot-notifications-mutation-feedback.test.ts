import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const hook = read("src/core/notifications/useUnifiedNotifications.ts");
const center = read("src/app/components/notifications/NotificationCenter.tsx");

describe("notifications mutation feedback SSOT", () => {
  it("keeps mark-all failure distinct from a valid zero-update result", () => {
    expect(hook).toContain(
      "const markAllAsRead = useCallback(async (): Promise<number | null> => {",
    );
    expect(hook).toContain("if (!requestUserId) return null;");
    expect(hook).toContain('logger.error("Erro ao marcar todas como lidas:", err);');
    expect(hook).toContain("return null;");
    expect(hook).not.toContain(
      'logger.error("Erro ao marcar todas como lidas:", err);\n      return 0;',
    );
  });

  it("does not swallow inbox mutation failures", () => {
    expect(center).toContain(
      "const [mutationError, setMutationError] = useState<string | null>(null);",
    );
    expect(center).toContain("const updatedCount = await markAllAsRead();");
    expect(center).toContain("if (updatedCount === null)");
    expect(center).toContain("const marked = await markAsRead(notificationId);");
    expect(center).toContain("if (!marked)");
    expect(center).toContain("const deleted = await deleteNotification(notificationId);");
    expect(center).toContain("if (!deleted)");
    expect(center).not.toContain("await markAllAsRead();");
    expect(center).not.toContain("await markAsRead(notificationId);");
    expect(center).not.toContain("await deleteNotification(notificationId);");
  });

  it("surfaces mutation failure through an accessible local alert", () => {
    expect(center).toContain("{mutationError ? (");
    expect(center).toContain('role="alert"');
    expect(center).toContain("<p>{mutationError}</p>");
    expect(center).toContain("border-territory-error/30");
    expect(center).toContain("bg-territory-error/10");
    expect(center).toContain("text-territory-error");
    expect(center).toContain("enableToast: false");
  });
});
