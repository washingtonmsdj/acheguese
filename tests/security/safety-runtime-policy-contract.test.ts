import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(ROOT, relativePath), "utf8");
}

const rideSharePolicy = read("src/core/safety/config/rideSharePolicy.ts");
const evidencePolicy = read("src/core/safety/config/evidencePolicy.ts");
const safetyService = read("src/core/safety/services/SafetyService.ts");
const rideShareService = read("src/core/safety/services/SafetyRideShareService.ts");
const rideShareHook = read("src/core/safety/hooks/useRideShare.ts");
const shareRideButton = read("src/modules/mobility/components/ShareRideButton.tsx");
const emergencyButton = read("src/modules/mobility/components/EmergencyButton.tsx");

describe("Safety runtime policy contract", () => {
  it("keeps ride-share expiration and refresh policy in one owner", () => {
    expect(rideSharePolicy).toContain("SAFETY_RIDE_SHARE_POLICY");
    expect(rideSharePolicy).toContain("defaultExpirationHours");
    expect(rideSharePolicy).toContain("minExpirationHours");
    expect(rideSharePolicy).toContain("maxExpirationHours");
    expect(rideSharePolicy).toContain("refreshIntervalMs");

    expect(safetyService).toContain(
      "shareExpirationHours: SAFETY_RIDE_SHARE_POLICY.defaultExpirationHours",
    );
    expect(rideShareService).toContain(
      "SAFETY_RIDE_SHARE_POLICY.minExpirationHours",
    );
    expect(rideShareService).toContain(
      "SAFETY_RIDE_SHARE_POLICY.maxExpirationHours",
    );
    expect(rideShareHook).toContain(
      "refetchInterval: SAFETY_RIDE_SHARE_POLICY.refreshIntervalMs",
    );
    expect(rideShareHook).not.toContain("refetchInterval: 10000");
  });

  it("keeps evidence file-size policy owned by Safety config", () => {
    expect(evidencePolicy).toContain("SAFETY_EVIDENCE_UPLOAD_POLICY");
    expect(evidencePolicy).toContain("maxFileSizeBytes");
    expect(safetyService).toContain(
      "maxEvidenceFileSize: SAFETY_EVIDENCE_UPLOAD_POLICY.maxFileSizeBytes",
    );
    expect(safetyService).not.toContain("maxEvidenceFileSize: 10 * 1024 * 1024");
  });

  it("keeps Mobility ride-share UI policy-free and on the public Safety hook", () => {
    expect(shareRideButton).toContain('useRideShare');
    expect(shareRideButton).toContain('createShare.mutateAsync');
    expect(shareRideButton).not.toContain('safetyService.createRideShare');
    expect(shareRideButton).not.toContain('expiresInHours:');
    expect(shareRideButton).toContain('shareLink.expiresAt');
    expect(shareRideButton).toContain(
      'Localização exibida quando autorizada e disponível',
    );
    expect(shareRideButton).not.toContain('Rastreamento em tempo real');
  });

  it("does not overstate external emergency-contact delivery", () => {
    expect(emergencyButton).toContain("Alerta de emergência registrado");
    expect(emergencyButton).toContain("o sistema tentará notificá-los");
    expect(emergencyButton).not.toContain(
      "serão enviados para contatos de emergência",
    );
    expect(emergencyButton).not.toContain("foram enviados para contatos");
    expect(emergencyButton).toContain("accuracy: geoResult.coords.accuracy");
  });
});
