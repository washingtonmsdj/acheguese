import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const indexHtml = readFileSync("index.html", "utf8");
const launchDescription =
  "Descubra empresas locais, explore o mapa, veja o que está perto e busque no seu território. Achegue-se: seu lugar, mais perto.";

describe("root public SEO MVP scope", () => {
  it("keeps root metadata inside the active Business and discovery scope", () => {
    expect(indexHtml.split(launchDescription)).toHaveLength(4);
    expect(indexHtml).not.toContain(
      "Descubra negócios, serviços e histórias da sua comunidade.",
    );
  });
});
