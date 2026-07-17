import { describe, expect, it } from "vitest";
import { analyzeSourceText, groupAccessCounts } from "../../scripts/core-platform/access-analyzer.mjs";

describe("core platform access analyzer", () => {
  it("classifies static table reads and writes", () => {
    const records = analyzeSourceText(
      `
        const read = db.from("posts").select("id");
        const write = db.from<Row>("posts").update({ content: "ok" }).eq("id", id);
      `,
      "src/example.ts",
    );

    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "table", resource: "posts", access: "read" }),
        expect.objectContaining({ kind: "table", resource: "posts", access: "write" }),
      ]),
    );
  });

  it("separates storage, RPC and realtime channels", () => {
    const records = analyzeSourceText(
      `
        supabase.storage.from("avatars").upload(path, file);
        supabase.rpc("create_notification", payload);
        supabase.channel(\`notifications:\${userId}\`).subscribe();
      `,
      "src/example.ts",
    );

    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "storage", resource: "avatars", access: "write" }),
        expect.objectContaining({ kind: "rpc", resource: "create_notification" }),
        expect.objectContaining({ kind: "dynamic-channel", access: "connect" }),
      ]),
    );
  });

  it("does not mistake JavaScript Array.from calls for database access", () => {
    const records = analyzeSourceText(
      `
        const ids = Array.from(values);
        const bytes = Uint8Array.from(rawData);
        const buffer = Buffer.from(text);
      `,
      "src/example.ts",
    );

    expect(records.filter((record) => record.kind.includes("table"))).toEqual([]);
  });

  it("unwraps casted static resource names", () => {
    const records = analyzeSourceText(
      `db.from("community_memberships" as never).select("id");`,
      "src/example.ts",
    );

    expect(records).toContainEqual(
      expect.objectContaining({
        kind: "table",
        resource: "community_memberships",
        access: "read",
      }),
    );
  });

  it("tracks legacy interaction imports and feed aliases", () => {
    const records = analyzeSourceText(
      `
        import { interactionService } from "@/core/interaction/services";
        export { postService as feedService } from "./PostService";
      `,
      "src/example.ts",
    );

    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "legacy-interaction-import" }),
        expect.objectContaining({ kind: "feed-service-alias" }),
      ]),
    );
  });

  it("groups callsites without depending on line numbers", () => {
    const grouped = groupAccessCounts(
      analyzeSourceText(
        `
          db.from("posts").select("id");
          db.from("posts").select("content");
        `,
        "src/example.ts",
      ),
    );

    expect(grouped).toContainEqual(
      expect.objectContaining({
        kind: "table",
        resource: "posts",
        access: "read",
        file: "src/example.ts",
        count: 2,
      }),
    );
  });
});
