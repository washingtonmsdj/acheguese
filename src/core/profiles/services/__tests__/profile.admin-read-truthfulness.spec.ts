import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  or: vi.fn(),
  limit: vi.fn(),
  order: vi.fn(),
  range: vi.fn(),
  gte: vi.fn(),
  lte: vi.fn(),
  then: vi.fn(),
  trackError: vi.fn(),
  response: { data: [] as unknown, count: 0 as number | null, error: null as unknown },
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: { from: mocks.from },
}));

vi.mock("@/shared/utils/errorTracking", () => ({
  trackError: mocks.trackError,
}));

import {
  getAdminProfilesList,
  getProfilesFiltered,
  getAllProfileIds,
  getTotalProfilesCount,
  getRecentProfiles,
  getProfilesCreatedInPeriod,
} from "../profile.queries";

const readers = [
  { name: "getAdminProfilesList", read: () => getAdminProfilesList(), empty: [] },
  { name: "getProfilesFiltered", read: () => getProfilesFiltered({}), empty: { data: [], total: 0 } },
  { name: "getAllProfileIds", read: () => getAllProfileIds(), empty: [] },
  { name: "getTotalProfilesCount", read: () => getTotalProfilesCount(), empty: 0 },
  { name: "getRecentProfiles", read: () => getRecentProfiles(), empty: [] },
  {
    name: "getProfilesCreatedInPeriod",
    read: () => getProfilesCreatedInPeriod(
      new Date("2026-10-01T00:00:00Z"),
      new Date("2026-10-07T00:00:00Z"),
    ),
    empty: 0,
  },
] as const;

describe("Profile: leituras administrativas distinguem vazio confirmado de indisponibilidade", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.response = { data: [], count: 0, error: null };

    const chain = {
      select: mocks.select,
      eq: mocks.eq,
      or: mocks.or,
      limit: mocks.limit,
      order: mocks.order,
      range: mocks.range,
      gte: mocks.gte,
      lte: mocks.lte,
      then: mocks.then,
    };

    mocks.from.mockReturnValue(chain);
    for (const method of [
      mocks.select,
      mocks.eq,
      mocks.or,
      mocks.limit,
      mocks.order,
      mocks.gte,
      mocks.lte,
    ]) {
      method.mockReturnValue(chain);
    }
    mocks.range.mockImplementation(async () => mocks.response);
    mocks.then.mockImplementation((resolve, reject) =>
      Promise.resolve(mocks.response).then(resolve, reject),
    );
  });

  for (const reader of readers) {
    it(`${reader.name} preserva resultado vazio comprovado`, async () => {
      await expect(reader.read()).resolves.toEqual(reader.empty);
      expect(mocks.from).toHaveBeenCalledWith("profiles");
      expect(mocks.trackError).not.toHaveBeenCalled();
    });

    it(`${reader.name} propaga erro PostgREST sem fabricar resultado zerado`, async () => {
      const error = { code: "PGRST301", message: "credential unavailable" };
      mocks.response = { data: null, count: null, error };

      await expect(reader.read()).rejects.toBe(error);
      expect(mocks.trackError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          component: "profile.queries",
          action: reader.name,
        }),
      );
    });
  }

  it("getAdminProfilesList preserva o mapper existente para resultados reais", async () => {
    mocks.response = {
      data: [{
        id: "profile-1",
        name: "Perfil Um",
        username: "perfil-um",
        avatar_url: null,
        verified: true,
        is_suspended: false,
        created_at: "2026-10-07T00:00:00Z",
        profile_type: "personal",
      }],
      count: 1,
      error: null,
    };
    await expect(getAdminProfilesList()).resolves.toEqual([
      {
        id: "profile-1",
        name: "Perfil Um",
        username: "perfil-um",
        avatarUrl: null,
        verified: true,
        suspended: false,
        createdAt: "2026-10-07T00:00:00Z",
        profileType: "personal",
      },
    ]);
  });

  it("getProfilesFiltered preserva lista e total reais", async () => {
    const rows = [{ id: "profile-1" }];
    mocks.response = { data: rows, count: 27, error: null };

    await expect(getProfilesFiltered({ page: 2, limit: 5 })).resolves.toEqual({
      data: rows,
      total: 27,
    });
    expect(mocks.range).toHaveBeenCalledWith(5, 9);
  });

  it("getAllProfileIds devolve somente IDs reais", async () => {
    mocks.response = { data: [{ id: "profile-1" }, { id: "profile-2" }], count: 2, error: null };

    await expect(getAllProfileIds()).resolves.toEqual(["profile-1", "profile-2"]);
  });

  it("getTotalProfilesCount nao confunde um total real com erro", async () => {
    mocks.response = { data: null, count: 32, error: null };

    await expect(getTotalProfilesCount()).resolves.toBe(32);
  });

  it("getRecentProfiles preserva a colecao e o limite aplicados pelo owner", async () => {
    const rows = [{ id: "profile-1", name: "Perfil Um", created_at: "2026-10-07T00:00:00Z" }];
    mocks.response = { data: rows, count: 1, error: null };

    await expect(getRecentProfiles(4)).resolves.toBe(rows);
    expect(mocks.limit).toHaveBeenCalledWith(4);
  });

  it("getProfilesCreatedInPeriod retorna contagem valida do periodo", async () => {
    mocks.response = { data: null, count: 7, error: null };

    await expect(getProfilesCreatedInPeriod(
      new Date("2026-10-01T00:00:00Z"),
      new Date("2026-10-07T00:00:00Z"),
    )).resolves.toBe(7);
    expect(mocks.gte).toHaveBeenCalledWith("created_at", "2026-10-01T00:00:00.000Z");
    expect(mocks.lte).toHaveBeenCalledWith("created_at", "2026-10-07T00:00:00.000Z");
  });

  it("getTotalProfilesCount propaga erro de transporte e nao mascara contagem", async () => {
    const failure = new Error("profiles network timeout");
    mocks.then.mockImplementationOnce((resolve, reject) =>
      Promise.reject(failure).then(resolve, reject),
    );

    await expect(getTotalProfilesCount()).rejects.toBe(failure);
    expect(mocks.trackError).toHaveBeenCalledWith(
      failure,
      expect.objectContaining({ action: "getTotalProfilesCount" }),
    );
  });
});
