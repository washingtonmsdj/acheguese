import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const workflow = read(".github/workflows/ssot-tests.yml");
const runner = read("tests/release/run-messaging-authenticated.mjs");
const messagingE2e = read("tests/e2e/messaging-authenticated.spec.ts");

describe("authenticated release Messaging certification", () => {
  it("certifies Business Messaging after the existing Account + Business smoke", () => {
    const authenticatedJob =
      workflow.match(
        /\n  authenticated_account_e2e:[\s\S]*?(?=\n  [a-zA-Z0-9_-]+:\n)/,
      )?.[0] ?? "";

    const accountBusiness = authenticatedJob.indexOf(
      "Run authenticated Account and Business lifecycle E2E",
    );
    const messaging = authenticatedJob.indexOf(
      "Run authenticated Business Messaging E2E",
    );

    expect(authenticatedJob).toContain(
      "name: Authenticated release E2E (Production smoke)",
    );
    expect(accountBusiness).toBeGreaterThanOrEqual(0);
    expect(messaging).toBeGreaterThan(accountBusiness);
    expect(authenticatedJob).toContain(
      "run: node tests/release/run-messaging-authenticated.mjs",
    );
    expect(authenticatedJob).toContain(
      "Authenticated Business Messaging E2E ran read-only against the active Business provider.",
    );
  });

  it("keeps the Messaging proof read-only and tied to the Business provider RPC", () => {
    expect(runner).toContain('"tests/e2e/messaging-authenticated.spec.ts"');
    expect(runner).toContain('"--project=chromium"');
    expect(runner).toContain('"--retries=0"');
    expect(runner).not.toContain("service_role");
    expect(runner).not.toContain("SUPABASE_SERVICE_ROLE_KEY");

    expect(messagingE2e).toContain(
      'test("abre a Inbox e consulta o provider Business sem criar mensagens"',
    );
    expect(messagingE2e).toContain(
      '"/rest/v1/rpc/list_business_direct_thread_previews"',
    );
    expect(messagingE2e).toContain(
      "businessPreviewStatuses.every((status) => status >= 200 && status < 300)",
    );
    expect(messagingE2e).not.toContain("sendMessage(");
    expect(messagingE2e).not.toContain("insert(");
    expect(messagingE2e).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("keeps the horizontal Notifications Inbox in the authenticated release proof without mutations", () => {
    expect(messagingE2e).toContain(
      'test("abre a Inbox horizontal de Notificações sob RLS sem mutar estado"',
    );
    expect(messagingE2e).toContain('page.goto("/notificacoes"');
    expect(messagingE2e).toContain(
      'response.request().method() === "GET"',
    );
    expect(messagingE2e).toContain(
      'response.url().includes("/rest/v1/notifications")',
    );
    expect(messagingE2e).toContain(
      "notificationReadStatuses.every(",
    );
    expect(messagingE2e).not.toContain("markAsRead(");
    expect(messagingE2e).not.toContain("markAllAsRead(");
    expect(messagingE2e).not.toContain("deleteNotification(");
  });
});
