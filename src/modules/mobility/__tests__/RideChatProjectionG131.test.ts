import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G131 ride chat projections", () => {
  const queries = readProjectFile("src/core/mobility/services/chat.queries.ts");

  it("never restores select star for ride chat reads", () => {
    expect(queries).not.toContain('select("*")');
  });

  it("keeps the ride chat projection explicit", () => {
    expect(queries).toContain(
      'const RIDE_CHAT_SELECT = "id, ride_id, created_at, updated_at"',
    );
  });

  it("keeps the message projection explicit and ordered", () => {
    expect(queries).toContain(
      '"id, chat_id, sender_profile_id, message, is_system_message, read_at, created_at"',
    );
    expect(queries).toContain('.order("created_at", { ascending: true })');
  });
});
