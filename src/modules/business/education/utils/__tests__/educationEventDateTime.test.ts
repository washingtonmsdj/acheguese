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
});
