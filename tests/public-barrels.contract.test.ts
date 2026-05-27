import { describe, expect, it } from "vitest";

import * as LandingModule from "@/app/features/landing";
import * as LandingServices from "@/app/features/landing/services";
import * as MobilityModule from "@/modules/mobility";

describe("public barrels contract", () => {
  it("landing barrel exports compatibility aliases", () => {
    expect(LandingModule).toHaveProperty("LandingService");
    expect(LandingModule).toHaveProperty("landingService");
    expect(LandingServices).toHaveProperty("LandingService");
    expect(LandingServices).toHaveProperty("landingService");
  });

  it("mobility barrel exports delivery proof related API", () => {
    expect(MobilityModule).toHaveProperty("useMotoboy");
    expect(MobilityModule).toHaveProperty("useDelivery");
  });
});

