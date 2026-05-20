import { describe, expect, it } from "vitest";
import { requestCommunicationChannelSchema } from "./requestChannelSchema";

describe("requestCommunicationChannelSchema", () => {
  it("sanitizes and validates a valid payload", () => {
    const result = requestCommunicationChannelSchema.safeParse({
      public_name: " Portal Nordeste Amaralina ",
      channel_kind: "portal",
      description: "Cobertura local diaria com foco em servicos, oportunidades e alertas do territorio.",
      website_url: "portalnordeste.com.br",
      contact_email: "CONTATO@PORTALNORDESTE.COM.BR",
      contact_phone: "(71) 99999-0000",
      requested_location_id: "7d885c8f-4c39-477e-9024-f6d9f300b212",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.public_name).toBe("Portal Nordeste Amaralina");
    expect(result.data.website_url).toBe("https://portalnordeste.com.br");
    expect(result.data.contact_email).toBe("contato@portalnordeste.com.br");
  });

  it("rejects invalid required fields", () => {
    const result = requestCommunicationChannelSchema.safeParse({
      public_name: "ab",
      channel_kind: "portal",
      description: "curta",
      contact_email: "invalido",
      requested_location_id: "invalid-uuid",
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    const messages = result.error.issues.map((issue) => issue.message);
    expect(messages).toContain("Nome publico deve ter no minimo 3 caracteres");
    expect(messages).toContain("Descricao deve ter no minimo 20 caracteres");
    expect(messages).toContain("Email invalido");
    expect(messages).toContain("Territorio invalido");
  });
});
