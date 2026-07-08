import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("professional notification broker security", () => {
  it("routes authenticated lead message and quote notifications through a domain broker", () => {
    const edgeFunction = readProjectFile("supabase/functions/professional-notifications-rpc/index.ts");
    const config = readProjectFile("supabase/config.toml");
    const broker = readProjectFile(
      "src/core/notifications/services/ProfessionalNotificationBrokerService.ts",
    );
    const leadService = readProjectFile("src/core/professional/services/ProfessionalLeadService.ts");

    expect(config).toContain("[functions.professional-notifications-rpc]");
    expect(config).toMatch(/\[functions\.professional-notifications-rpc\]\s+verify_jwt = true/);

    expect(edgeFunction).toContain("function requireUser(");
    expect(edgeFunction).toContain('getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("create_notification"');
    expect(edgeFunction).toContain("message.sender_user_id !== userId");
    expect(edgeFunction).toContain("quote.professional_user_id !== userId");
    expect(edgeFunction).toContain("ownerUserId !== userId");
    expect(edgeFunction).toContain('.from("professional_lead_messages")');
    expect(edgeFunction).toContain('.from("professional_lead_quotes")');
    expect(edgeFunction).toContain('.from("professional_leads")');
    expect(edgeFunction).not.toMatch(/p_user_id:\s*params\./);
    expect(edgeFunction).not.toMatch(/user_id:\s*params\./);

    expect(broker).toContain('const FUNCTION_NAME = "professional-notifications-rpc"');
    expect(broker).not.toContain("user_id");

    expect(leadService).toContain("ProfessionalNotificationBrokerService.notifyLeadMessage");
    expect(leadService).toContain("ProfessionalNotificationBrokerService.notifyLeadQuote");
    expect(leadService).not.toContain("NotificationService.createNotification");
  });

  it("keeps anonymous professional lead creation notification inside a non-public trigger", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260707195524_route_professional_notifications_through_trusted_brokers.sql",
    );

    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.create_professional_lead_created_event()");
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = public, pg_temp");
    expect(migration).toContain("JOIN public.profiles p ON p.id = pd.profile_id");
    expect(migration).toContain("INSERT INTO public.notifications");
    expect(migration).toContain("OR v_owner_user_id IS NOT DISTINCT FROM NEW.requester_user_id");
    expect(migration).toMatch(/REVOKE ALL ON FUNCTION public\.create_professional_lead_created_event\(\)\s+FROM PUBLIC, anon, authenticated/);
  });
});
