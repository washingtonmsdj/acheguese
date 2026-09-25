import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const pathOf = (path: string) => resolve(root, path);
const read = (path: string) => readFileSync(pathOf(path), "utf8");

describe("MVP Neighborhood stream legacy retirement", () => {
  it("keeps the callerless mixed-domain stream model retired", () => {
    expect(
      existsSync(
        pathOf("src/core/landing/services/NeighborhoodStreamModelService.ts"),
      ),
    ).toBe(false);

    expect(
      existsSync(pathOf("src/core/landing/services/index.ts")),
    ).toBe(false);
  });

  it("removes contracts that existed only for the retired stream", () => {
    const types = read("src/core/landing/types.ts");

    for (const retired of [
      "NeighborhoodCommunityTabId",
      "NeighborhoodCommunityTab",
      "NeighborhoodStreamTone",
      "NeighborhoodStreamItem",
      "NeighborhoodStreamGroups",
      "NeighborhoodStreamMoreConfig",
    ]) {
      expect(types, retired).not.toContain(retired);
    }

    expect(types).not.toContain("LucideIcon");
  });

  it("removes Neighborhood-only presentation helpers without touching active landing helpers", () => {
    const presentation = read("src/core/landing/utils/landingPresentation.ts");

    expect(presentation).not.toContain("getBusinessPublicUrl");
    expect(presentation).not.toContain("getTextPreview");
    expect(presentation).not.toContain("formatRelativeTime");
    expect(presentation).not.toContain("@/core/posts/utils/publicPostContent");
    expect(presentation).not.toContain(
      "@/core/business/services/BusinessUrlService",
    );

    expect(presentation).toContain("export function withQueryParams");
    expect(presentation).toContain("export function formatCategory");
    expect(presentation).toContain("export function formatPrice");
    expect(presentation).toContain("export function getHomeDiscoveryDocumentHref");
  });
});
