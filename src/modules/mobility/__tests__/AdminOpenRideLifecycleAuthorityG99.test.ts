import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G99 admin open ride lifecycle authority", () => {
  const queryService = readProjectFile(
    "src/core/admin/services/MobilityAdminQueryService.ts",
  );

  it("queries map rides through the canonical open-status collection", () => {
    expect(queryService).toContain("QUERYABLE_OPEN_RIDE_STATUSES");
    expect(queryService).toContain('.in("status", QUERYABLE_OPEN_RIDE_STATUSES)');
    expect(queryService).not.toContain("const activeStatuses = [");
  });
});
