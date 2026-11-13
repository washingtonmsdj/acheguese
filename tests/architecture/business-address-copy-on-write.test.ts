import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const mutations = readFileSync(
  "src/core/business/services/business.mutations.ts",
  "utf8",
);
const transactionalMigration = readFileSync(
  "supabase/migrations/20261113080000_business_transactional_address_idempotency.sql",
  "utf8",
);

describe("Business and Address write boundaries", () => {
  it("prepares physical Address data without persisting it in the browser", () => {
    const prepareStart = mutations.indexOf("async function prepareAddressMutation(");
    const prepareEnd = mutations.indexOf("function toBusinessHoursRows(", prepareStart);
    expect(prepareStart).toBeGreaterThanOrEqual(0);
    expect(prepareEnd).toBeGreaterThan(prepareStart);

    const prepareAddress = mutations.slice(prepareStart, prepareEnd);
    expect(prepareAddress).toContain("getAddressById(existingAddressId)");
    expect(prepareAddress).toContain("addressPatch:");
    expect(prepareAddress).not.toContain("createAddress(");
    expect(prepareAddress).not.toContain("updateAddress(");
    expect(prepareAddress).not.toContain("deleteAddress(");
  });

  it("creates Address and switches Business reference inside one broker transaction", () => {
    expect(mutations).toContain("addressPatch: address.addressPatch ?? null");
    expect(mutations).toContain("ProfileRpcService.updateBusiness<BusinessBrokerResult>");
    expect(mutations).not.toContain("cleanupUnattachedAddress");

    expect(transactionalMigration).toContain(
      "private.profile_create_business_address",
    );
    expect(transactionalMigration).toContain(
      "private.profile_execute_business_operation",
    );
    expect(transactionalMigration).toContain(
      "v_address_id := private.profile_create_business_address",
    );
    expect(transactionalMigration).toContain(
      "v_effective_patch := v_effective_patch",
    );
    expect(transactionalMigration).toContain(
      "private.profile_patch_business_data",
    );
    expect(transactionalMigration).toContain(
      "private.business_operation_receipts",
    );
  });
});
