import { readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");
const srcRoot = resolve(repoRoot, "src");
const geolocationOwner = "src/shared/services/GeolocationService.ts";

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const absolutePath = resolve(directory, entry);
    if (statSync(absolutePath).isDirectory()) {
      return collectSourceFiles(absolutePath);
    }
    return /\.(?:ts|tsx)$/.test(entry) ? [absolutePath] : [];
  });
}

describe("browser geolocation SSOT boundary", () => {
  it("keeps navigator.geolocation owned exclusively by GeolocationService", () => {
    const offenders = collectSourceFiles(srcRoot)
      .map((absolutePath) => ({
        path: relative(repoRoot, absolutePath).replaceAll("\\", "/"),
        source: readFileSync(absolutePath, "utf8"),
      }))
      .filter(({ path, source }) =>
        path !== geolocationOwner && source.includes("navigator.geolocation"),
      )
      .map(({ path }) => path);

    expect(offenders).toEqual([]);
  });

  it("keeps business address CEP lookup behind LocationGeocodingService", () => {
    const source = readFileSync(
      resolve(repoRoot, "src/core/business/components/settings/AddressEditor.tsx"),
      "utf8",
    );

    expect(source).toContain("locationGeocodingService.lookupPostalCode");
    expect(source).not.toContain("viacep.com.br");
    expect(source).not.toContain("navigator.geolocation");
    expect(source).toContain('value={address.latitude ?? ""}');
    expect(source).toContain('value={address.longitude ?? ""}');
  });

  it("keeps interactive ride and delivery GPS precise and without IP fallback", () => {
    const ride = readFileSync(
      resolve(repoRoot, "src/modules/mobility/components/CreateRideModal.tsx"),
      "utf8",
    );
    const delivery = readFileSync(
      resolve(repoRoot, "src/modules/mobility/components/CreateDeliveryModal.tsx"),
      "utf8",
    );

    for (const source of [ride, delivery]) {
      expect(source).toContain("GeolocationService.getCurrentLocation");
      expect(source).toContain('gpsMode: "precise"');
      expect(source).toContain("allowIpFallback: false");
      expect(source).not.toContain("navigator.geolocation");
    }

    expect(ride).toContain("coords?.latitude ?? null");
    expect(ride).toContain("coords?.longitude ?? null");
  });
});
