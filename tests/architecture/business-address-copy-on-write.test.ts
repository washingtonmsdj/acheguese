import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const mutations = readFileSync(
  "src/core/business/services/business.mutations.ts",
  "utf8",
);

describe("Business and Address write boundaries", () => {
  it("never mutates an existing physical Address before Business RPC commit", () => {
    const syncStart = mutations.indexOf("async function syncAddress(");
    const syncEnd = mutations.indexOf("function toBusinessHoursRows(", syncStart);
    expect(syncStart).toBeGreaterThanOrEqual(0);
    expect(syncEnd).toBeGreaterThan(syncStart);

    const syncAddress = mutations.slice(syncStart, syncEnd);
    expect(syncAddress).not.toContain("addressService.updateAddress(");
    expect(syncAddress).toContain("addressService.createAddress({");
    expect(syncAddress).toContain("owner_user_id: actorUserId");
    expect(syncAddress).toContain("getAddressById(existingAddressId)");
  });

  it("changes Business address reference only through canonical broker", () => {
    const updateStart = mutations.indexOf("export async function updateBusiness(");
    const updateEnd = mutations.indexOf("export async function deleteBusiness(", updateStart);
    const update = mutations.slice(updateStart, updateEnd);

    expect(update).toContain("ProfileRpcService.updateBusiness<BusinessBrokerResult>");
    expect(update).toContain("createdAddressId = address.addressId");
    expect(update).toContain("cleanupUnattachedAddress(createdAddressId)");
    expect(update).not.toContain("AddressService().updateAddress");
  });
});
