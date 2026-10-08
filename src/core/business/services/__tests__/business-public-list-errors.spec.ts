import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  descendants: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: { from: mocks.from },
}));
vi.mock("@/core/location", () => ({
  LocationHierarchyReadService: { getDescendantIds: mocks.descendants },
}));
vi.mock("@/core/location/utils", () => ({
  applyTerritoryFilter: vi.fn(),
}));
vi.mock("@/core/profiles/services/ProfileService", () => ({
  profileService: { getProfilesByIds: vi.fn() },
}));
vi.mock("@/core/contact", () => ({
  EntityContactService: {},
}));
vi.mock("@/shared/utils/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn() },
}));

import { BusinessNotFoundError, getBusinessById, getBusinessBySlug, getBusinessDataIdByProfileId, getBusinessesList } from "../business.queries";

function createQuery(result: { data: unknown[] | null; error: Error | null }) {
  const query = {
    select: vi.fn(),
    in: vi.fn(),
    eq: vi.fn(),
    or: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    maybeSingle: vi.fn(),
    then: (
      resolve: (value: typeof result) => unknown,
      reject?: (error: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };
  for (const key of ["select", "in", "eq", "or", "order", "range"] as const) {
    query[key].mockReturnValue(query);
  }
  return query;
}

describe("canonical public Business list read failures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.descendants.mockResolvedValue(["location-1"]);
  });

  it("queries the public view once and preserves a genuinely empty result", async () => {
    const query = createQuery({ data: [], error: null });
    mocks.from.mockReturnValue(query);
    await expect(getBusinessesList()).resolves.toEqual({
      businesses: [],
      nextPage: undefined,
    });
    expect(mocks.from).toHaveBeenCalledTimes(1);
    expect(mocks.from).toHaveBeenCalledWith("public_business_search");
    expect(query.select).toHaveBeenCalledTimes(1);
    expect(query.range).toHaveBeenCalledTimes(1);
    expect(query.order).toHaveBeenLastCalledWith("profile_id", {
      ascending: true,
    });
  });

  it("propagates a PostgREST failure instead of reporting no companies", async () => {
    const outage = new Error("PostgREST unavailable");
    mocks.from.mockReturnValue(createQuery({ data: null, error: outage }));
    await expect(getBusinessesList()).rejects.toBe(outage);
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });

  it("rejects unavailable territorial expansion instead of silently narrowing results", async () => {
    const outage = new Error("Territory hierarchy unavailable");
    const query = createQuery({ data: [], error: null });
    mocks.from.mockReturnValue(query);
    mocks.descendants.mockRejectedValue(outage);
    await expect(
      getBusinessesList({
        filter: { scope: "location", location_id: "location-1" },
      }),
    ).rejects.toBe(outage);
    expect(query.range).not.toHaveBeenCalled();
  });

  it("distinguishes a confirmed missing ID from a failed lookup", async () => {
    const query = createQuery({ data: [], error: null });
    query.maybeSingle.mockResolvedValue({ data: null, error: null });
    mocks.from.mockReturnValue(query);
    await expect(
      getBusinessById("00000000-0000-4000-8000-000000000001"),
    ).rejects.toBeInstanceOf(BusinessNotFoundError);

    const outage = new Error("backend unavailable");
    query.maybeSingle.mockResolvedValue({ data: null, error: outage });
    await expect(
      getBusinessById("00000000-0000-4000-8000-000000000001"),
    ).rejects.not.toBeInstanceOf(BusinessNotFoundError);
  });

  it("returns null only for absent slugs and propagates resolver outages", async () => {
    const query = createQuery({ data: [], error: null });
    query.maybeSingle.mockResolvedValue({ data: null, error: null });
    mocks.from.mockReturnValue(query);
    await expect(getBusinessBySlug("empresa-teste")).resolves.toBeNull();

    const outage = new Error("service unavailable");
    query.maybeSingle.mockResolvedValue({ data: null, error: outage });
    await expect(getBusinessBySlug("empresa-teste")).rejects.toBe(outage);
  });

  it("separates a missing Business Data identity from a failed lookup", async () => {
    const query = createQuery({ data: [], error: null });
    mocks.from.mockReturnValue(query);
    await expect(
      getBusinessDataIdByProfileId("00000000-0000-4000-8000-000000000001"),
    ).resolves.toBeNull();

    const unavailable = new Error("Identity resolver unavailable");
    mocks.from.mockReturnValue(createQuery({ data: null, error: unavailable }));
    await expect(
      getBusinessDataIdByProfileId("00000000-0000-4000-8000-000000000001"),
    ).rejects.toBe(unavailable);
  });

  it("propagates a transport exception raised before the read", async () => {
    const outage = new Error("network down");
    mocks.from.mockImplementation(() => { throw outage; });
    await expect(getBusinessesList()).rejects.toBe(outage);
  });
});
