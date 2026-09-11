import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("Mobility secure passenger boarding flow", () => {
  it("derives passenger progression from the canonical ride state machine", () => {
    const policy = readProjectFile(
      "src/core/mobility/core/DriverRideActionPolicy.ts",
    );

    expect(policy).toContain("RideStateMachine.canTransition");
    expect(policy).toContain("RIDE_STATE.DRIVER_ARRIVING");
    expect(policy).toContain("RIDE_STATE.PASSENGER_BOARDED");
    expect(policy).toContain("RIDE_STATE.IN_PROGRESS");
    expect(policy).not.toContain("driver_on_the_way");
    expect(policy).not.toContain("passenger_on_board");
  });

  it("fails closed when the PIN security state cannot be established", () => {
    const verificationService = readProjectFile(
      "src/core/mobility/services/OperationalVerificationService.ts",
    );
    const progression = readProjectFile(
      "src/core/mobility/components/driver/DriverPassengerRideProgression.tsx",
    );

    expect(verificationService).toContain("getVerificationStatusResult");
    expect(verificationService).toContain("getVerificationStatusSummaryResult");
    expect(verificationService).toContain("success: false");
    expect(progression).toContain("getVerificationStatusSummaryResult");
    expect(progression).toContain('setVerificationState("error")');
    expect(progression).toContain("Embarque bloqueado por segurança");
    expect(progression).toContain('inputMode="numeric"');
    expect(progression).toContain('maxLength={4}');
    expect(progression).not.toContain(".from(");
    expect(progression).not.toContain("ride_requests");
  });

  it("keeps PIN verification and boarding authority server-side", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260909145145_harden_operational_pin_protocol_g7.sql",
    );
    const broker = readProjectFile("supabase/functions/mobility-rpc/index.ts");
    const operationalService = readProjectFile(
      "src/core/mobility/core/RideOperationalService.ts",
    );
    const hook = readProjectFile(
      "src/core/mobility/hooks/useMotoristaPage.ts",
    );

    expect(migration).toContain(
      "assigned_driver_required_for_pin_verification",
    );
    expect(migration).toContain("verification_attempts");
    expect(migration).toContain("max_attempts_reached");
    expect(migration).toContain("extensions.crypt");
    expect(migration).toContain(
      "REVOKE EXECUTE ON FUNCTION public.create_operational_pin_verification",
    );

    const boardingGuardIndex = broker.indexOf(
      'if (toState === "passenger_boarded")',
    );
    const atomicTransitionIndex = broker.indexOf(
      '"mobility_transition_ride_state_atomic"',
      boardingGuardIndex,
    );
    expect(boardingGuardIndex).toBeGreaterThan(-1);
    expect(broker.indexOf("requireBoardingVerification", boardingGuardIndex)).toBeGreaterThan(
      boardingGuardIndex,
    );
    expect(atomicTransitionIndex).toBeGreaterThan(boardingGuardIndex);
    expect(broker).toContain("Only the assigned driver can perform this transition");

    expect(operationalService).toContain(
      "OperationalVerificationService.verifyPIN",
    );
    expect(operationalService).toContain(
      "MobilityRpcService.transitionRideState",
    );
    expect(hook).toContain("startPassengerPickupRoute");
    expect(hook).toContain("confirmPassengerBoarding");
    expect(hook).toContain("RIDE_STATUS.PASSENGER_BOARDED");
    expect(hook).not.toContain(".from(\"ride_requests\")");
  });
});
