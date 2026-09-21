import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const servicesPage = readFileSync(
  "src/modules/professionals/services/pages/ServicosLandingPage.tsx",
  "utf8",
);
const topRatedHook = readFileSync(
  "src/modules/professionals/services/hooks/useTopRatedProfessionals.ts",
  "utf8",
);
const professionalQueries = readFileSync(
  "src/core/professional/services/professional.queries.ts",
  "utf8",
);

describe("public services truthfulness", () => {
  it("does not publish unsupported reach, guarantee or conversion claims", () => {
    for (const unsupported of [
      "milhares de moradores",
      "Garantia Comunitária",
      "Transparência total",
      "Sem intermediários, sem taxas",
      "Sem taxas, sem intermediários",
      "Mais clientes",
    ]) {
      expect(servicesPage).not.toContain(unsupported);
    }

    expect(servicesPage).toContain("Cobertura no território");
    expect(servicesPage).toContain("Avaliações da comunidade");
    expect(servicesPage).toContain("Avaliações quando houver");
    expect(servicesPage).toContain("Canais de contato");
  });

  it("keeps the top-rated section backed by the canonical rating order", () => {
    expect(servicesPage).toContain("Mais Bem Avaliados");
    expect(topRatedHook).toContain(
      "ProfessionalFacade.queries.getProfessionalsList",
    );
    expect(professionalQueries).toContain(
      '.order("rating", { ascending: false })',
    );
  });

  it("keeps verification copy conditional instead of promising it on signup", () => {
    expect(servicesPage).toContain("Profissionais verificados aparecem identificados");
    expect(servicesPage).toContain("professional.is_verified");
    expect(servicesPage).not.toContain("Perfil verificado</span>");
  });
});
