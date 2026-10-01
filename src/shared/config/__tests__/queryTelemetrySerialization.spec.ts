import { describe, expect, it } from "vitest";

import { serializeTelemetryValue } from "../queryTelemetrySerialization";

describe("serializeTelemetryValue", () => {
  it("returns strings for values JSON.stringify does not serialize", () => {
    expect(serializeTelemetryValue(undefined)).toBe("undefined");
    expect(serializeTelemetryValue(() => undefined)).toContain("function");
  });

  it("never throws for non-JSON-safe observability payloads", () => {
    expect(serializeTelemetryValue(1n)).toBe("[unserializable]");

    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(serializeTelemetryValue(circular)).toBe("[unserializable]");
  });

  it("preserves ordinary JSON payloads", () => {
    expect(serializeTelemetryValue(["businesses"])).toBe('["businesses"]');
    expect(serializeTelemetryValue({ ok: true })).toBe('{"ok":true}');
  });
});
