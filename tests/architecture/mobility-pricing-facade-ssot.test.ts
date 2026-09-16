import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

function exportedFunctionNames(source: string): Set<string> {
  return new Set(
    Array.from(
      source.matchAll(/export\s+function\s+([A-Za-z_$][\w$]*)/g),
      (match) => match[1],
    ),
  );
}

function mobilityHelperReexports(source: string): string[] {
  const block = source.match(
    /export\s*\{([\s\S]*?)\}\s*from\s*["']\.\/mobility\.helpers["'];?/m,
  );

  if (!block?.[1]) return [];

  return block[1]
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.replace(/^type\s+/, "").split(/\s+as\s+/)[0]?.trim())
    .filter((entry): entry is string => Boolean(entry));
}

function mobilityHelperBindings(source: string): string[] {
  return Array.from(
    source.matchAll(/MobilityHelpers\.([A-Za-z_$][\w$]*)/g),
    (match) => match[1],
  );
}

describe("Mobility pricing facade SSOT", () => {
  it("does not re-export the removed hardcoded fare helper", () => {
    const facade = read("src/core/mobility/services/MobilityService.ts");
    const helpers = read("src/core/mobility/services/mobility.helpers.ts");

    expect(helpers).not.toContain("calculateEstimatedFare");
    expect(facade).not.toContain("calculateEstimatedFare");
  });

  it("keeps every mobility helper re-export and facade binding backed by a real helper export", () => {
    const facade = read("src/core/mobility/services/MobilityService.ts");
    const helpers = read("src/core/mobility/services/mobility.helpers.ts");
    const availableHelpers = exportedFunctionNames(helpers);
    const referencedHelpers = new Set([
      ...mobilityHelperReexports(facade),
      ...mobilityHelperBindings(facade),
    ]);

    expect(availableHelpers.size).toBeGreaterThan(0);
    expect(referencedHelpers.size).toBeGreaterThan(0);

    const missingHelpers = Array.from(referencedHelpers).filter(
      (name) => !availableHelpers.has(name),
    );

    expect(missingHelpers).toEqual([]);
  });

  it("keeps transactional mobility pricing owned by the server quote broker", () => {
    const pricingRepository = read(
      "src/core/pricing/services/PricingService.ts",
    );
    const quoteService = read(
      "src/core/pricing/services/MobilityPriceQuoteService.ts",
    );
    const quoteBroker = read("supabase/functions/mobility-pricing-rpc/index.ts");
    const helpers = read("src/core/mobility/services/mobility.helpers.ts");

    expect(pricingRepository).not.toContain("calculateEstimate(");
    expect(pricingRepository).not.toContain("calculateQuickEstimate(");
    expect(pricingRepository).not.toContain("getFallbackRule");
    expect(pricingRepository).not.toContain("AVERAGE_SPEED_KMH");
    expect(quoteService).toContain('const FUNCTION_NAME = "mobility-pricing-rpc"');
    expect(quoteService).toContain('action: "quote"');
    expect(quoteBroker).toContain("mobility_price_quotes");
    expect(helpers).not.toMatch(/baseFare\s*[=:+]/);
    expect(helpers).not.toMatch(/pricePerKm\s*[=:+]/);
    expect(helpers).not.toMatch(/perKmRate\s*[=:+]/);
  });
});
