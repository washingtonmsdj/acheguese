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
    const routesSource = readProjectFile("src/app/routes/AppRoutes.tsx");
    const contextSource = readProjectFile(
      "src/core/profiles/contexts/multi-profile-runtime-context.tsx",
    );

    expect(routesSource).not.toContain('path="/create-driver"');
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

  it("keeps passenger tracking notifications bound to mobilityRoutes helper", () => {
    const rideOperationalSource = readProjectFile("src/modules/mobility/core/RideOperationalService.ts");
    const postTransitionSource = readProjectFile("src/modules/mobility/core/RideOperationalPostTransition.ts");

    expect(rideOperationalSource).toContain("handleRidePostTransition(rideId, toState, ride)");
    expect(postTransitionSource).toContain("mobilityRoutes.passageiro.buscando(rideId)");
    expect(postTransitionSource).not.toContain("`/mobilidade/buscando/${rideId}`");
  });
});
