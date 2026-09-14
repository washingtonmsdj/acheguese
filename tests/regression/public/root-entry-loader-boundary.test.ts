import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

const RETIRED_APP_LOADING_COPY = "Preparando a casa para você se achegar...";

describe("public root loading boundary", () => {
  it("keeps the retired full-app interstitial out while preserving the public-root skeleton", () => {
    const genericLoader = read("src/shared/components/loading/PageLoader.tsx");
    const arrival = read(
      "src/app/components/territory-vivo/TerritoryEntryMapArrival.tsx",
    );

    expect(genericLoader).not.toContain("FullScreenLoader");
    expect(genericLoader).not.toContain(RETIRED_APP_LOADING_COPY);

    expect(arrival).toContain("data-entry-skeleton");
    expect(arrival).toContain("data-entry-skeleton-grid");
    expect(arrival).toContain("data-entry-skeleton-card");
    expect(arrival).toContain("data-entry-skeleton-shimmer");
    expect(arrival).not.toContain(RETIRED_APP_LOADING_COPY);
    expect(arrival).not.toContain("Loader2");
  });

  it("keeps the retired interstitial and its copy out of the lean root bootstrap", () => {
    const rootSources = [
      "src/app/components/AppRuntime.tsx",
      "src/app/routes/RootRouteEntry.tsx",
      "src/app/pages/TerritoryEntryPage.tsx",
      "src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx",
      "src/app/components/territory-vivo/TerritoryEntryMapArrival.tsx",
    ].map(read);

    for (const source of rootSources) {
      expect(source).not.toContain("FullScreenLoader");
      expect(source).not.toContain(RETIRED_APP_LOADING_COPY);
    }

    const runtime = rootSources[0];
    expect(runtime).toContain("shouldUseLeanPublicRoot");
    expect(runtime).toContain("<RootRouteEntry />");
  });
});
