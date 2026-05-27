import { describe, expect, it } from "vitest";

import { resolveFamilyLocationPresence } from "@/core/family/utils/familyLocationStatus";

describe("resolveFamilyLocationPresence", () => {
  const now = new Date("2026-04-09T12:00:00.000Z");

  it("retorna offline quando nao existe localizacao", () => {
    expect(resolveFamilyLocationPresence(null, now)).toEqual({
      status: "offline",
      minutesSinceUpdate: null,
    });
  });

  it("retorna online para atualizacao com menos de 5 minutos", () => {
    expect(
      resolveFamilyLocationPresence(
        {
          latitude: -12.9,
          longitude: -38.5,
          accuracy: 12,
          timestamp: "2026-04-09T11:57:00.000Z",
        },
        now,
      ),
    ).toEqual({
      status: "online",
      minutesSinceUpdate: 3,
    });
  });

  it("retorna away entre 5 e 29 minutos", () => {
    expect(
      resolveFamilyLocationPresence(
        {
          latitude: -12.9,
          longitude: -38.5,
          accuracy: 12,
          timestamp: "2026-04-09T11:40:00.000Z",
        },
        now,
      ),
    ).toEqual({
      status: "away",
      minutesSinceUpdate: 20,
    });
  });

  it("retorna offline a partir de 30 minutos", () => {
    expect(
      resolveFamilyLocationPresence(
        {
          latitude: -12.9,
          longitude: -38.5,
          accuracy: 12,
          timestamp: "2026-04-09T11:00:00.000Z",
        },
        now,
      ),
    ).toEqual({
      status: "offline",
      minutesSinceUpdate: 60,
    });
  });

  it("prioriza updated_at quando disponivel", () => {
    expect(
      resolveFamilyLocationPresence(
        {
          latitude: -12.9,
          longitude: -38.5,
          accuracy: 12,
          timestamp: "2026-04-09T11:00:00.000Z",
          updated_at: "2026-04-09T11:58:00.000Z",
        },
        now,
      ),
    ).toEqual({
      status: "online",
      minutesSinceUpdate: 2,
    });
  });

  it("trata data invalida como offline", () => {
    expect(
      resolveFamilyLocationPresence(
        {
          latitude: -12.9,
          longitude: -38.5,
          accuracy: 12,
          timestamp: "data-invalida",
        },
        now,
      ),
    ).toEqual({
      status: "offline",
      minutesSinceUpdate: null,
    });
  });
});
