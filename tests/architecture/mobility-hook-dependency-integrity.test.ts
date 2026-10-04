import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("mobility hook dependency integrity", () => {
  it("keeps AddressInput effects explicit without suppressing hook dependencies", () => {
    const input = read(
      "src/modules/mobility/components/ride-request/AddressInput.tsx",
    );
    const hook = read("src/modules/mobility/hooks/useAddressInput.ts");

    expect(input).not.toContain("eslint-disable-line react-hooks/exhaustive-deps");
    expect(input).toContain("autoCaptureAttemptedRef");
    expect(input).toContain("[autoCaptureGPS, initialValue, captureGPS]");
    expect(input).toContain("[initialValue, addressText, setAddressText]");

    expect(hook).toContain("setText((currentText) => {");
    expect(hook).toContain("if (newText !== currentText)");
    expect(hook).toContain("setCoords(null)");
    expect(hook).toContain("setLocationId('')");
    expect(hook).toContain("setIsValid(false)");
  });

  it("rebuilds the route map when route coordinates change", () => {
    const page = read("src/modules/mobility/pages/BuscandoMotoristaPage.tsx");

    expect(page).not.toContain("eslint-disable-line react-hooks/exhaustive-deps");
    expect(page).toContain(
      "[originLat, originLng, destinationLat, destinationLng]",
    );
  });
});
