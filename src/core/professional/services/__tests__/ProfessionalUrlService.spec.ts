import { describe, expect, it } from "vitest";

import { ProfessionalUrlService } from "../ProfessionalUrlService";

describe("ProfessionalUrlService", () => {
  it("builds canonical public URLs under the services module", () => {
    expect(
      ProfessionalUrlService.getCanonicalUrl({
        id: "profile-1",
        slug: "joao-eletricista",
        state: "BA",
        city: "Salvador",
      }),
    ).toBe("/servicos/ba/salvador/profissional/joao-eletricista");
  });

  it("builds canonical URLs from professional targets", () => {
    expect(
      ProfessionalUrlService.getCanonicalUrlFromTarget({
        id: "professional-data-1",
        profile_id: "profile-1",
        slug: "maria-arquiteta",
        geographic_path: "/br/ba/salvador/pituba",
      }),
    ).toBe("/servicos/ba/salvador/profissional/maria-arquiteta");
  });

  it("returns null when target lacks public identity or territory", () => {
    expect(
      ProfessionalUrlService.getCanonicalUrlFromTarget({
        id: "professional-data-1",
        slug: null,
        geographic_path: "/br/ba/salvador",
      }),
    ).toBeNull();

    expect(
      ProfessionalUrlService.getCanonicalUrlFromTarget({
        id: "professional-data-1",
        slug: "sem-territorio",
      }),
    ).toBeNull();
  });
});
