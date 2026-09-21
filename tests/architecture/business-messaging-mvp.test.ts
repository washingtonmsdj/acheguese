import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const migration = read(
  "supabase/migrations/20260921135500_create_business_direct_messaging_mvp.sql",
);
const service = read(
  "src/core/messaging/services/BusinessDirectMessagingService.ts",
);
const provider = read(
  "src/core/messaging/providers/BusinessMessagingProvider.ts",
);
const providerRegistry = read(
  "src/core/messaging/providers/messagingProviderRegistry.ts",
);
const inbox = read("src/modules/messaging/pages/MensagensPage.tsx");
const cta = read(
  "src/modules/business/company/sections/EmpresaCTAsSection.tsx",
);
const companyPage = read("src/app/pages/EmpresaDetailLandingPage.tsx");
const platformRegistry = read(
  "src/app/config/platformCapabilityRegistry.ts",
);
const realtimeRegistry = read(
  "src/core/realtime/config/realtimeRegistry.ts",
);

describe("Business Messaging MVP", () => {
  it("keeps Business messaging as a dedicated aggregate with server-owned writes", () => {
    for (const table of [
      "business_direct_threads",
      "business_direct_thread_participants",
      "business_direct_messages",
      "business_direct_message_reports",
    ]) {
      expect(migration).toContain(`CREATE TABLE public.${table}`);
      expect(migration).toContain(
        `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`,
      );
    }

    for (const rpc of [
      "create_business_direct_thread",
      "list_business_direct_thread_previews",
      "list_business_direct_messages",
      "send_business_direct_message",
      "mark_business_direct_thread_read",
      "set_business_direct_thread_blocked",
      "report_business_direct_thread",
    ]) {
      expect(migration).toContain(`FUNCTION public.${rpc}`);
    }

    expect(migration).toContain("private.auth_owns_active_profile");
    expect(migration).toContain("business_direct_message_rate_limit_exceeded");
    expect(migration).toContain("business_direct_thread_rate_limit_exceeded");
    expect(migration).toContain("private.business_direct_message_audit_log");
    expect(migration).toContain("Metadata-only");
  });

  it("keeps the browser service on RPC + Realtime owners only", () => {
    expect(service).toContain('supabase.rpc(');
    expect(service).toContain("subscribeToBusinessDirectMessages");
    expect(service).not.toContain('.from("business_direct_');
    expect(service).not.toContain(".channel(");
    expect(realtimeRegistry).toContain(
      '"messaging.business-thread-messages"',
    );
    expect(realtimeRegistry).toContain('table: "business_direct_messages"');
  });

  it("composes Business into the horizontal Inbox without enabling paused domains", () => {
    expect(platformRegistry).toContain('messaging: {');
    expect(platformRegistry).toContain('status: "active"');
    expect(platformRegistry).toContain(
      'dependsOnProductModules: ["business"]',
    );

    expect(providerRegistry).toContain("businessMessagingProvider");
    expect(providerRegistry).toContain("classifieds: null");
    expect(providerRegistry).toContain("community: null");
    expect(provider).toContain('providerId: "business"');
    expect(inbox).toContain("getActiveMessagingProviders()");
    expect(inbox).toContain('/mensagens/${thread.providerId}/${thread.threadId}');
  });

  it("exposes a real internal message CTA from Business using business_data identity", () => {
    expect(cta).toContain('label="Mensagem"');
    expect(companyPage).toContain("businessDirectMessagingService.createOrGetThread");
    expect(companyPage).toContain("institutionalBusinessDataId");
    expect(companyPage).toContain("buildLoginPath(returnTo)");
    expect(companyPage).toContain(
      'navigate(`/mensagens/business/${threadId}`)',
    );
  });
});
