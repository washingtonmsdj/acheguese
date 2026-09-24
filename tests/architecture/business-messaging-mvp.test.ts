import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const migration = read(
  "supabase/migrations/20260921174312_create_business_direct_messaging_mvp.sql",
);
const normalizedMigration = migration.replace(/\s+/g, " ");
const service = read(
  "src/core/messaging/services/BusinessDirectMessagingService.ts",
);
const provider = read(
  "src/core/messaging/providers/BusinessMessagingProvider.ts",
);
const messagingRoutes = read(
  "src/core/messaging/routes/messagingRoutes.ts",
);
const businessEntry = read(
  "src/core/messaging/services/openBusinessDirectConversation.ts",
);
const providerRegistry = read(
  "src/core/messaging/providers/messagingProviderRegistry.ts",
);
const providerScope = read(
  "src/app/config/messagingProviderScope.ts",
);
const inboxWrapper = read("src/app/pages/MessagingInboxPage.tsx");
const inbox = read("src/modules/messaging/pages/MensagensPage.tsx");
const cta = read(
  "src/modules/business/company/sections/EmpresaCTAsSection.tsx",
);
const companyPage = read("src/app/pages/EmpresaDetailLandingPage.tsx");
const appRoutes = read("src/app/routes/sections/AppLayoutRoutes.tsx");
const platformRegistry = read(
  "src/app/config/platformCapabilityRegistry.ts",
);
const realtimeRegistry = read(
  "src/core/realtime/config/realtimeRegistry.ts",
);
const advisorResidualRegister = JSON.parse(
  read(
    "docs/09-reference/governance/security/SUPABASE_ADVISOR_RESIDUALS.json",
  ),
) as {
  residuals: Array<{
    cacheKey: string;
    callerClass?: string;
    exceptionId: string;
  }>;
};

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

  it("keeps authenticated clients read-only on messaging tables and anon outside RPC execution", () => {
    const tables = [
      "business_direct_threads",
      "business_direct_thread_participants",
      "business_direct_messages",
      "business_direct_message_reports",
    ];

    for (const table of tables) {
      expect(normalizedMigration).toContain(
        `REVOKE ALL ON TABLE public.${table} FROM PUBLIC, anon, authenticated;`,
      );
      expect(normalizedMigration).toContain(
        `GRANT SELECT ON TABLE public.${table} TO authenticated;`,
      );
    }

    expect(normalizedMigration).not.toMatch(
      /GRANT (?:INSERT|UPDATE|DELETE|ALL) ON TABLE public\.business_direct_(?:threads|thread_participants|messages|message_reports) TO authenticated;/,
    );

    const rpcSignatures = [
      "create_business_direct_thread(UUID, UUID)",
      "list_business_direct_thread_previews( UUID, INTEGER, TIMESTAMPTZ, UUID, TEXT )",
      "list_business_direct_messages( UUID, UUID, INTEGER, TIMESTAMPTZ, UUID )",
      "send_business_direct_message(UUID, UUID, TEXT)",
      "mark_business_direct_thread_read(UUID, UUID)",
      "set_business_direct_thread_blocked( UUID, UUID, BOOLEAN, TEXT )",
      "report_business_direct_thread( UUID, UUID, UUID, TEXT, TEXT )",
    ];

    for (const signature of rpcSignatures) {
      expect(normalizedMigration).toContain(
        `REVOKE ALL ON FUNCTION public.${signature} FROM PUBLIC, anon;`,
      );
      expect(normalizedMigration).toContain(
        `GRANT EXECUTE ON FUNCTION public.${signature} TO authenticated, service_role;`,
      );
    }
  });

  it("classifies every intentional Business Messaging SECURITY DEFINER endpoint individually", () => {
    const expectedCacheKeys = [
      "authenticated_security_definer_function_executable_public_create_business_direct_thread_p_profile_id uuid, p_business_id uuid",
      "authenticated_security_definer_function_executable_public_list_business_direct_messages_p_profile_id uuid, p_thread_id uuid, p_limit integer, p_cursor_created_at timestamp with time zone, p_cursor_id uuid",
      "authenticated_security_definer_function_executable_public_list_business_direct_thread_previews_p_profile_id uuid, p_limit integer, p_cursor_last_message_at timestamp with time zone, p_cursor_id uuid, p_search text",
      "authenticated_security_definer_function_executable_public_mark_business_direct_thread_read_p_profile_id uuid, p_thread_id uuid",
      "authenticated_security_definer_function_executable_public_report_business_direct_thread_p_profile_id uuid, p_thread_id uuid, p_message_id uuid, p_reason text, p_description text",
      "authenticated_security_definer_function_executable_public_send_business_direct_message_p_profile_id uuid, p_thread_id uuid, p_body text",
      "authenticated_security_definer_function_executable_public_set_business_direct_thread_blocked_p_profile_id uuid, p_thread_id uuid, p_blocked boolean, p_reason text",
    ];

    for (const cacheKey of expectedCacheKeys) {
      const residual = advisorResidualRegister.residuals.find(
        (entry) => entry.cacheKey === cacheKey,
      );

      expect(residual).toMatchObject({
        cacheKey,
        callerClass: "authenticated_user_endpoint",
        exceptionId: "EXC-2026-07-15-POSTGREST-SECURITY-DEFINER-COMMANDS",
      });
    }
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
      'messaging: {\n    status: "active",\n    dependsOnCapabilities: ["auth", "profiles"],\n  }',
    );

    expect(providerRegistry).toContain("businessMessagingProvider");
    expect(providerRegistry).not.toContain("@/app/");
    expect(providerScope).toContain('isPlatformCapabilityEnabled("messaging")');
    expect(providerScope).toContain('isProductModuleEnabled(productModule)');
    expect(providerScope).toContain('getMessagingProvider(providerId) !== null');
    expect(inboxWrapper).toContain("getActiveMessagingProviderIds()");
    expect(provider).toContain('providerId: "business"');
    expect(inbox).toContain("providerIds");
    expect(messagingRoutes).toContain('inbox: () => "/mensagens"');
    expect(messagingRoutes).toContain(
      'threadPattern: () => "/mensagens/:providerId/:threadId"',
    );
    expect(inbox).toContain("messagingRoutes.thread(");
    expect(inbox).toContain("messagingRoutes.inbox()");
    expect(appRoutes).toContain("messagingRoutes.inbox()");
    expect(appRoutes).toContain("messagingRoutes.threadPattern()");
    expect(inbox).not.toContain("/mensagens/${thread.providerId}/${thread.threadId}");
  });

  it("exposes a real internal message CTA from Business using business_data identity", () => {
    expect(cta).toContain('label="Mensagem"');
    expect(companyPage).toContain("openBusinessDirectConversation");
    expect(companyPage).toContain("institutionalBusinessDataId");
    expect(companyPage).toContain("buildLoginPath(returnTo)");
    expect(companyPage).toContain("navigate(threadPath)");
    expect(companyPage).not.toContain("/mensagens/business/");
    expect(businessEntry).toContain(
      "businessDirectMessagingService.createOrGetThread",
    );
    expect(businessEntry).toContain(
      'messagingRoutes.thread("business", threadId)',
    );
    expect(businessEntry).not.toContain("/mensagens/business/");
  });
});
