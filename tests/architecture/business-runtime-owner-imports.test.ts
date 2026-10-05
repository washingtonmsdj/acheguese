import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("Business runtime owner imports", () => {
  it("keeps Search document mapping on the direct Business URL owner", () => {
    const source = read("src/core/search/services/SearchDocumentMapper.ts");

    expect(source).toContain(
      'from "@/core/business/services/BusinessUrlService"',
    );
    expect(source).not.toContain('from "@/core/business"');
  });

  it("keeps the Map adapter on the bounded Business map owner", () => {
    const source = read(
      "src/core/maps/services/MapBusinessLayerRuntimeService.ts",
    );

    expect(source).toContain(
      'from "@/core/business/services/BusinessMapQueryService"',
    );
    expect(source).not.toContain('from "@/core/business"');
  });

  it("keeps AI Business search on direct runtime owners", () => {
    const source = read("src/core/ai/actions/SearchBusinessesActionHandler.ts");

    expect(source).toContain(
      'from "@/core/business/services/BusinessService"',
    );
    expect(source).toContain(
      'from "@/core/business/services/BusinessUrlService"',
    );
    expect(source).toContain('from "@/core/business/types/Business"');
    expect(source).not.toContain('from "@/core/business"');
  });
});
