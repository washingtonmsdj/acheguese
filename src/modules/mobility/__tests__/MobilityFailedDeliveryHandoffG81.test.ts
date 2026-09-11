import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

const handoffMigration = readProjectFile(
  "supabase/migrations/20260911230000_receiver_confirmed_failed_delivery_handoff_g81.sql",
);
const handoffOfferMigration = readProjectFile(
  "supabase/migrations/20260911231000_targeted_failed_delivery_handoff_offer_g81.sql",
);
const handoffPinMigration = readProjectFile(
  "supabase/migrations/20260911232000_align_handoff_pin_authority_g81.sql",
);
const canonicalLifecycleMigration = readProjectFile(
  "supabase/migrations/20260909192625_restore_canonical_ride_share_terminal_trigger_g20.sql",
);
const broker = readProjectFile("supabase/functions/mobility-rpc/index.ts");
const receiverService = readProjectFile(
  "src/core/mobility/services/FailedDeliveryHandoffService.ts",
);
const adminService = readProjectFile(
  "src/core/mobility/services/FailedDeliveryHandoffAdminService.ts",
);
const offerCard = readProjectFile(
  "src/modules/mobility/components/DriverOfferCard.tsx",
);
const guards = readProjectFile(
  "src/core/mobility/core/RideOperationalGuards.ts",
);

describe("G81 receiver-confirmed failed-delivery custody handoff", () => {
  it("keeps administrative selection separate from physical custody transfer", () => {
    expect(guards).toContain(
      "handoff_driver_profile_id exige handoff_requested=true",
    );
    expect(adminService).toContain("handoff_requested: true");
    expect(adminService).toContain('resolution_status: "in_progress"');

    const requestFunction = handoffMigration.slice(
      handoffMigration.indexOf(
        "CREATE OR REPLACE FUNCTION private.mobility_request_failed_delivery_handoff_g81",
      ),
      handoffMigration.indexOf(
        "CREATE OR REPLACE FUNCTION public.mobility_update_failed_delivery_resolution_atomic",
      ),
    );
    expect(requestFunction).toContain("'resolution_status', 'in_progress'");
    expect(requestFunction).toContain("'resolution_plan', 'handoff_to_another_driver'");
    expect(requestFunction).toContain("'handoff_request_expires_at', v_expires_at");
    expect(requestFunction).not.toContain("SET status = 'in_delivery'");
    expect(requestFunction).not.toContain("driver_profile_id = p_target_driver_profile_id");
  });

  it("requires authenticated receiver acceptance through the actor-bound broker path", () => {
    expect(broker).toContain("p_actor_user_id: auth.userId");
    expect(handoffMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.mobility_accept_ride_atomic(\n  p_actor_user_id uuid,",
    );
    expect(handoffMigration).toContain(
      "profile.id = p_driver_profile_id AND profile.user_id = p_actor_user_id",
    );
    expect(handoffMigration).toContain("p_strategy IS DISTINCT FROM 'exclusive_offer'");
    expect(handoffMigration).toContain("actor_bound_accept_required");
    expect(receiverService).toContain('"exclusive_offer"');
  });

  it("revalidates physical and operational eligibility at acceptance time", () => {
    const confirmFunction = handoffMigration.slice(
      handoffMigration.indexOf(
        "CREATE OR REPLACE FUNCTION private.mobility_confirm_failed_delivery_handoff_g81",
      ),
      handoffMigration.indexOf(
        "ALTER FUNCTION public.mobility_accept_ride_atomic(uuid, uuid, text)",
      ),
    );

    expect(confirmFunction).toContain("last_location_update < v_now - interval '5 minutes'");
    expect(confirmFunction).toContain("v_distance_m > 500");
    expect(confirmFunction).toContain("private.mobility_operational_city_id");
    expect(confirmFunction).toContain("private.build_trust_policy_decision");
    expect(confirmFunction).toContain("block_until_admin_review");
    expect(confirmFunction).toContain("active_ride_id IS NOT NULL");
  });

  it("does not open failed_delivery -> in_delivery on the generic lifecycle authority", () => {
    expect(canonicalLifecycleMigration).toContain(
      "WHEN 'failed_delivery' THEN p_to_state IN ('cancelled_by_driver', 'failed')",
    );
    expect(canonicalLifecycleMigration).not.toContain(
      "WHEN 'failed_delivery' THEN p_to_state IN ('in_delivery'",
    );

    const confirmFunction = handoffMigration.slice(
      handoffMigration.indexOf(
        "CREATE OR REPLACE FUNCTION private.mobility_confirm_failed_delivery_handoff_g81",
      ),
      handoffMigration.indexOf(
        "ALTER FUNCTION public.mobility_accept_ride_atomic(uuid, uuid, text)",
      ),
    );
    expect(confirmFunction).toContain("SET status = 'in_delivery'");
    expect(confirmFunction).toContain(
      "'transfer_authority', 'authenticated_receiving_driver_acceptance'",
    );
  });

  it("moves ride, driver availability and gastronomy courier inside one transaction", () => {
    expect(handoffMigration).toContain("UPDATE public.driver_availability");
    expect(handoffMigration).toContain("UPDATE public.ride_requests request");
    expect(handoffMigration).toContain("UPDATE public.orders");
    expect(handoffMigration).toContain("'courier_handoff'");
    expect(handoffMigration).toContain("gastronomy order courier changed during handoff");
    expect(handoffMigration).toContain(
      "'courier_settlement_allocation_required', true",
    );
  });

  it("records the receiving driver as transition authority and preserves custody lineage", () => {
    expect(handoffMigration).toContain(
      "p_ride_id, 'failed_delivery', 'in_delivery', p_driver_profile_id::text",
    );
    expect(handoffMigration).toContain("mobility_preserve_handoff_lineage_g81");
    expect(handoffMigration).toContain("'custody_handoff_history', v_history");
    expect(handoffMigration).toContain("'from_driver_profile_id', v_from_driver");
    expect(handoffMigration).toContain("'to_driver_profile_id', p_driver_profile_id");
  });

  it("keeps the preaccept targeted offer privacy-safe", () => {
    const offerShape = handoffOfferMigration.slice(
      handoffOfferMigration.indexOf("pg_catalog.jsonb_build_object("),
      handoffOfferMigration.indexOf(") AS offer,\n      targeted.expires_at"),
    );

    expect(offerShape).toContain("'location_precision', 'coarse_2dp'");
    expect(offerShape).toContain("'offer_kind', 'failed_delivery_handoff'");
    expect(offerShape).toContain("'handoff_request_expires_at'");
    expect(offerShape).not.toContain("package_description");
    expect(offerShape).not.toContain("passenger_profile_id");
    expect(offerShape).not.toContain("source_id");
    expect(offerShape).not.toContain("handoff_from_driver_profile_id");

    expect(receiverService).not.toContain("packageDescription");
    expect(receiverService).toContain('locationPrecision: "coarse_2dp"');
  });

  it("preserves the current requester-owned pending PIN semantics during handoff", () => {
    expect(handoffPinMigration).toContain(
      "operational_verifications.required_by IN ('passenger','sender','admin','operation')",
    );
    expect(handoffPinMigration).toContain(
      "THEN operational_verifications.verification_attempts",
    );
    expect(handoffPinMigration).toContain(
      "THEN operational_verifications.last_attempt_at",
    );
    expect(handoffMigration).toContain(
      "PERFORM private.mobility_reconcile_handoff_pin_g81(p_ride_id, p_driver_profile_id)",
    );
  });

  it("surfaces the receiver confirmation in the existing driver offer card", () => {
    expect(offerCard).toContain("FailedDeliveryHandoffService.listPending");
    expect(offerCard).toContain("FailedDeliveryHandoffService.accept");
    expect(offerCard).toContain("Aceitar transferencia");
    expect(offerCard).toContain("Localizacao aproximada antes do aceite");
  });
});
