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
  it("uses the arrival owner before and during the real map startup", () => {
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

  it("communicates a premium territorial arrival instead of fake map geometry", () => {
    expect(arrival).toContain("Globe2");
    expect(arrival).toContain("Sparkles");
    expect(arrival).toContain("Procurando sua comunidade");
    expect(arrival).toContain("Preparando a casa para você se achegar");
    expect(arrival).toContain("Buscando o mapa oficial do Complexo");
    expect(arrival).toContain("Comunidade");
    expect(arrival).toContain("Mapa");
    expect(arrival).toContain("Limite oficial");

    expect(arrival).not.toContain("BLOCK_STYLE");
    expect(arrival).not.toContain("ROAD_STYLE");
    expect(arrival).not.toContain("fallback_boundary_rings");
  });

  it("rotates copy gently and respects reduced-motion preferences", () => {
    expect(arrival).toContain("ARRIVAL_MESSAGES");
    expect(arrival).toContain("window.setInterval");
    expect(arrival).toContain("2100");
    expect(arrival).toContain("prefers-reduced-motion: reduce");
    expect(arrival).toContain("motion-reduce:animate-none");
    expect(arrival).toContain("motion-reduce:transition-none");
  });

  it("stays compact on phones and expands only when the map area grows", () => {
    expect(arrival).toContain("h-12 w-12");
    expect(arrival).toContain("md:h-[4.5rem]");
    expect(arrival).toContain("lg:h-24");
    expect(arrival).toContain("hidden min-[360px]:inline");
    expect(arrival).toContain("hidden items-center gap-2");
    expect(arrival).toContain("md:flex");

    expect(wrapper).toContain("min-h-[12rem]");
    expect(wrapper).toContain("md:min-h-[18rem]");
    expect(wrapper).toContain("lg:min-h-[24rem]");
    expect(runtime).toContain("min-h-[12rem]");
    expect(runtime).toContain("md:min-h-[18rem]");
    expect(runtime).toContain("lg:min-h-[24rem]");
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
