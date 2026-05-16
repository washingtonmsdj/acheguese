import { describe, expect, it } from "vitest";
import { isReservedForEntityType } from "./reserved-names";

describe("communication channel reserved names", () => {
  it("blocks canonical communication route names", () => {
    expect(isReservedForEntityType("comunicacao", "communication_channel")).toBe(true);
    expect(isReservedForEntityType("noticias", "communication_channel")).toBe(true);
    expect(isReservedForEntityType("alertas", "communication_channel")).toBe(true);
    expect(isReservedForEntityType("canais", "communication_channel")).toBe(true);
    expect(isReservedForEntityType("oficial", "communication_channel")).toBe(true);
  });
});
