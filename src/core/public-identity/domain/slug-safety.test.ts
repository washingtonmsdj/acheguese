import { describe, expect, it } from "vitest";
import { evaluateCommunicationChannelSlugSafety } from "./communicationChannelSlugSafety";
import { evaluateProfessionalSlugSafety } from "./professionalSlugSafety";

describe("slug safety guardrails", () => {
  it("accepts professional slug aligned with public name", () => {
    const result = evaluateProfessionalSlugSafety({
      professionalName: "Joao Eletricista Residencial",
      slug: "joao-eletricista",
    });

    expect(result.status).toBe("ok");
    expect(result.sharedTokens.length).toBeGreaterThan(0);
  });

  it("flags suspicious professional slug with no overlap", () => {
    const result = evaluateProfessionalSlugSafety({
      professionalName: "Joao Eletricista Residencial",
      slug: "farmacia-centro-salvador",
    });

    expect(result.status).toBe("review");
    expect(result.sharedTokens).toHaveLength(0);
  });

  it("accepts communication channel slug aligned with public name", () => {
    const result = evaluateCommunicationChannelSlugSafety({
      publicName: "Jornal Nordeste Amaralina",
      slug: "nordeste-amaralina",
    });

    expect(result.status).toBe("ok");
    expect(result.sharedTokens.length).toBeGreaterThan(0);
  });

  it("flags suspicious communication channel slug with no overlap", () => {
    const result = evaluateCommunicationChannelSlugSafety({
      publicName: "Portal Nordeste Amaralina",
      slug: "farmacia-centro-salvador",
    });

    expect(result.status).toBe("review");
    expect(result.sharedTokens).toHaveLength(0);
  });
});
