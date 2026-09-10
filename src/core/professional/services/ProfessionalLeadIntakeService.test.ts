import { beforeEach, describe, expect, it, vi } from "vitest";

const { invoke } = vi.hoisted(() => ({
  invoke: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    functions: { invoke },
  },
}));

import {
  ProfessionalLeadIntakeService,
  type CreateProfessionalLeadSubmission,
} from "./ProfessionalLeadIntakeService";

const submission: CreateProfessionalLeadSubmission = {
  professionalId: "11111111-1111-4111-8111-111111111111",
  requesterName: "Pessoa Teste",
  requesterPhone: "+55 71 99999-9999",
  requesterEmail: "pessoa@example.com",
  serviceNeeded: "Instalação elétrica",
  description: "Preciso instalar novos pontos elétricos no apartamento.",
  preferredDate: "2026-09-20",
  preferredTimeWindow: "manhã",
  neighborhood: "Pituba",
  locationId: "22222222-2222-4222-8222-222222222222",
  sourceChannel: "public_profile",
  honeypot: "",
  turnstileToken: "turnstile-token",
};

describe("ProfessionalLeadIntakeService", () => {
  beforeEach(() => {
    invoke.mockReset();
  });

  it("returns the authoritative lead id for a newly created request", async () => {
    invoke.mockResolvedValue({
      data: {
        status: "created",
        lead: { id: "33333333-3333-4333-8333-333333333333" },
      },
      error: null,
    });

    const result = await ProfessionalLeadIntakeService.createLead(submission);

    expect(invoke).toHaveBeenCalledWith(
      "create-professional-lead",
      expect.objectContaining({
        body: expect.objectContaining({
          professionalId: submission.professionalId,
          sourceChannel: "public_profile",
          honeypot: "",
          turnstileToken: "turnstile-token",
        }),
      }),
    );
    expect(result).toEqual({
      success: true,
      data: { id: "33333333-3333-4333-8333-333333333333" },
      deduplicated: false,
    });
  });

  it("preserves broker deduplication as a successful idempotent result", async () => {
    invoke.mockResolvedValue({
      data: {
        status: "already_submitted",
        lead: { id: "44444444-4444-4444-8444-444444444444" },
      },
      error: null,
    });

    await expect(
      ProfessionalLeadIntakeService.createLead(submission),
    ).resolves.toEqual({
      success: true,
      data: { id: "44444444-4444-4444-8444-444444444444" },
      deduplicated: true,
    });
  });

  it.each([
    [
      "turnstile_failed",
      "A verificação anti-spam expirou ou foi rejeitada. Confirme novamente.",
    ],
    ["invalid_payload", "Revise os dados do pedido antes de enviar novamente."],
    [
      "professional_unavailable",
      "Este profissional não está recebendo novos pedidos no momento.",
    ],
    [
      "verification_unavailable",
      "A verificação anti-spam está temporariamente indisponível. Tente novamente em instantes.",
    ],
    [
      "configuration_unavailable",
      "O envio de pedidos está temporariamente indisponível. Tente novamente mais tarde.",
    ],
    [
      "database_failed",
      "Não foi possível registrar o pedido agora. Tente novamente em instantes.",
    ],
  ] as const)("maps broker failure %s without weakening the boundary", async (status, message) => {
    invoke.mockResolvedValue({ data: { status }, error: null });

    await expect(
      ProfessionalLeadIntakeService.createLead(submission),
    ).resolves.toEqual({ success: false, error: message });
  });

  it("fails closed when the Edge invocation itself fails", async () => {
    invoke.mockResolvedValue({
      data: null,
      error: { message: "network failure" },
    });

    await expect(
      ProfessionalLeadIntakeService.createLead(submission),
    ).resolves.toEqual({
      success: false,
      error: "Não foi possível registrar o pedido agora. Tente novamente em instantes.",
    });
  });

  it("rejects malformed success payloads without fabricating a lead id", async () => {
    invoke.mockResolvedValue({
      data: { status: "created", lead: {} },
      error: null,
    });

    await expect(
      ProfessionalLeadIntakeService.createLead(submission),
    ).resolves.toEqual({
      success: false,
      error: "O pedido foi processado sem um identificador válido.",
    });
  });
});
