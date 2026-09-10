import { beforeEach, describe, expect, it, vi } from "vitest";

const { invoke, resolveErrorMessage } = vi.hoisted(() => ({
  invoke: vi.fn(),
  resolveErrorMessage: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    functions: { invoke },
  },
  resolveSupabaseFunctionErrorMessage: resolveErrorMessage,
}));

import {
  PublicEducationLeadService,
  type PublicEducationLeadInput,
} from "./PublicEducationLeadService";

const input: PublicEducationLeadInput = {
  educationProfileId: "11111111-1111-4111-8111-111111111111",
  fullName: "Responsavel Teste",
  email: "responsavel@example.com",
  phone: "+55 71 99999-9999",
};

describe("PublicEducationLeadService", () => {
  beforeEach(() => {
    invoke.mockReset();
    resolveErrorMessage.mockReset();
    resolveErrorMessage.mockResolvedValue(null);
  });

  it("returns the authoritative lead id and creation flag", async () => {
    invoke.mockResolvedValue({
      data: { leadId: "22222222-2222-4222-8222-222222222222", created: true },
      error: null,
    });

    await expect(PublicEducationLeadService.create(input)).resolves.toEqual({
      id: "22222222-2222-4222-8222-222222222222",
      created: true,
    });
  });

  it("maps a structured public-institution rejection from a non-2xx Edge response", async () => {
    const httpError = { message: "Edge Function returned a non-2xx status code" };
    invoke.mockResolvedValue({ data: null, error: httpError });
    resolveErrorMessage.mockResolvedValue("public_institution_lead_intake_disabled");

    await expect(PublicEducationLeadService.create(input)).rejects.toThrow(
      "Esta instituicao usa somente os canais oficiais para matricula e atendimento.",
    );
    expect(resolveErrorMessage).toHaveBeenCalledWith(httpError);
  });

  it("maps rate-limit messages case-insensitively", async () => {
    invoke.mockResolvedValue({
      data: null,
      error: { message: "Edge Function returned a non-2xx status code" },
    });
    resolveErrorMessage.mockResolvedValue("Rate limit exceeded");

    await expect(PublicEducationLeadService.create(input)).rejects.toThrow(
      "Muitas solicitacoes foram enviadas. Tente novamente mais tarde.",
    );
  });

  it("maps validation failures returned in a successful HTTP payload", async () => {
    invoke.mockResolvedValue({
      data: { error: "invalid_email" },
      error: null,
    });

    await expect(PublicEducationLeadService.create(input)).rejects.toThrow(
      "Revise os dados informados e tente novamente.",
    );
  });

  it("fails closed for a malformed successful response", async () => {
    invoke.mockResolvedValue({ data: { created: true }, error: null });

    await expect(PublicEducationLeadService.create(input)).rejects.toThrow(
      "Nao foi possivel registrar seu interesse.",
    );
  });
});
