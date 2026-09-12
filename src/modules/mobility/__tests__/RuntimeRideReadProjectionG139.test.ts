import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G139 runtime ride read projection", () => {
  const runtime = readProjectFile(
    "src/core/mobility/services/MobilityRuntimeService.ts",
  );

  function method(name: string, nextName: string): string {
    const start = runtime.indexOf(name);
    const end = runtime.indexOf(nextName, start);
    return runtime.slice(start, end);
  }

  it("uses the shared bounded read model for ride-by-id", () => {
    const body = method("async getRideById(", "async getRideWithAddresses(");
    expect(body).toContain(".from<RideRequestReadRow>(\"ride_requests\")");
    expect(body).toContain(".select(RIDE_REQUEST_READ_SELECT)");
    expect(body).toContain("toRideRequestReadModel(data)");
    expect(body).not.toContain('select("*")');
  });

  it("uses the shared bounded read model for user ride lists", () => {
    const body = method("async getUserRides(", "async getRideBasicInfo(");
    expect(body).toContain(".from<RideRequestReadRow>(\"ride_requests\")");
    expect(body).toContain(".select(RIDE_REQUEST_READ_SELECT)");
    expect(body).toContain(".map(toRideRequestReadModel)");
    expect(body).not.toContain('select("*")');
  });

  it("does not maintain a second runtime ride projection list", () => {
    expect(runtime).toContain('from "./RideRequestReadModel"');
    expect(runtime).not.toContain("const RUNTIME_RIDE_SELECT");
    expect(runtime).not.toContain("const RIDE_RUNTIME_SELECT");
  });
});
