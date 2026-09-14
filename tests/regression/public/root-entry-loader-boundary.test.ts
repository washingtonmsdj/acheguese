import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

const GENERIC_APP_LOADING_COPY = "Preparando a casa para você se achegar...";

describe("public root loading boundary", () => {
  it("keeps the generic full-app loader distinct from the public-root skeleton", () => {
    const genericLoader = read("src/shared/components/loading/PageLoader.tsx");
    const arrival = read(
      "src/app/components/territory-vivo/TerritoryEntryMapArrival.tsx",
    );

    expect(genericLoader).toContain(GENERIC_APP_LOADING_COPY);
    expect(genericLoader).toContain("<Loader2");
    expect(genericLoader).toContain("recoveryAfterMs={8000}");

    expect(arrival).toContain("data-entry-skeleton");
    expect(arrival).toContain("data-entry-skeleton-grid");
    expect(arrival).toContain("data-entry-skeleton-card");
    expect(arrival).toContain("data-entry-skeleton-shimmer");
    expect(arrival).not.toContain(GENERIC_APP_LOADING_COPY);
    expect(arrival).not.toContain("Loader2");
  });

  it("keeps the generic full-app loader and its copy out of the lean root bootstrap", () => {
    const rootSources = [
      "src/app/components/AppRuntime.tsx",
      "src/app/routes/RootRouteEntry.tsx",
      "src/app/pages/TerritoryEntryPage.tsx",
      "src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx",
      "src/app/components/territory-vivo/TerritoryEntryMapArrival.tsx",
    ].map(read);

    for (const source of rootSources) {
      expect(source).not.toContain("FullScreenLoader");
      expect(source).not.toContain(GENERIC_APP_LOADING_COPY);
    }

    const runtime = rootSources[0];
    expect(runtime).toContain("shouldUseLeanPublicRoot");
    expect(runtime).toContain("<RootRouteEntry />");
  });
});
