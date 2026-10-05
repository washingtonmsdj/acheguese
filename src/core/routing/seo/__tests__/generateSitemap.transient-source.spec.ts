import { describe, expect, it } from "vitest";

import { isTransientSitemapSourceError } from "../generateSitemap";

describe("isTransientSitemapSourceError PostgREST schema cache boundary", () => {
  it("classifies PGRST002 schema-cache unavailability as transient", () => {
    expect(
      isTransientSitemapSourceError({
        code: "PGRST002",
        message: "Could not query the database for the schema cache. Retrying.",
        details: null,
        hint: null,
      }),
    ).toBe(true);
  });

  it("recognizes the provider schema-cache outage message even when the code is nested", () => {
    expect(
      isTransientSitemapSourceError({
        message: "request failed",
        cause: {
          code: "PGRST002",
          message: "Could not query the database for the schema cache. Retrying.",
        },
      }),
    ).toBe(true);
  });

  it("does not broaden fallback to arbitrary PostgREST, schema or auth failures", () => {
    expect(
      isTransientSitemapSourceError({
        code: "PGRST100",
        message: "Parsing error in the query string parameter",
      }),
    ).toBe(false);
    expect(
      isTransientSitemapSourceError({
        code: "42501",
        message: "permission denied for table locations",
      }),
    ).toBe(false);
    expect(
      isTransientSitemapSourceError({
        code: "PGRST205",
        message: "Could not find the table in the schema cache",
      }),
    ).toBe(false);
    expect(
      isTransientSitemapSourceError(
        new Error("column geographic_path does not exist"),
      ),
    ).toBe(false);
    expect(isTransientSitemapSourceError(new Error("Invalid API key"))).toBe(false);
  });
});
