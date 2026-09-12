import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

function sliceBetween(source: string, start: string, end: string): string {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  if (from < 0 || to < 0) return "";
  return source.slice(from, to);
}

const broker = readProjectFile("supabase/functions/mobility-rpc/index.ts");
const mfaPolicy = readProjectFile("supabase/functions/_shared/mfaPolicy.ts");

describe("G84 mobility admin MFA authority", () => {
  it("uses canonical role + MFA authorities for privileged mobility", () => {
    expect(broker).toContain('import { evaluateUserMfaPolicy } from "../_shared/mfaPolicy.ts"');
    expect(broker).toContain('supabaseAdmin.rpc("get_user_roles"');
    expect(broker).not.toContain('supabaseAdmin.rpc("is_admin"');
    expect(broker).toContain("token: string;");
    expect(broker).toContain("token,");
    expect(broker).toContain("async function requireAdminMfa(");

    const adminMfa = sliceBetween(
      broker,
      "async function requireAdminMfa(",
      "async function getRide(",
    );
    expect(adminMfa).toContain("evaluateUserMfaPolicy(");
    expect(adminMfa).toContain("auth.userId");
    expect(adminMfa).toContain("auth.token");
    expect(adminMfa).toContain('mfaPolicy.reason === "enrollment_required"');
    expect(adminMfa).toContain('mfaPolicy.reason === "verification_required"');
    expect(adminMfa).toContain('mfaPolicy.reason === "satisfied"');

    expect(mfaPolicy).toContain("auth.admin.mfa.listFactors");
    expect(mfaPolicy).toContain("getAuthenticatorAssuranceLevel(token)");
  });

  it("requires AAL2 for pure admin mobility commands", () => {
    for (const [start, end] of [
      ["async function handleEnsureAdminDriverProfile(", "async function dispatchAction("],
      ["async function handleAdminRedispatch(", "async function handleUpdateDriverAvailability("],
      ["async function handleUpdateFailedDeliveryResolution(", "async function handleAcceptRide("],
      ["async function handleReconcileStaleDriverAvailability(", "async function handleGetDriverRideHistory("],
    ] as const) {
      const handler = sliceBetween(broker, start, end);
      expect(handler).toContain("await requireAdminMfa(");
    }
  });

  it("keeps participant-owned transitions on the normal path for admin users", () => {
    const rideActor = sliceBetween(
      broker,
      "async function requireRideTransitionActor(",
      "async function requireBoardingVerification(",
    );
    const deliveryActor = sliceBetween(
      broker,
      "async function requireDeliveryTransitionActor(",
      "async function requireDeliveryVerification(",
    );

    expect(rideActor.indexOf("const passengerOwned")).toBeGreaterThan(-1);
    expect(rideActor.indexOf("const driverOwned")).toBeGreaterThan(-1);
    expect(rideActor.indexOf("await requireAdminMfa(")).toBeGreaterThan(
      rideActor.indexOf("const driverOwned"),
    );

    expect(deliveryActor.indexOf("const driverOwned")).toBeGreaterThan(-1);
    expect(deliveryActor.indexOf("await requireAdminMfa(")).toBeGreaterThan(
      deliveryActor.indexOf("const driverOwned"),
    );
  });

  it("uses MFA only for privilege fallback in mixed admin/user commands", () => {
    const accept = sliceBetween(
      broker,
      "async function handleAcceptRide(",
      "async function handleAdminRedispatch(",
    );
    const discovery = sliceBetween(
      broker,
      "async function handleFindAvailableDriversForRide(",
      "async function handleReconcileStaleDriverAvailability(",
    );

    expect(accept).toContain("const ownsDriverProfile = await profileBelongsToUser");
    expect(accept.indexOf("await requireAdminMfa(")).toBeGreaterThan(
      accept.indexOf("const ownsDriverProfile"),
    );

    expect(discovery).toContain("const requesterOwned = await profileBelongsToUser");
    expect(discovery.indexOf("await requireAdminMfa(")).toBeGreaterThan(
      discovery.indexOf("const requesterOwned"),
    );
  });

  it("does not impose admin MFA on self-service presence and location", () => {
    const availability = sliceBetween(
      broker,
      "async function handleUpdateDriverAvailability(",
      "async function handleUpdateDriverLocation(",
    );
    const location = sliceBetween(
      broker,
      "async function handleUpdateDriverLocation(",
      "async function handleListDriverOffers(",
    );
    const offers = sliceBetween(
      broker,
      "async function handleListDriverOffers(",
      "async function handleFindAvailableDriversForRide(",
    );

    expect(availability).not.toContain("requireAdminMfa");
    expect(location).not.toContain("requireAdminMfa");
    expect(offers).not.toContain("requireAdminMfa");
  });
});
