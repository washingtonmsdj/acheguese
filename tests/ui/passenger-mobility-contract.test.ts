import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

const passengerPage = read("src/modules/mobility/pages/PassageiroPage.tsx");
const activeRideCard = read(
  "src/modules/mobility/components/passenger/ActiveRideCard.tsx",
);
const operationalPinCard = read(
  "src/modules/mobility/components/passenger/OperationalPinCard.tsx",
);
const passengerHistory = read(
  "src/modules/mobility/components/passenger/PassengerRideHistory.tsx",
);
const driverInfo = read(
  "src/modules/mobility/components/passenger/ride-card/DriverInfo.tsx",
);
const rideInfo = read(
  "src/modules/mobility/components/passenger/ride-card/RideInfo.tsx",
);
const rateDriverModal = read(
  "src/modules/mobility/components/passenger/RateDriverModal.tsx",
);
const completionModal = read(
  "src/modules/mobility/components/passenger/RideCompletionConfirmation.tsx",
);
const globalConstants = read("src/shared/types/global.constants.ts");

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
    expect(activeRideCard).toContain("onContact?.()");

    expect(passengerPage).not.toContain("<RideTrackingMap");
    expect(passengerPage).not.toContain("isDriverOwnedOpenRideStatus");
    expect(passengerPage).not.toContain("TOAST_OPENING_CHAT");
  });

  it("keeps rating open unless the rating command explicitly succeeds", () => {
    expect(rateDriverModal).toContain("await onRate");
    expect(rateDriverModal).toContain("result.success !== true");
    expect(rateDriverModal).toContain("submitting");
    expect(rateDriverModal).toContain(
      'ride?.driver?.name?.trim() || "Motorista"',
    );
  });

  it("requires explicit command success before closing completion or report flows", () => {
    expect(completionModal).toContain("await onConfirm(ride.id)");
    expect(completionModal).toContain("await onReportProblem(ride.id, problem)");
    expect(completionModal.match(/result\.success !== true/g)?.length).toBe(2);
    expect(completionModal).toContain(
      "displayedPrice = ride.final_price ?? ride.suggested_price ?? null",
    );

    expect(passengerPage).toContain(
      "onConfirm={(rideId: string) => confirmRideCompletion(rideId)}",
    );
    expect(passengerPage).toContain(
      "reportRideProblem(rideId, problem)",
    );
  });

  it("uses lifecycle-aware history filters instead of local cancellation guesses", () => {
    expect(passengerHistory).toContain("isCancelledRideStatus");
    expect(passengerHistory).toContain('ride.type === "delivery"');
    expect(passengerHistory).toContain('ride.ride_mode === "motoboy"');
    expect(passengerHistory).toContain("<StatusBadge status={ride.status}");
    expect(passengerHistory).not.toContain(
      "ride.status !== RIDE_STATUS.CANCELLED",
    );
  });

  it("never fabricates missing passenger-history prices or payment methods", () => {
    expect(passengerHistory).toContain(
      "ride.final_price ?? ride.suggested_price ?? null",
    );
    expect(passengerHistory).not.toContain(
      "ride.final_price || ride.suggested_price || 0",
    );
    expect(passengerHistory).toContain("getPaymentMethodLabel");
    expect(rideInfo).toContain("getPaymentMethodLabel");
    expect(rideInfo).not.toContain('PAYMENT_METHOD.PIX ?');
  });

  it("keeps payment presentation labels in the global payment-method owner", () => {
    expect(globalConstants).toContain("PAYMENT_METHOD_LABELS");
    expect(globalConstants).toContain("getPaymentMethodLabel");
    expect(globalConstants).toContain('card_on_delivery: "Cartão na entrega"');
    expect(globalConstants).toContain('payment_link: "Link de pagamento"');
  });
});
