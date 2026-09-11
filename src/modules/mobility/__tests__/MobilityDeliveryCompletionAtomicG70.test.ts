import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

const migration = readProjectFile(
  "supabase/migrations/20260911222000_complete_delivery_in_single_transaction_g70.sql",
);
const deliveryActions = readProjectFile(
  "src/core/mobility/core/RideDeliveryOperationalActions.ts",
);
const operationalService = readProjectFile(
  "src/core/mobility/core/RideOperationalService.ts",
);
const deliveryUi = readProjectFile(
  "src/core/mobility/components/driver/MotoboyDeliveryActions.tsx",
);
const driverHook = readProjectFile(
  "src/core/mobility/hooks/useMotoristaPage.ts",
);
const motoboyHook = readProjectFile(
  "src/modules/mobility/hooks/useMotoboyPage.ts",
);

describe("G70 atomic terminal delivery", () => {
  it("keeps the public delivery RPC contract single and wraps the prior authority", () => {
    expect(migration).toContain(
      "RENAME TO mobility_transition_delivery_state_atomic_base_g70",
    );
    expect(migration).toContain(
      "private.mobility_transition_delivery_state_atomic_base_g70(",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.mobility_transition_delivery_state_atomic(",
    );
    expect(migration).not.toContain("mobility_complete_delivery_atomic");
  });

  it("records delivered and completed inside the same database command", () => {
    expect(migration).toContain("IF p_command <> 'confirm_delivery' THEN");
    expect(migration).toContain("v_delivery->>'to_state' IS DISTINCT FROM 'delivered'");
    expect(migration).toContain("public.mobility_transition_ride_state_atomic(");
    expect(migration).toContain("'delivered',\n    'completed'");
    expect(migration).toContain("'to_state', 'completed'");
    expect(migration).toContain("'delivered_recorded', TRUE");
  });

  it("keeps the completion boundary service-role only", () => {
    expect(migration).toContain("service_role is required");
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role");
  });

  it("removes browser-orchestrated delivered then completed sequencing", () => {
    expect(deliveryActions).toContain(
      "MobilityRpcService.transitionDeliveryState({",
    );
    expect(deliveryActions).toContain(
      'expectedFromState: RIDE_STATE.IN_DELIVERY',
    );
    expect(deliveryActions).toContain(
      'transition.to_state !== RIDE_STATE.COMPLETED',
    );
    expect(deliveryActions).not.toContain(
      "return await transitionTo(rideId, RIDE_STATE.COMPLETED",
    );
    expect(deliveryActions).not.toContain(
      '| {\n      type: "confirm_delivery";',
    );

    expect(operationalService).toContain(
      "const result = await confirmDeliveryOperation(",
    );
    expect(operationalService).toContain(
      "rideStatus: RIDE_STATE.COMPLETED",
    );
  });

  it("uses the operational PIN as authentication and keeps proof code as evidence only", () => {
    expect(deliveryUi).toContain(
      "OperationalVerificationService.getVerificationStatusSummaryResult",
    );
    expect(deliveryUi).toContain(
      "OperationalVerificationService.isValidPINFormat(deliveryPin)",
    );
    expect(deliveryUi).toContain("PIN operacional de 4 digitos");
    expect(deliveryUi).toContain("Referencia do comprovante (opcional)");
    expect(deliveryUi).toContain("nao substitui o PIN operacional");
    expect(deliveryUi).toContain(
      'verificationState.status === "required" ? deliveryPin : undefined',
    );

    for (const hook of [driverHook, motoboyHook]) {
      expect(hook).toContain("pin?: string");
      expect(hook).toContain("proof,\n        finalPrice,\n        pin,");
      expect(hook).toContain("Promise<boolean>");
    }
  });

  it("keeps boarding and delivery verification reads fail-closed", () => {
    expect(operationalService).toContain(
      "OperationalVerificationService.getVerificationStatusResult(rideId)",
    );
    expect(operationalService).toContain(
      'error: "Boarding verification state is unavailable"',
    );
    expect(deliveryActions).toContain(
      "OperationalVerificationService.getVerificationStatusResult(rideId)",
    );
    expect(deliveryActions).toContain(
      'error: "Delivery verification state is unavailable"',
    );
  });
});
