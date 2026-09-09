import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("Mobility atomic ride transition authority", () => {
  it("keeps ride state transitions server-owned and atomic", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260909120726_add_atomic_mobility_ride_transition_command_g6.sql",
    );
    const broker = readProjectFile("supabase/functions/mobility-rpc/index.ts");
    const rpcService = readProjectFile(
      "src/core/mobility/services/MobilityRpcService.ts",
    );
    const operationalService = readProjectFile(
      "src/core/mobility/core/RideOperationalService.ts",
    );

    expect(migration).toContain("mobility_transition_ride_state_atomic");
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain("invalid ride state transition");
    expect(migration).toContain("INSERT INTO public.ride_state_audit");
    expect(migration).toContain("TO service_role");
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");

    expect(broker).toContain("transitionRideState: true");
    expect(broker).toContain("requireRideTransitionActor");
    expect(broker).toContain("requireBoardingVerification");
    expect(broker).toContain(
      '"Transition is reserved for dispatch or a dedicated command"',
    );
    expect(broker).toContain('"mobility_transition_ride_state_atomic"');

    expect(rpcService).toContain('"transitionRideState"');
    expect(operationalService).toContain(
      "MobilityRpcService.transitionRideState",
    );
    expect(operationalService).not.toContain("updateRideWithGuards");
  });
});
