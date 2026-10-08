import { describe, expect, it } from "vitest";
import {
  fromEventIsoToLocalInput,
  fromLocalInputToEventIso,
} from "../educationEventDateTime";

describe("Education event datetime conversion", () => {
  it("round-trips datetime-local through UTC without shifting the wall time", () => {
    const localValue = "2026-09-04T18:30";
    const iso = fromLocalInputToEventIso(localValue);

    expect(iso).toMatch(/Z$/);
    expect(fromEventIsoToLocalInput(iso)).toBe(localValue);
  });

  it("rejects empty or invalid datetime values", () => {
    expect(() => fromLocalInputToEventIso("")).toThrow(
      "Data/hora local obrigatoria.",
    );
    expect(() => fromLocalInputToEventIso("nao-e-data")).toThrow(
      "Data/hora local invalida.",
    );
    expect(() => fromEventIsoToLocalInput("nao-e-data")).toThrow(
      "Data/hora do evento invalida.",
    );
  });

  it("rejects calendar values that JavaScript would otherwise normalize", () => {
    expect(() => fromLocalInputToEventIso("2026-02-30T10:00")).toThrow(
      "Data/hora local invalida.",
    );
    expect(() => fromLocalInputToEventIso("2026-13-01T10:00")).toThrow(
      "Data/hora local invalida.",
    );
    expect(() => fromLocalInputToEventIso("2026-10-10T24:30")).toThrow(
      "Data/hora local invalida.",
    );
  });
});
