import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G123 passenger realtime identity boundary", () => {
  const passengerHook = readProjectFile(
    "src/modules/mobility/hooks/useMobilidade.ts",
  );
  const deliveryHook = readProjectFile(
    "src/modules/mobility/hooks/useDelivery.ts",
  );
  const passengerPage = readProjectFile(
    "src/modules/mobility/pages/PassageiroPage.tsx",
  );
  const searchPage = readProjectFile(
    "src/modules/mobility/pages/BuscandoMotoristaPage.tsx",
  );

  it("scopes passenger realtime to the active ride instead of an auth user id", () => {
    expect(passengerHook).toContain("rideId: activeRide?.id");
    expect(passengerHook).toContain(
      "enabled: realtimeEnabled && Boolean(activeRide)",
    );
    expect(passengerHook).toContain("const { realtimeEnabled = false } = options");
  });

  it("removes dead driver mutations from the passenger hook", () => {
    expect(passengerHook).not.toContain("RideDispatchService");
    expect(passengerHook).not.toContain("const acceptRide = useCallback");
    expect(passengerHook).not.toContain("const completeRide = useCallback");
    expect(passengerHook).not.toContain("RideOperationalService.completeRide(");
  });

  it("scopes delivery realtime to the concrete active delivery", () => {
    expect(deliveryHook).toContain("rideId: activeDelivery?.id");
    expect(deliveryHook).toContain("enabled: Boolean(activeDelivery)");
    expect(deliveryHook).not.toContain("userId: user?.id");
  });

  it("opts only the passenger dashboard into the generic passenger realtime hook", () => {
    expect(passengerPage).toContain(
      "useMobilidade({ realtimeEnabled: true })",
    );
    expect(searchPage).toContain("useMobilidade()");
    expect(searchPage).not.toContain("realtimeEnabled: true");
  });
});
