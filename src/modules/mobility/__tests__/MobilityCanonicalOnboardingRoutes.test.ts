import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("mobility canonical onboarding routes", () => {
  it("does not expose legacy /create-driver route in app runtime", () => {
    const routesSource = readProjectFile(
      "src/app/routes/sections/AppLayoutRoutes.tsx",
    );
    const contextSource = readProjectFile(
      "src/core/profiles/contexts/multi-profile-runtime-context.tsx",
    );

    expect(routesSource).not.toContain("/create-driver");
    expect(contextSource).not.toContain("'/create-driver'");
  });

  it("keeps central mobility CTAs on canonical central cadastro routes", () => {
    const motoristaSource = readProjectFile("src/modules/mobility/pages/MotoristaPage.tsx");
    const motoboySource = readProjectFile("src/modules/mobility/pages/MotoboyPage.tsx");
    const centralHubSource = readProjectFile("src/modules/central/pages/CentralHubPage.tsx");
    const centralMotoboySource = readProjectFile("src/modules/central/pages/CentralMotoboyPage.tsx");
    const centralMotoristaSource = readProjectFile("src/modules/central/pages/CentralMotoristaPage.tsx");

    expect(motoristaSource).toContain("mobilityUrls.motorista.cadastro");
    expect(motoboySource).toContain("mobilityUrls.motoboy.cadastro");
    expect(centralHubSource).toContain("centralRoutes.motorista.cadastro");
    expect(centralHubSource).toContain("centralRoutes.motoboy.cadastro");
    expect(centralMotoboySource).toContain("appUrls.profile.mobilidade.motoboy.cadastro");
    expect(centralMotoristaSource).toContain("appUrls.profile.mobilidade.motorista.cadastro");
  });

  it("keeps ride transitions free from client-owned post-transition side effects", () => {
    const rideOperationalSource = readProjectFile(
      "src/core/mobility/core/RideOperationalService.ts",
    );

    expect(rideOperationalSource).not.toContain("handleRidePostTransition");
    expect(rideOperationalSource).not.toContain("NotificationService.createNotification");
    expect(rideOperationalSource).not.toContain("DriverAvailabilityService.releaseBusy");
  });
});
