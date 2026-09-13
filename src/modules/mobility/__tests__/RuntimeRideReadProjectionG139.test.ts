import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G139 canonical ride read projection", () => {
  const queries = readProjectFile(
    "src/core/mobility/services/mobility.queries.ts",
  );
  const runtime = readProjectFile(
    "src/core/mobility/services/MobilityRuntimeService.ts",
  );

  function queryFunction(name: string, nextName: string): string {
    const start = queries.indexOf(name);
    const end = queries.indexOf(nextName, start);
    return queries.slice(start, end);
  }

  it("uses the shared bounded read model for ride-by-id on the query owner", () => {
    const body = queryFunction(
      "export async function getRideById(",
      "export async function getRidesByPassenger(",
    );
    expect(body).toContain(".from<RideRequestReadRow>(\"ride_requests\")");
    expect(body).toContain(".select(RIDE_REQUEST_READ_SELECT)");
    expect(body).toContain("toRideRequestReadModel(data)");
    expect(body).not.toContain('select("*")');
  });

  it("uses the shared bounded read model for user ride lists on the query owner", () => {
    const start = queries.indexOf("export async function getUserRides(");
    const end = queries.indexOf("export async function getDriverDataIdByProfileId(", start);
    const body = queries.slice(start, end);
    expect(body).toContain(".from<RideRequestReadRow>(\"ride_requests\")");
    expect(body).toContain(".select(RIDE_REQUEST_READ_SELECT)");
    expect(body).toContain(".map(toRideRequestReadModel)");
    expect(body).not.toContain('select("*")');
  });

  it("does not duplicate the general ride projection in the runtime singleton", () => {
    expect(queries).toContain('from "./RideRequestReadModel"');
    expect(runtime).not.toContain('from "./RideRequestReadModel"');
    expect(runtime).not.toContain("async getRideById(");
    expect(runtime).not.toContain("async getUserRides(");
    expect(runtime).not.toContain("const RUNTIME_RIDE_SELECT");
    expect(runtime).not.toContain("const RIDE_RUNTIME_SELECT");
  });
});
