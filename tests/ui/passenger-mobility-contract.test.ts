import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

const activeRideCard = read(
  "src/modules/mobility/components/passenger/ActiveRideCard.tsx",
);
const operationalPinCard = read(
  "src/modules/mobility/components/passenger/OperationalPinCard.tsx",
);
const driverInfo = read(
  "src/modules/mobility/components/passenger/ride-card/DriverInfo.tsx",
);
const rateDriverModal = read(
  "src/modules/mobility/components/passenger/RateDriverModal.tsx",
);
const completionModal = read(
  "src/modules/mobility/components/passenger/RideCompletionConfirmation.tsx",
);

describe("passenger mobility contract", () => {
  it("fails closed when operational PIN status cannot be established", () => {
    expect(operationalPinCard).toContain(
      "getVerificationStatusSummaryResult",
    );
    expect(operationalPinCard).toContain("loadError");
    expect(operationalPinCard).toContain(
      "Verificação de segurança indisponível",
    );
    expect(operationalPinCard).not.toContain(
      "getVerificationStatusSummary(rideId)",
    );
  });

  it("does not fabricate driver rating or ride-count data", () => {
    expect(activeRideCard).toContain("rating: ride.driver.rating ?? null");
    expect(activeRideCard).not.toContain("rating: ride.driver.rating || 0");
    expect(activeRideCard).not.toContain("total_rides: 0");
    expect(driverInfo).toContain("hasRating");
    expect(driverInfo).toContain("hasRideCount");
    expect(driverInfo).not.toContain("safeRating");
  });

  it("turns passenger contact and map controls into real guarded actions", () => {
    expect(activeRideCard).toContain("useAppUrls");
    expect(activeRideCard).toContain("navigate(appUrls.messages)");
    expect(activeRideCard).toContain("driverProfileId && viewPolicy.showLiveMap");
    expect(activeRideCard).toContain("phone: ride.driver.phone ?? null");
    expect(activeRideCard).toContain("avatar_url: ride.driver.profile?.avatar_url ?? null");
  });

  it("keeps rating open while submission is pending and only closes after a non-failed result", () => {
    expect(rateDriverModal).toContain("await onRate");
    expect(rateDriverModal).toContain("result.success === false");
    expect(rateDriverModal).toContain("submitting");
    expect(rateDriverModal).toContain(
      'ride?.driver?.name?.trim() || "Motorista"',
    );
  });

  it("requires explicit command success before closing completion or report flows", () => {
    expect(completionModal).toContain("await onConfirm(ride.id)");
    expect(completionModal).toContain("await onReportProblem(ride.id, problem)");
    expect(completionModal.match(/result\.success !== true/g)?.length).toBe(2);
    expect(completionModal).toContain("displayedPrice = ride.final_price ?? ride.suggested_price ?? null");
  });
});
