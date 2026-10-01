import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("OrdaX integration boundary", () => {
  const contracts = read("src/integrations/ordax/contracts.ts");
  const readme = read("src/integrations/ordax/README.md");
  const messagingRegistry = read(
    "src/core/messaging/providers/messagingProviderRegistry.ts",
  );

  it("models Profile -> Space without exposing token material", () => {
    expect(contracts).toContain("achegueseProfileId");
    expect(contracts).toContain("ordaxSpaceId");
    expect(contracts).not.toMatch(/accessToken|refreshToken|service[_-]?role/i);
  });

  it("keeps OAuth completion and secrets server-owned", () => {
    expect(readme).toContain("OAuth");
    expect(readme).toContain("secret owner server-side");
    expect(readme).not.toContain('from "@supabase/supabase-js"');
    expect(readme).not.toContain("createClient(");
  });

  it("does not register a fake OrdaX messaging provider before backend certification", () => {
    expect(messagingRegistry).not.toContain("OrdaxMessagingProvider");
    expect(messagingRegistry).not.toMatch(/ordax\s*:/i);
  });

  it("forbids cross-database coupling and message dual-write", () => {
    expect(readme).toContain("não contém cliente Supabase da OrdaX");
    expect(readme).toContain("não houver dual-write de mensagens");
  });
});
