import { describe, expect, it } from "vitest";
import type {
  FailedDeliveryMetadata,
  FailedDeliveryResolutionUpdate,
  FailedDeliverySnapshotInput,
} from "../../src/core/mobility/types/FailedDeliveryMetadata";

describe("GATE 3 - Failed Delivery Metadata", () => {
  it("accepts only the canonical initial failed-delivery snapshot shape", () => {
    const metadata: FailedDeliverySnapshotInput = {
      failure_reason: "recipient_unavailable",
      item_destination: "awaiting_manual_resolution",
      item_current_holder: "driver",
      timestamp: new Date().toISOString(),
      resolution_status: "pending",
    };

    expect(metadata.failure_reason).toBe("recipient_unavailable");
    expect(metadata.item_current_holder).toBe("driver");
    expect(metadata.resolution_status).toBe("pending");
  });

  it("keeps conditional snapshot evidence available without mixing resolution authority", () => {
    const metadata: FailedDeliverySnapshotInput = {
      failure_reason: "other",
      item_destination: "awaiting_manual_resolution",
      item_current_holder: "driver",
      timestamp: new Date().toISOString(),
      resolution_status: "pending",
      resolution_notes: "Situacao complexa que requer analise",
      failed_at_location: {
        lat: -12.9714,
        lng: -38.5014,
        address: "Salvador, BA",
      },
      photos: ["evidence://photo-1"],
      attempt_number: 1,
      attempted_delivery_count: 1,
    };

    expect(metadata.resolution_notes).toBeTruthy();
    expect(metadata.failed_at_location?.lat).toBe(-12.9714);
    expect(metadata.photos).toHaveLength(1);
  });

  it("uses retry_delivery_requested for same-custodian retry commands", () => {
    const update: FailedDeliveryResolutionUpdate = {
      retry_delivery_requested: true,
      resolution_action_notes: "Destinatario disponivel para nova tentativa.",
    };

    expect(update.retry_delivery_requested).toBe(true);
    expect(update.resolution_action_notes).toBeTruthy();
    expect("next_ride_id" in update).toBe(false);
  });

  it("keeps handoff request separate from physical custody transfer", () => {
    const update: FailedDeliveryResolutionUpdate = {
      handoff_requested: true,
      handoff_driver_profile_id: "987fcdeb-51a2-43f1-b789-123456789abc",
      resolution_status: "in_progress",
      resolution_action_notes: "Transferencia operacional solicitada.",
    };

    expect(update.handoff_requested).toBe(true);
    expect(update.handoff_driver_profile_id).toBeTruthy();
    expect(update.resolution_status).toBe("in_progress");
  });

  it("supports manual escalation without inventing logistics state", () => {
    const update: FailedDeliveryResolutionUpdate = {
      resolution_status: "escalated",
      manual_resolution_owner_profile_id: "admin-profile-id",
      resolution_action_notes: "Analise administrativa necessaria.",
    };

    expect(update.resolution_status).toBe("escalated");
    expect(update.manual_resolution_owner_profile_id).toBeTruthy();
  });

  it("preserves next_ride_id only as historical read metadata", () => {
    const legacyMetadata: FailedDeliveryMetadata = {
      failure_reason: "recipient_unavailable",
      item_destination: "return_to_sender",
      item_current_holder: "driver",
      timestamp: new Date().toISOString(),
      resolution_status: "resolved",
      next_ride_id: "123e4567-e89b-12d3-a456-426614174000",
      resolved_at: new Date().toISOString(),
    };

    expect(legacyMetadata.next_ride_id).toBeTruthy();
    expect(legacyMetadata.resolution_status).toBe("resolved");
  });

  it("represents the canonical G82 same-ride retry result in persisted metadata", () => {
    const metadata: FailedDeliveryMetadata = {
      failure_reason: "recipient_unavailable",
      item_destination: "awaiting_manual_resolution",
      item_current_holder: "driver",
      timestamp: new Date().toISOString(),
      resolution_status: "resolved",
      resolution_plan: "retry_same_driver",
      resolution_action: "retry_same_driver",
      resolution_item_holder: "driver",
      retry_driver_profile_id: "driver-profile-id",
      retry_resumed_at: new Date().toISOString(),
      resolved_at: new Date().toISOString(),
    };

    expect(metadata.resolution_plan).toBe("retry_same_driver");
    expect(metadata.resolution_action).toBe("retry_same_driver");
    expect(metadata.retry_driver_profile_id).toBe("driver-profile-id");
    expect(metadata.next_ride_id).toBeUndefined();
  });

  it("represents receiver-confirmed custody lineage without requiring a successor ride", () => {
    const metadata: FailedDeliveryMetadata = {
      failure_reason: "driver_unavailable",
      item_destination: "handoff_to_another_driver",
      item_current_holder: "other_driver",
      timestamp: new Date().toISOString(),
      resolution_status: "resolved",
      resolution_plan: "handoff_to_another_driver",
      resolution_action: "handoff_to_another_driver",
      resolution_item_holder: "other_driver",
      handoff_driver_profile_id: "receiver-profile-id",
      handoff_from_driver_profile_id: "original-profile-id",
      handoff_confirmed_at: new Date().toISOString(),
      handoff_accepted_at: new Date().toISOString(),
      handoff_acceptance_source: "authenticated_driver_accept",
      custody_handoff_history: [
        {
          from_driver_profile_id: "original-profile-id",
          to_driver_profile_id: "receiver-profile-id",
          confirmed_at: new Date().toISOString(),
          source: "failed_delivery_handoff",
        },
      ],
    };

    expect(metadata.item_current_holder).toBe("other_driver");
    expect(metadata.custody_handoff_history).toHaveLength(1);
    expect(metadata.next_ride_id).toBeUndefined();
  });
});
