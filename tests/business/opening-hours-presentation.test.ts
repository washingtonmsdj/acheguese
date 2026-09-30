import { describe, expect, it } from "vitest";
import {
  getScheduleError,
  getSchedulePreview,
} from "@/core/business/utils/openingHoursPresentation";

describe("opening hours presentation", () => {
  it("keeps unknown and closed distinct", () => {
    expect(getSchedulePreview()).toBe("Não informado");
    expect(getSchedulePreview({ closed: true })).toBe("Fechado");
    expect(getScheduleError({ closed: true })).toBeNull();
  });
  it.each([
    { open: "", close: "18:00" },
    { open: "25:00", close: "18:00" },
    { open: "09:60", close: "18:00" },
    { open: "09:00", close: "09:00" },
  ])("does not publish invalid intervals in the preview: %j", (schedule) => {
    expect(getScheduleError(schedule)).not.toBeNull();
    expect(getSchedulePreview(schedule)).toBe("Em edição");
  });
  it("previews valid times without guessing an open-now status", () => {
    expect(getScheduleError({ open: "09:00", close: "18:00" })).toBeNull();
    expect(getSchedulePreview({ open: "09:00", close: "18:00" })).toBe(
      "09:00 – 18:00",
    );
  });
});
