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
  registerCommunityInterest,
  type RegisterCommunityInterestInput,
} from "./CommunityInterestRegistrationService";

const input: RegisterCommunityInterestInput = {
  communityId: null,
  communitySlug: "nordeste-de-amaralina",
  territoryPath: "/br/ba/salvador/nordeste-de-amaralina",
  fullName: "Pessoa Teste",
  email: "pessoa@example.com",
  phone: "+55 71 99999-9999",
  role: "morador",
  message: null,
  wantsUpdates: true,
  source: "territory_landing",
  honeypot: "",
  turnstileToken: "token",
};

describe("registerCommunityInterest", () => {
  beforeEach(() => {
    invoke.mockReset();
    resolveErrorMessage.mockReset();
    resolveErrorMessage.mockResolvedValue(null);
  });

  it.each(["registered", "already_registered", "turnstile_failed"] as const)(
    "accepts authoritative status %s",
    async (status) => {
      invoke.mockResolvedValue({ data: { status }, error: null });
      await expect(registerCommunityInterest(input)).resolves.toEqual({ status });
    },
  );

  it("maps a structured invalid payload response", async () => {
    const httpError = { message: "Edge Function returned a non-2xx status code" };
    invoke.mockResolvedValue({ data: null, error: httpError });
    resolveErrorMessage.mockResolvedValue("invalid_payload");

    await expect(registerCommunityInterest(input)).rejects.toThrow(
      "Revise os dados informados antes de enviar novamente.",
    );
    expect(resolveErrorMessage).toHaveBeenCalledWith(httpError);
  });

  it("maps Turnstile infrastructure unavailability without exposing provider details", async () => {
    invoke.mockResolvedValue({
      data: null,
      error: { message: "Edge Function returned a non-2xx status code" },
    });
    resolveErrorMessage.mockResolvedValue("verification_unavailable");

    await expect(registerCommunityInterest(input)).rejects.toThrow(
      "A verificação anti-spam está temporariamente indisponível.",
    );
  });

  it("fails closed for malformed success payloads", async () => {
    invoke.mockResolvedValue({ data: {}, error: null });

    await expect(registerCommunityInterest(input)).rejects.toThrow(
      "Resposta inválida ao registrar interesse.",
    );
  });
});
