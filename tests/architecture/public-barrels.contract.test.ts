import { describe, expect, it } from "vitest";

import * as MobilityModule from "@/modules/mobility";

describe("public barrels contract", () => {
  it("mobility barrel exports delivery proof related API", () => {
    expect(MobilityModule).toHaveProperty("useMotoboy");
    expect(MobilityModule).toHaveProperty("useDelivery");
  });
});

