import { describe, expect, it } from "vitest";
import {
  buildIncrementalBaseline,
  validateManifestAgainstRecords,
} from "../../scripts/validate-core-platform-ownership.mjs";

const EXISTING_PATH = "scripts/core-platform/access-analyzer.mjs";

function createManifest(overrides = {}) {
  return {
    schemaVersion: 1,
    sourceRoots: ["src"],
    controlledTables: [
      {
        name: "posts",
        status: "canonical",
        currentOwner: "src/core/posts",
        targetOwner: "src/core/posts",
        allowedReaders: [],
        allowedWriters: [{ path: EXISTING_PATH, maxCalls: 1 }],
      },
    ],
    controlledRpcs: [],
    incrementalBaseline: [],
    ...overrides,
  };
}

function groupedRecord(overrides = {}) {
  return {
    kind: "table",
    resource: "posts",
    access: "write",
    file: EXISTING_PATH,
    count: 1,
    lines: [10],
    details: [],
    ...overrides,
  };
}

describe("core platform ownership validator", () => {
  it("accepts the declared owner within its call budget", () => {
    const result = validateManifestAgainstRecords(
      createManifest(),
      [groupedRecord()],
      process.cwd(),
    );

    expect(result.violations).toEqual([]);
    expect(result.improvements).toEqual([]);
  });

  it("blocks an undeclared writer", () => {
    const result = validateManifestAgainstRecords(
      createManifest(),
      [
        groupedRecord(),
        groupedRecord({
          file: "scripts/validate-core-platform-ownership.mjs",
        }),
      ],
      process.cwd(),
    );

    expect(result.violations.join("\n")).toContain("novo acesso nao autorizado");
  });

  it("blocks growth inside an allowlisted file", () => {
    const result = validateManifestAgainstRecords(
      createManifest(),
      [groupedRecord({ count: 2 })],
      process.cwd(),
    );

    expect(result.violations.join("\n")).toContain("aumentou de 1 para 2");
  });

  it("reports removed legacy access as an improvement", () => {
    const result = validateManifestAgainstRecords(
      createManifest(),
      [],
      process.cwd(),
    );

    expect(result.violations).toEqual([]);
    expect(result.improvements.join("\n")).toContain("acesso legado removido");
  });

  it("builds a baseline only for guarded incremental categories", () => {
    const baseline = buildIncrementalBaseline([
      groupedRecord({
        kind: "dynamic-channel",
        resource: "<dynamic>",
        access: "connect",
      }),
      groupedRecord(),
    ]);

    expect(baseline).toHaveLength(1);
    expect(baseline[0]).toEqual(
      expect.objectContaining({
        kind: "dynamic-channel",
        path: EXISTING_PATH,
        maxCalls: 1,
      }),
    );
  });

  it("rejects manifest callsites that no longer exist", () => {
    const manifest = createManifest({
      controlledTables: [
        {
          name: "posts",
          status: "canonical",
          currentOwner: "src/core/posts",
          targetOwner: "src/core/posts",
          allowedReaders: [],
          allowedWriters: [{ path: "src/does-not-exist.ts", maxCalls: 1 }],
        },
      ],
    });

    const result = validateManifestAgainstRecords(manifest, [], process.cwd());

    expect(result.violations.join("\n")).toContain("Caminho declarado nao existe");
  });
});
