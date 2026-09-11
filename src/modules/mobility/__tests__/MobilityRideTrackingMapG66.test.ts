import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const mapSource = readProjectFile(
  "src/core/mobility/components/RideTrackingMap.tsx",
);

describe("G66 ride tracking map synchronization and privacy", () => {
  it("waits for MapLibre load before requesting and installing the real route", () => {
    expect(mapSource).toContain("const [mapReady, setMapReady] = useState(false)");
    expect(mapSource).toContain("!mapReady");
    expect(mapSource).toContain("setMapReady(true)");
    expect(mapSource).toContain(
      "[mapReady, originLat, originLon, destinationLat, destinationLon]",
    );
    expect(mapSource).not.toContain("const [routeLoaded, setRouteLoaded]");
  });

  it("keeps the tracking path alive if routing fails", () => {
    expect(mapSource).toContain(
      "O tracking do motorista continua funcional mesmo se o roteamento falhar.",
    );
    expect(mapSource).toContain("if (cancelled || !mapRef.current) return");
  });

  it("accepts zero-valued coordinates instead of treating them as missing", () => {
    expect(mapSource).toContain("originLat == null");
    expect(mapSource).toContain("originLon == null");
    expect(mapSource).toContain("destinationLat == null");
    expect(mapSource).toContain("destinationLon == null");
    expect(mapSource).not.toContain("!originLat || !originLon");
    expect(mapSource).not.toContain("if (originLat && originLon)");
  });

  it("does not render copyable raw precise coordinates in the passenger UI", () => {
    expect(mapSource).not.toContain("location.latitude.toFixed(6)");
    expect(mapSource).not.toContain("location.longitude.toFixed(6)");
    expect(mapSource).toContain("Posição atualizada");
  });
});
