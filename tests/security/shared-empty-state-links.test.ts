import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const emptyState = readFileSync("src/shared/components/EmptyState.tsx", "utf8");

describe("shared EmptyState link safety", () => {
  it("validates dynamic action href values through SafeLink", () => {
    expect(emptyState).toContain(
      'import { SafeLink } from "@/shared/components/security/SafeLink";',
    );
    expect(emptyState).toContain("<SafeLink href={action.href} allowInternal>");
    expect(emptyState).not.toContain("<a href={action.href}>");
  });
});
