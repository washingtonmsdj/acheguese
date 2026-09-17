import { FunctionsHttpError } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import {
  readSupabaseFunctionHttpErrorBody,
  resolveSupabaseFunctionErrorMessage,
} from "./functionErrors";

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

describe("resolveSupabaseFunctionErrorMessage", () => {
  it("prefers the structured error field from an Edge HTTP response", async () => {
    const response = new Response(JSON.stringify({ error: "not_allowed" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
    const error = new FunctionsHttpError(response);

    await expect(resolveSupabaseFunctionErrorMessage(error)).resolves.toBe(
      "not_allowed",
    );
  });

  it("accepts a structured message field", async () => {
    const response = new Response(JSON.stringify({ message: "profile unavailable" }), {
      status: 409,
      headers: { "content-type": "application/json" },
    });
    const error = new FunctionsHttpError(response);

    await expect(resolveSupabaseFunctionErrorMessage(error)).resolves.toBe(
      "profile unavailable",
    );
  });

  it("falls back to the transport error message", async () => {
    await expect(
      resolveSupabaseFunctionErrorMessage(new Error("network failed")),
    ).resolves.toBe("network failed");
  });

  it("returns null when neither the response body nor the error has a message", async () => {
    await expect(resolveSupabaseFunctionErrorMessage({})).resolves.toBeNull();
  });
});
