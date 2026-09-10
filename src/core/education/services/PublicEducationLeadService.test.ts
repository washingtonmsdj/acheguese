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

const successPayload = {
  leadId: "22222222-2222-4222-8222-222222222222",
  created: true,
  educationProfileId: input.educationProfileId,
  businessDataId: "33333333-3333-4333-8333-333333333333",
};

describe("PublicEducationLeadService", () => {
  beforeEach(() => {
    invoke.mockReset();
    resolveErrorMessage.mockReset();
    resolveErrorMessage.mockResolvedValue(null);
  });

  it("returns the authoritative lead id and creation flag", async () => {
    invoke.mockResolvedValue({ data: successPayload, error: null });

    await expect(PublicEducationLeadService.create(input)).resolves.toEqual({
      id: successPayload.leadId,
      created: true,
    });
  });

  it("preserves an authoritative deduplicated response", async () => {
    invoke.mockResolvedValue({
      data: { ...successPayload, created: false },
      error: null,
    });

    await expect(PublicEducationLeadService.create(input)).resolves.toEqual({
      id: successPayload.leadId,
      created: false,
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

  it("fails closed when created is missing instead of treating it as deduplicated", async () => {
    const { created: _created, ...withoutCreated } = successPayload;
    invoke.mockResolvedValue({ data: withoutCreated, error: null });

    await expect(PublicEducationLeadService.create(input)).rejects.toThrow(
      "Nao foi possivel registrar seu interesse.",
    );
  });

  it("fails closed when the broker response belongs to another education profile", async () => {
    invoke.mockResolvedValue({
      data: {
        ...successPayload,
        educationProfileId: "44444444-4444-4444-8444-444444444444",
      },
      error: null,
    });

    await expect(PublicEducationLeadService.create(input)).rejects.toThrow(
      "Nao foi possivel registrar seu interesse.",
    );
  });

  it("fails closed for malformed identifiers", async () => {
    invoke.mockResolvedValue({
      data: { ...successPayload, leadId: "not-a-uuid" },
      error: null,
    });

    await expect(PublicEducationLeadService.create(input)).rejects.toThrow(
      "Nao foi possivel registrar seu interesse.",
    );
  });
});
