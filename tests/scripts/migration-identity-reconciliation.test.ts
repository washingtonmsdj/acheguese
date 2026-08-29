import { describe, expect, it } from "vitest";

import {
  findDuplicateLocalVersions,
  normalizeMigrationSqlForIdentity,
  parseLocalMigrationFileName,
  reconcileMigrationIdentities,
} from "../../tools/migrations/migration-identity-reconciliation.mjs";

describe("migration identity reconciliation", () => {
  it("parses canonical migration filenames", () => {
    expect(
      parseLocalMigrationFileName("20260829192000_harden_moderation_table_authority.sql"),
    ).toEqual({
      version: "20260829192000",
      name: "harden_moderation_table_authority",
      fileName: "20260829192000_harden_moderation_table_authority.sql",
    });
    expect(parseLocalMigrationFileName("README.md")).toBeNull();
  });

  it("normalizes comment-only documentation without weakening SQL text", () => {
    expect(
      normalizeMigrationSqlForIdentity("-- docs\nBEGIN;\n\n  SELECT 1;\n-- tail\nCOMMIT;\n"),
    ).toBe("BEGIN;\n  SELECT 1;\nCOMMIT;");
  });

  it("detects duplicate local timestamps", () => {
    expect(
      findDuplicateLocalVersions([
        { version: "20260825220500", fileName: "20260825220500_a.sql" },
        { version: "20260825220500", fileName: "20260825220500_b.sql" },
        { version: "20260825220600", fileName: "20260825220600_c.sql" },
      ]),
    ).toEqual([
      {
        version: "20260825220500",
        files: ["20260825220500_a.sql", "20260825220500_b.sql"],
      },
    ]);
  });

  it("classifies exact parity and a content-proven version alias", () => {
    const result = reconcileMigrationIdentities(
      [
        {
          version: "20260829190000",
          name: "exact_change",
          fileName: "20260829190000_exact_change.sql",
          sql: "SELECT 1;\n",
        },
        {
          version: "20260829192000",
          name: "aliased_change",
          fileName: "20260829192000_aliased_change.sql",
          sql: "-- local docs\nBEGIN;\nSELECT 2;\nCOMMIT;\n",
        },
      ],
      [
        {
          version: "20260829190000",
          name: "exact_change",
          statements: ["SELECT 1;\n"],
        },
        {
          version: "20260829192526",
          name: "aliased_change",
          statements: ["BEGIN;\nSELECT 2;\nCOMMIT;"],
        },
      ],
    );

    expect(result.exact).toHaveLength(1);
    expect(result.aliases).toHaveLength(1);
    expect(result.aliases[0].local.version).toBe("20260829192000");
    expect(result.aliases[0].remote.version).toBe("20260829192526");
    expect(result.conflicts).toEqual([]);
    expect(result.localOnly).toEqual([]);
    expect(result.remoteOnly).toEqual([]);
  });

  it("fails closed when equal names have different SQL", () => {
    const result = reconcileMigrationIdentities(
      [
        {
          version: "20260829192000",
          name: "same_name",
          fileName: "20260829192000_same_name.sql",
          sql: "SELECT 1;",
        },
      ],
      [
        {
          version: "20260829192526",
          name: "same_name",
          statements: ["SELECT 2;"],
        },
      ],
    );

    expect(result.aliases).toEqual([]);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].kind).toBe("name_content_mismatch");
    expect(result.remoteOnly).toHaveLength(1);
  });

  it("fails closed when one remote name is ambiguous", () => {
    const result = reconcileMigrationIdentities(
      [
        {
          version: "20260829192000",
          name: "ambiguous",
          fileName: "20260829192000_ambiguous.sql",
          sql: "SELECT 1;",
        },
      ],
      [
        { version: "20260829192526", name: "ambiguous", statements: ["SELECT 1;"] },
        { version: "20260829192527", name: "ambiguous", statements: ["SELECT 1;"] },
      ],
    );

    expect(result.aliases).toEqual([]);
    expect(result.localOnly).toHaveLength(1);
    expect(result.conflicts.some((entry) => entry.kind === "ambiguous_remote_name")).toBe(true);
    expect(result.remoteOnly).toHaveLength(2);
  });
});
