import { describe, expect, it } from "vitest";
import type { Profile, ProfileType } from "../../src/core/profiles/services/multi-profile/types";
import { resolveModuleProfileSelection } from "../../src/core/profiles/services/multi-profile/moduleProfileSelection";
import { resolveDriverOfferRealtimeAction } from "../../src/core/mobility/core/driverOfferRealtimePolicy";
import type { RideRealtimeEvent } from "../../src/core/mobility/hooks/useRideRealtime";

function profile(id: string, profileType: ProfileType): Profile {
  return {
    id,
    user_id: "user-1",
    profile_type: profileType,
    display_name: id,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

function event(input: Partial<RideRealtimeEvent> & Pick<RideRealtimeEvent, "type" | "rideId">): RideRealtimeEvent {
  return { timestamp: "2026-01-01T00:00:00Z", ...input };
}

describe("core profile selection policy", () => {
  const personal = profile("personal-1", "personal");
  const business = profile("business-1", "business");

  it("resolves a single matching profile and keeps loading/missing states", () => {
    expect(resolveModuleProfileSelection({ allProfiles: [personal, business], contextualProfile: null, loading: false, type: "personal" })).toMatchObject({ profile: personal, state: "resolved" });
    expect(resolveModuleProfileSelection({ allProfiles: [], contextualProfile: null, loading: true, type: "personal" }).state).toBe("loading");
    expect(resolveModuleProfileSelection({ allProfiles: [], contextualProfile: null, loading: false, type: "personal" }).state).toBe("missing");
  });

  it("requires a matching context when several profiles are available", () => {
    const second = profile("personal-2", "personal");
    expect(resolveModuleProfileSelection({ allProfiles: [personal, second], contextualProfile: personal, loading: false, type: "personal" })).toMatchObject({ profile: personal, state: "resolved" });
    expect(resolveModuleProfileSelection({ allProfiles: [personal, second], contextualProfile: business, loading: false, type: "personal" })).toMatchObject({ profile: null, state: "select" });
  });
});

describe("driver offer realtime policy", () => {
  it("loads only assignments addressed to the current driver", () => {
    expect(resolveDriverOfferRealtimeAction(event({ type: "driver_assigned", rideId: "ride-1", driverProfileId: "driver-1" }), "driver-1", undefined)).toEqual({ kind: "load", rideId: "ride-1" });
    expect(resolveDriverOfferRealtimeAction(event({ type: "driver_assigned", rideId: "ride-1", driverProfileId: "driver-2" }), "driver-1", undefined)).toEqual({ kind: "ignore" });
  });

  it("clears only the current offer when it expires or is cancelled", () => {
    expect(resolveDriverOfferRealtimeAction(event({ type: "expired", rideId: "ride-1" }), "driver-1", "ride-1")).toEqual({ kind: "clear" });
    expect(resolveDriverOfferRealtimeAction(event({ type: "cancelled", rideId: "ride-2" }), "driver-1", "ride-1")).toEqual({ kind: "ignore" });
  });
});
