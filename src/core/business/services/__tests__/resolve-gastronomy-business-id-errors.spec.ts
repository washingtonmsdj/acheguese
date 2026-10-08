import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resolve: vi.fn(),
}));

vi.mock("@/core/business/services/BusinessService", () => ({
  BusinessService: {
    getBusinessDataIdByProfileId: mocks.resolve,
  },
}));
vi.mock("@/shared/utils/logger", () => ({
  logger: { error: vi.fn() },
}));

import { resolveGastronomyBusinessId } from "../resolveGastronomyBusinessId";

const profileId = "00000000-0000-4000-8000-000000000001";
const businessDataId = "00000000-0000-4000-8000-000000000002";

describe("Gastronomy Business identity adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the resolved canonical Business Data ID", async () => {
    mocks.resolve.mockResolvedValue(businessDataId);
    await expect(resolveGastronomyBusinessId(profileId)).resolves.toBe(businessDataId);
  });

  it("preserves the existing confirmed-not-found identifier contract", async () => {
    mocks.resolve.mockResolvedValue(null);
    await expect(resolveGastronomyBusinessId(profileId)).resolves.toBe(profileId);
  });

  it("never substitutes a profile ID when resolution failed", async () => {
    const unavailable = new Error("Business identity service unavailable");
    mocks.resolve.mockRejectedValue(unavailable);
    await expect(resolveGastronomyBusinessId(profileId)).rejects.toBe(unavailable);
  });
});
