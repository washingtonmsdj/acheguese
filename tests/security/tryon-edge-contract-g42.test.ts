import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const edge = readFileSync(
  join(root, "supabase/functions/tryon-generate/index.ts"),
  "utf8",
);
const service = readFileSync(
  join(root, "src/core/ai/virtual-tryon/services/tryon.service.ts"),
  "utf8",
);

describe("Try-On Edge contract G42", () => {
  it("never exposes fatal provider or infrastructure errors in a 500 response", () => {
    expect(edge).toContain('console.error("tryon-generate fatal", err)');
    expect(edge).toContain('JSON.stringify({ error: "Internal server error" })');
    expect(edge).not.toContain(
      'JSON.stringify({ error: err instanceof Error ? err.message : "unknown" })',
    );
  });

  it("stores only a public-safe failure message while retaining the real error in server logs", () => {
    expect(edge).toContain("function publicTryOnFailureMessage(error: unknown)");
    expect(edge).toContain('console.error("tryon-generate worker error", err)');
    expect(edge).toContain("error_message: publicTryOnFailureMessage(err)");
    expect(edge).not.toContain(
      "error_message: err instanceof Error ? err.message : String(err)",
    );
  });

  it("checks every authoritative generation-state persistence step", () => {
    expect(edge).toContain("const { error: processingError } = await admin");
    expect(edge).toContain("if (processingError) throw processingError");
    expect(edge).toContain("const { error: progressError } = await admin");
    expect(edge).toContain("if (progressError) throw progressError");
    expect(edge).toContain("const { error: completedError } = await admin");
    expect(edge).toContain("if (completedError) throw completedError");
    expect(edge).toContain("failureStateError");
  });

  it("requires a correlated 202 broker acknowledgement in the client", () => {
    expect(service).toContain("data.ok !== true");
    expect(service).toContain("data.generationId !== generationId");
    expect(service).toContain("data.provider !== 'replicate'");
  });
});
