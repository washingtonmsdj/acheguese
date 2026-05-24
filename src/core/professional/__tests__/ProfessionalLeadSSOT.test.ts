import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("professional lead SSOT", () => {
  it("creates a canonical lead schema with RLS and event history", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260506100000_create_professional_leads.sql",
    );

    expect(migration).toContain("CREATE TYPE professional_lead_status");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS professional_leads");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS professional_lead_events");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS professional_lead_messages");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS professional_lead_quotes");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS professional_service_engagements");
    expect(migration).toContain("ALTER TABLE professional_leads ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("ALTER TABLE professional_lead_messages ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("ALTER TABLE professional_lead_quotes ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain(
      "ALTER TABLE professional_service_engagements ENABLE ROW LEVEL SECURITY",
    );
    expect(migration).toContain("professional_leads_public_insert");
    expect(migration).toContain("professional_leads_owner_select");
    expect(migration).toContain("professional_lead_events_participant_select");
    expect(migration).toContain("professional_lead_messages_participant_insert");
    expect(migration).toContain("professional_lead_quotes_professional_insert");
    expect(migration).toContain("professional_lead_quotes_requester_response_update");
    expect(migration).toContain("professional_lead_quotes_professional_cancel_update");
    expect(migration).toContain("guard_professional_lead_quote_update");
    expect(migration).toContain("professional lead quote immutable fields cannot be changed");
    expect(migration).toContain("create_professional_service_engagement_from_quote");
    expect(migration).toContain("professional_service_engagements_participant_select");
    expect(migration).toContain("professional_service_engagements_professional_update");
    expect(migration).toContain("professional_leads_contact_required");
    expect(migration).toContain("create_professional_lead_created_event");
  });

  it("keeps professional lead persistence inside the core service", () => {
    const service = readProjectFile(
      "src/core/professional/services/ProfessionalLeadService.ts",
    );
    const publicPage = readProjectFile(
      "src/modules/professionals/pages/ProfissionalPublicPage.tsx",
    );
    const actionButtons = readProjectFile(
      "src/modules/professionals/services/components/ProfessionalActionButtons.tsx",
    );
    const trackingPage = readProjectFile(
      "src/modules/professionals/pages/ProfessionalLeadTrackingPage.tsx",
    );

    expect(service).toContain('.from("professional_leads")');
    expect(service).toContain('.from("professional_lead_events")');
    expect(service).toContain('.from("professional_lead_messages")');
    expect(service).toContain('.from("professional_lead_quotes")');
    expect(service).toContain('.from("professional_service_engagements")');
    expect(service).toContain("getLeadDetails");
    expect(service).toContain("sendMessage");
    expect(service).toContain("createQuote");
    expect(service).toContain("updateQuoteStatus");
    expect(service).toContain("getEngagementByLead");
    expect(service).toContain("updateEngagementStatus");
    expect(service).toContain("submitEngagementReview");
    expect(service).toContain("ReviewsService.upsertReview");
    expect(service).toContain("Avaliacao liberada apenas apos conclusao do atendimento");
    expect(service).toContain("NotificationService.createNotification");
    expect(service).toContain('action_url: "/central/profissional"');
    expect(publicPage).toContain("ProfessionalLeadRequestDialog");
    expect(publicPage).toContain("Solicitar orcamento");
    expect(actionButtons).toContain("ProfessionalLeadRequestDialog");
    expect(actionButtons).toContain('sourceChannel="service_profile"');
    expect(trackingPage).toContain("ProfessionalLeadService.getLeadDetails");
    expect(trackingPage).toContain("ProfessionalLeadService.listMessages");
    expect(trackingPage).toContain("ProfessionalLeadService.listQuotes");
    expect(trackingPage).toContain("ProfessionalLeadService.sendMessage");
    expect(trackingPage).toContain("ProfessionalLeadService.updateQuoteStatus");
    expect(trackingPage).toContain("ProfessionalLeadService.getEngagementByLead");
    expect(trackingPage).toContain("ProfessionalLeadService.submitEngagementReview");
    expect(trackingPage).toContain("Atendimento contratado");
    expect(trackingPage).toContain("Avaliar atendimento concluido");
    expect(publicPage).not.toContain('.from("professional_leads")');
    expect(actionButtons).not.toContain('.from("professional_leads")');
    expect(trackingPage).not.toContain('.from("professional_leads")');
  });

  it("shows received leads in the professional central without direct table access", () => {
    const centralPage = readProjectFile(
      "src/modules/central/pages/CentralProfissionalPage.tsx",
    );
    const centralSections = readProjectFile(
      "src/modules/central/pages/CentralProfissionalPageSections.tsx",
    );
    const centralRuntime = `${centralPage}\n${centralSections}`;

    expect(centralPage).toContain("ProfessionalLeadService.listLeadsForProfessional");
    expect(centralPage).toContain("ProfessionalLeadService.updateLeadStatus");
    expect(centralPage).toContain("ProfessionalLeadService.sendMessage");
    expect(centralPage).toContain("ProfessionalLeadService.createQuote");
    expect(centralPage).toContain("ProfessionalLeadService.listEngagementsForProfessional");
    expect(centralPage).toContain("ProfessionalLeadService.updateEngagementStatus");
    expect(centralRuntime).toContain("Pedidos de orcamento");
    expect(centralRuntime).toContain("Atendimentos contratados");
    expect(centralRuntime).toContain("Marcar contatado");
    expect(centralRuntime).toContain("Enviar resposta");
    expect(centralRuntime).toContain("Enviar proposta");
    expect(centralRuntime).toContain("Leads capturados pelo perfil publico");
    expect(centralPage).not.toContain('.from("professional_leads")');
    expect(centralPage).not.toContain('.from("professional_lead_messages")');
    expect(centralPage).not.toContain('.from("professional_lead_quotes")');
    expect(centralPage).not.toContain('.from("professional_service_engagements")');
    expect(centralPage).not.toContain(".from('professional_leads')");
  });
});
