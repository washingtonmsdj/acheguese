import { FunctionsHttpError } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { readSupabaseFunctionHttpErrorBody } from "./functionErrors";

describe("readSupabaseFunctionHttpErrorBody", () => {
  it("reads the JSON body from a Supabase FunctionsHttpError response", async () => {
    const response = new Response(JSON.stringify({ error: "not_allowed" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
    const error = new FunctionsHttpError(response);

    await expect(readSupabaseFunctionHttpErrorBody(error)).resolves.toEqual({
      error: "not_allowed",
    });
  });

  it("returns null for non-HTTP Supabase function errors", async () => {
    await expect(
      readSupabaseFunctionHttpErrorBody(new Error("network failed")),
    ).resolves.toBeNull();
  });

  it("returns null when the HTTP response body is not valid JSON", async () => {
    const response = new Response("not-json", {
      status: 500,
      headers: { "content-type": "text/plain" },
    });
    const error = new FunctionsHttpError(response);

    await expect(readSupabaseFunctionHttpErrorBody(error)).resolves.toBeNull();
  });
});
