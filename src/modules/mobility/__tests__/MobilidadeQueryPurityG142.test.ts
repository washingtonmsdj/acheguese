import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G142 mobility query purity", () => {
  const hook = readProjectFile("src/modules/mobility/hooks/useMobilidade.ts");

  it("keeps React state mutations outside the TanStack ride query function", () => {
    const queryStart = hook.indexOf("queryKey: MOBILITY_QUERY_KEYS.rides");
    const queryEnd = hook.indexOf("useRideRealtime({", queryStart);
    const queryBlock = hook.slice(queryStart, queryEnd);

    expect(queryBlock).toContain("return ((await getUserRides(user.id)) || [])");
    expect(queryBlock).not.toContain("setActiveRide(");
    expect(hook).toContain("useEffect(() => {");
    expect(hook).toContain("setActiveRide(rides.find((ride) => isOpenRideStatus(ride.status)) ?? null)");
  });
});
