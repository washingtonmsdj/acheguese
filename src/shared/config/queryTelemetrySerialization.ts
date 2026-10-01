/**
 * Serialization boundary for observability only.
 *
 * Telemetry must never be able to fail a successful query/mutation. JSON.stringify
 * legitimately returns undefined for values such as undefined/functions and throws
 * for circular references or BigInt. Callers always receive a string.
 */
export function serializeTelemetryValue(value: unknown): string {
  try {
    const serialized = JSON.stringify(value);
    if (typeof serialized === "string") {
      return serialized;
    }

    return value === undefined ? "undefined" : String(value);
  } catch {
    return "[unserializable]";
  }
}
