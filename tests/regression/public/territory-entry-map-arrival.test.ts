import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

const wrapper = read("src/app/components/territory-vivo/TerritoryEntryMap.tsx");
const runtime = read(
  "src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx",
);
const arrival = read(
  "src/app/components/territory-vivo/TerritoryEntryMapArrival.tsx",
);

describe("territory entry premium arrival loading", () => {
  it("uses one arrival owner before and during the real map startup", () => {
    expect(wrapper).toContain("TerritoryEntryMapArrival");
    expect(wrapper).toContain("EntryMapArrivalSurface");
    expect(runtime).toContain("TerritoryEntryMapArrival");
    expect(runtime).toContain("!mapPresented && !mapUnavailable");
    expect(arrival).toContain("data-entry-arrival-loading");

    expect(
      fs.existsSync(
        path.join(
          ROOT,
          "src/app/components/territory-vivo/TerritoryEntryMapSkeleton.tsx",
        ),
      ),
    ).toBe(false);
  });

  it("uses truthful stages instead of fake timed progress", () => {
    expect(arrival).toContain('"community" | "map" | "boundary"');
    expect(arrival).toContain("data-entry-arrival-stage={stage}");
    expect(wrapper).toContain('stage={isLoading ? "community" : "map"}');
    expect(wrapper).toContain('stage="map"');
    expect(runtime).toContain('const arrivalStage = mapReady ? "boundary" : "map"');

    expect(arrival).not.toContain("setInterval");
    expect(arrival).not.toContain("ARRIVAL_CYCLE_MS");
    expect(arrival).not.toContain("ARRIVAL_SESSION_STARTED_AT");
  });

  it("communicates arrival and place without simulating map geometry", () => {
    expect(arrival).toContain("Globe2");
    expect(arrival).toContain("Sparkles");
    expect(arrival).toContain("Encontrando sua comunidade");
    expect(arrival).toContain("Preparando a casa para você se achegar");
    expect(arrival).toContain("Conectando você ao território");
    expect(arrival).toContain("Seu território está quase pronto");
    expect(arrival).toContain("Comunidade");
    expect(arrival).toContain("Mapa");
    expect(arrival).toContain("Limite oficial");

    expect(arrival).not.toContain("BLOCK_STYLE");
    expect(arrival).not.toContain("ROAD_STYLE");
    expect(arrival).not.toContain("fallback_boundary_rings");
  });

  it("uses a premium desktop composition and a compact phone composition", () => {
    expect(arrival).toContain("grid-cols-[3.25rem_minmax(0,1fr)]");
    expect(arrival).toContain("md:grid-cols-[5.5rem_minmax(0,1fr)]");
    expect(arrival).toContain("lg:grid-cols-[11rem_minmax(0,1fr)]");
    expect(arrival).toContain("lg:h-40 lg:w-40");
    expect(arrival).toContain("min-[360px]:block");
    expect(arrival).toContain("motion-safe:animate-spin");
    expect(arrival).toContain('animationDuration: "12s"');
    expect(arrival).toContain('animationDuration: "18s"');
    expect(arrival).toContain("motion-reduce:animate-none");

    expect(wrapper).toContain("min-h-[12rem]");
    expect(wrapper).toContain("md:min-h-[18rem]");
    expect(wrapper).toContain("lg:min-h-[24rem]");
    expect(runtime).toContain("min-h-[12rem]");
    expect(runtime).toContain("md:min-h-[18rem]");
    expect(runtime).toContain("lg:min-h-[24rem]");
  });

  it("shows completed, current and upcoming stages without regression", () => {
    expect(arrival).toContain("completed = index < activeStageIndex");
    expect(arrival).toContain("current = index === activeStageIndex");
    expect(arrival).toContain("<Check");
    expect(arrival).toContain("data-entry-arrival-progress");
    expect(arrival).toContain('completed ? "scale-x-100" : "scale-x-0"');
  });

  it("keeps loading bounded and only reveals the real map after boundary settling", () => {
    expect(runtime).toContain(
      "const mapPresented = mapReady && !isBoundaryLoading",
    );
    expect(runtime).toContain('aria-busy={!mapPresented}');
    expect(runtime).toContain('mapPresented ? "opacity-100" : "opacity-0"');
    expect(runtime).toContain("setMapUnavailable(true)");
    expect(runtime).toContain("8000");
  });
});
