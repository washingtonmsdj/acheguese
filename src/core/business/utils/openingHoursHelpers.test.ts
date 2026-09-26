import { afterEach, describe, expect, it, vi } from "vitest";

import type { BusinessHours } from "@/core/business/types";
import {
  getNextOpeningTime,
  getOpeningStatus,
  isOpenNow,
} from "@/core/business/utils/openingHoursHelpers";

const overnightSchedule: BusinessHours = {
  sexta: { open: "18:00", close: "02:00" },
  sabado: { open: "18:00", close: "02:00" },
  domingo: { open: "10:00", close: "18:00" },
};

describe("openingHoursHelpers", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps a business open after midnight when the previous day closes later", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 26, 1, 0, 0));

    expect(isOpenNow(overnightSchedule)).toBe(true);
    expect(getOpeningStatus(overnightSchedule)).toEqual({
      isOpen: true,
      message: "Aberto agora",
      nextChange: "Fecha às 02:00",
    });
  });

  it("does not reuse an opening time from earlier on the same day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 27, 19, 0, 0));

    const schedule: BusinessHours = {
      domingo: { open: "09:00", close: "18:00" },
      segunda: { open: "08:00", close: "17:00" },
    };

    expect(isOpenNow(schedule)).toBe(false);
    expect(getNextOpeningTime(schedule)).toBe("Abre amanhã às 08:00");
  });

  it("reports today's upcoming opening while it is still ahead", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 27, 8, 0, 0));

    const schedule: BusinessHours = {
      domingo: { open: "09:00", close: "18:00" },
    };

    expect(getOpeningStatus(schedule)).toEqual({
      isOpen: false,
      message: "Fechado agora",
      nextChange: "Abre às 09:00",
    });
  });
});
