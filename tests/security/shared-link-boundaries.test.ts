import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const footer = readFileSync(
  "src/shared/components/standalone/StandaloneFooter.tsx",
  "utf8",
);
const mapButton = readFileSync(
  "src/core/maps/components/ViewOnMapButton.tsx",
  "utf8",
);

describe("shared link boundaries", () => {
  it("routes standalone contact actions through validated builders and SafeLink", () => {
    expect(footer).toContain("const phoneUrl = buildTelUrl(business.phone);");
    expect(footer).toContain("const emailUrl = buildMailtoUrl(business.email);");
    expect(footer).toContain("<SafeLink");
    expect(footer).not.toContain("href={buildTelUrl(business.phone) ?? undefined}");
    expect(footer).not.toContain("href={buildMailtoUrl(business.email) ?? undefined}");
  });

  it("uses router navigation for the internal map route and accepts zero coordinates", () => {
    expect(mapButton).toContain("import { Link } from 'react-router-dom';");
    expect(mapButton).toContain("<Link to={mapUrl}>");
    expect(mapButton).not.toContain("<a href={mapUrl}>");
    expect(mapButton).toContain("Number.isFinite(latitude)");
    expect(mapButton).toContain("Number.isFinite(longitude)");
    expect(mapButton).not.toContain("if (!latitude || !longitude)");
  });
});
