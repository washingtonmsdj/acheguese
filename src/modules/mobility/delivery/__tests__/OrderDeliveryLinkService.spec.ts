import { describe, expect, it } from "vitest";
import { LOGISTICS_STATUS } from "@/core/mobility/delivery/logistics/types";
import { OrderDeliveryLinkService } from "@/core/mobility/delivery/services/OrderDeliveryLinkService";

describe("OrderDeliveryLinkService mappings", () => {
  it("maps motoboy runtime statuses to canonical logistics statuses", () => {
    expect(OrderDeliveryLinkService.mapRideStatusToLogisticsStatus("requested")).toBe(
      LOGISTICS_STATUS.PENDING,
    );
    expect(OrderDeliveryLinkService.mapRideStatusToLogisticsStatus("driver_assigned")).toBe(
      LOGISTICS_STATUS.ACCEPTED,
    );
    expect(OrderDeliveryLinkService.mapRideStatusToLogisticsStatus("driver_arrived")).toBe(
      LOGISTICS_STATUS.READY_FOR_PICKUP,
    );
    expect(OrderDeliveryLinkService.mapRideStatusToLogisticsStatus("pickup_confirmed")).toBe(
      LOGISTICS_STATUS.PICKED_UP,
    );
    expect(OrderDeliveryLinkService.mapRideStatusToLogisticsStatus("delivered")).toBe(
      LOGISTICS_STATUS.DELIVERED,
    );
    expect(OrderDeliveryLinkService.mapRideStatusToLogisticsStatus("failed_delivery")).toBe(
      LOGISTICS_STATUS.FAILED,
    );
  });

  it("maps canonical logistics statuses back to motoboy runtime statuses", () => {
    expect(OrderDeliveryLinkService.mapLogisticsStatusToRideStatus(LOGISTICS_STATUS.PENDING)).toBe(
      "requested",
    );
    expect(
      OrderDeliveryLinkService.mapLogisticsStatusToRideStatus(LOGISTICS_STATUS.ACCEPTED),
    ).toBe("driver_accepted");
    expect(
      OrderDeliveryLinkService.mapLogisticsStatusToRideStatus(LOGISTICS_STATUS.READY_FOR_PICKUP),
    ).toBe("driver_arriving");
    expect(
      OrderDeliveryLinkService.mapLogisticsStatusToRideStatus(LOGISTICS_STATUS.PICKED_UP),
    ).toBe("pickup_confirmed");
    expect(
      OrderDeliveryLinkService.mapLogisticsStatusToRideStatus(LOGISTICS_STATUS.DELIVERED),
    ).toBe("delivered");
  });
});

describe("OrderDeliveryLinkService transition path", () => {
  it("builds forward path when delivery jumps states", () => {
    const resolveTransitionPath = (OrderDeliveryLinkService as unknown as {
      resolveTransitionPath: (currentStatus: string, targetStatus: string) => string[];
    }).resolveTransitionPath;

    expect(
      resolveTransitionPath(LOGISTICS_STATUS.PENDING, LOGISTICS_STATUS.PICKED_UP),
    ).toEqual([
      LOGISTICS_STATUS.ACCEPTED,
      LOGISTICS_STATUS.PREPARING,
      LOGISTICS_STATUS.READY_FOR_PICKUP,
      LOGISTICS_STATUS.PICKED_UP,
    ]);
  });

  it("blocks reverse path and terminal-state forward writes", () => {
    const resolveTransitionPath = (OrderDeliveryLinkService as unknown as {
      resolveTransitionPath: (currentStatus: string, targetStatus: string) => string[];
    }).resolveTransitionPath;

    expect(
      resolveTransitionPath(LOGISTICS_STATUS.DELIVERED, LOGISTICS_STATUS.PICKED_UP),
    ).toEqual([]);
    expect(
      resolveTransitionPath(LOGISTICS_STATUS.CANCELED, LOGISTICS_STATUS.DELIVERED),
    ).toEqual([]);
    expect(
      resolveTransitionPath(LOGISTICS_STATUS.FAILED, LOGISTICS_STATUS.DELIVERED),
    ).toEqual([]);
  });

  it("allows direct transition to canceled/failed from active states", () => {
    const resolveTransitionPath = (OrderDeliveryLinkService as unknown as {
      resolveTransitionPath: (currentStatus: string, targetStatus: string) => string[];
    }).resolveTransitionPath;

    expect(
      resolveTransitionPath(LOGISTICS_STATUS.PREPARING, LOGISTICS_STATUS.CANCELED),
    ).toEqual([LOGISTICS_STATUS.CANCELED]);
    expect(resolveTransitionPath(LOGISTICS_STATUS.ACCEPTED, LOGISTICS_STATUS.FAILED)).toEqual([
      LOGISTICS_STATUS.FAILED,
    ]);
  });
});
