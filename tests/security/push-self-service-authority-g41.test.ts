import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const service = read("src/core/notifications/services/PushService.ts");
const hook = read("src/core/notifications/hooks/usePush.ts");
const edge = read("supabase/functions/send-push/index.ts");
const config = read("supabase/config.toml");

describe("G41 push self-service authority", () => {
  it("keeps browser push delivery scoped to the authenticated user", () => {
    expect(edge).toContain("if (user.id !== userId)");
    expect(edge).toContain("Cannot send push notification for another user");
    expect(config).toMatch(/\[functions\.send-push\]\s*verify_jwt = true/);
  });

  it("does not expose the self-delivery primitive through the React hook", () => {
    expect(service).toContain("private static async sendToUser(");
    expect(hook).not.toContain("sendToUser");
  });

  it("keeps the nonexistent browser bulk path retired", () => {
    expect(service).not.toContain("send-push-bulk");
    expect(service).not.toContain("sendToUsers(");
    expect(hook).not.toContain("sendToUsers");
  });

  it("requires a real delivered device before reporting test success", () => {
    expect(service).toContain("successCount < 1");
    expect(service).toContain("Push provider did not deliver the notification");
  });

  it("rolls back a browser subscription when server persistence is not authoritative", () => {
    const subscribeStart = service.indexOf("static async subscribe(");
    const unsubscribeStart = service.indexOf("static async unsubscribe(");
    const subscribeBlock = service.slice(subscribeStart, unsubscribeStart);

    expect(subscribeBlock).toContain("rollbackBrowserSubscription");
    expect(subscribeBlock).toContain("await rollbackBrowserSubscription();");
    expect(subscribeBlock).toContain("typeof data.subscriptionId !== 'string'");
    expect(subscribeBlock).toContain("!UUID_PATTERN.test(data.subscriptionId)");
  });

  it("disables delivery server-side before local browser cleanup", () => {
    const unsubscribeStart = service.indexOf("static async unsubscribe(");
    const subscriptionsStart = service.indexOf("static async getSubscriptions(");
    const unsubscribeBlock = service.slice(unsubscribeStart, subscriptionsStart);

    const edgeMutation = unsubscribeBlock.indexOf("supabase.functions.invoke('unsubscribe-push'");
    const browserCleanup = unsubscribeBlock.indexOf("browserSubscription.unsubscribe()");

    expect(edgeMutation).toBeGreaterThanOrEqual(0);
    expect(browserCleanup).toBeGreaterThan(edgeMutation);
    expect(unsubscribeBlock).toContain("Server disabled push but browser cleanup failed");
  });

  it("does not hide subscription read failures as an empty successful list", () => {
    const subscriptionsStart = service.indexOf("static async getSubscriptions(");
    const deliveryStart = service.indexOf("private static async sendToUser(");
    const subscriptionsBlock = service.slice(subscriptionsStart, deliveryStart);

    expect(subscriptionsBlock).toContain("throw error;");
    expect(subscriptionsBlock).not.toContain("return [];");
  });
});
