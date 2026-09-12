import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G95 retired driver plan schema", () => {
  const schemas = readProjectFile(
    "src/core/mobility/schemas/mobilitySchemas.ts",
  );
  const generatedTypes = readProjectFile(
    "src/core/mobility/types/mobility.generated.ts",
  );

  it("does not expose the retired padrao/prioritario driver plan", () => {
    expect(schemas).not.toContain("DriverPlanSchema");
    expect(schemas).not.toContain('z.enum(["padrao", "prioritario"])');
    expect(generatedTypes).not.toContain("DriverPlanSchema");
    expect(generatedTypes).not.toContain("export type DriverPlan");
  });

  it("keeps plan and fabricated lifetime earnings out of DriverProfileSchema", () => {
    const start = schemas.indexOf("export const DriverProfileSchema = z.object({");
    const end = schemas.indexOf("// ============================================================================\n// RIDE REQUEST SCHEMA", start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);

    const driverProfileSchema = schemas.slice(start, end);
    expect(driverProfileSchema).not.toContain("subscription_plan");
    expect(driverProfileSchema).not.toContain("total_earnings");
    expect(driverProfileSchema).toContain("subscription_active");
    expect(driverProfileSchema).toContain("total_rides");
  });

  it("does not remove the legitimate earnings validation capability", () => {
    expect(schemas).toContain("export const DriverEarningsSchema");
    expect(schemas).toContain("validateDriverEarnings");
    expect(generatedTypes).toContain("export type DriverEarnings");
  });
});
