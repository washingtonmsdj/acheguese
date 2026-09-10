import { beforeEach, describe, expect, it, vi } from "vitest";

const { invoke, readHttpErrorBody } = vi.hoisted(() => ({
  invoke: vi.fn(),
  readHttpErrorBody: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    functions: { invoke },
  },
  readSupabaseFunctionHttpErrorBody: readHttpErrorBody,
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
    readHttpErrorBody.mockReset();
    readHttpErrorBody.mockResolvedValue(null);
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

  it("maps the 2xx Turnstile rejection returned by the broker", async () => {
    invoke.mockResolvedValue({
      data: { status: "turnstile_failed" },
      error: null,
    });

    await expect(
      ProfessionalLeadIntakeService.createLead(submission),
    ).resolves.toEqual({
      success: false,
      error: "A verificação anti-spam expirou ou foi rejeitada. Confirme novamente.",
    });
  });

  it.each([
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
      "lead_creation_failed",
      "Não foi possível registrar o pedido agora. Tente novamente em instantes.",
    ],
    [
      "invalid_or_expired_token",
      "Sua sessão expirou ou não é mais válida. Entre novamente e reenvie o pedido.",
    ],
    [
      "requester_identity_unavailable",
      "Não foi possível validar seu perfil agora. Tente novamente em instantes.",
    ],
    ["origin_not_allowed", "Não foi possível validar a origem deste pedido."],
    [
      "Rate limit exceeded",
      "Muitas tentativas foram feitas em pouco tempo. Aguarde um instante antes de tentar novamente.",
    ],
  ] as const)("maps Edge HTTP failure %s from the response body", async (code, message) => {
    const httpError = { message: "Edge Function returned a non-2xx status code" };
    invoke.mockResolvedValue({ data: null, error: httpError });
    readHttpErrorBody.mockResolvedValue({ error: code });

    await expect(
      ProfessionalLeadIntakeService.createLead(submission),
    ).resolves.toEqual({ success: false, error: message });
    expect(readHttpErrorBody).toHaveBeenCalledWith(httpError);
  });

  it("fails closed for transport errors without an HTTP response body", async () => {
    const transportError = { message: "network failure" };
    invoke.mockResolvedValue({ data: null, error: transportError });
    readHttpErrorBody.mockResolvedValue(null);

    await expect(
      ProfessionalLeadIntakeService.createLead(submission),
    ).resolves.toEqual({
      success: false,
      error: "Não foi possível registrar o pedido agora. Tente novamente em instantes.",
    });
    expect(readHttpErrorBody).toHaveBeenCalledWith(transportError);
  });

  it("fails closed for unknown HTTP error payloads", async () => {
    invoke.mockResolvedValue({
      data: null,
      error: { message: "Edge Function returned a non-2xx status code" },
    });
    readHttpErrorBody.mockResolvedValue({ error: "unexpected_server_code" });

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
