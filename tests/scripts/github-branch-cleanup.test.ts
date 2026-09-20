import { describe, expect, it } from "vitest";
import {
  classifyBranch,
  loadAuditedSupersededHeads,
} from "../../tools/github/cleanup-merged-branches.mjs";

function classify(overrides: Record<string, unknown> = {}) {
  return classifyBranch({
    name: "feature/example",
    sha: "abc123",
    protectedBranch: false,
    baseBranch: "main",
    keepBranches: new Set(["main", "work/mvp-urgent"]),
    openHeadRefs: new Set<string>(),
    exactMergedHeads: new Map<string, Set<string>>(),
    aheadBy: 1,
    ...overrides,
  });
}

describe("GitHub merged branch cleanup policy", () => {
  it("preserves base and explicitly reusable branches", () => {
    expect(classify({ name: "main" })).toEqual({
      action: "preserve",
      reason: "explicit-keep",
    });
    expect(classify({ name: "work/mvp-urgent" })).toEqual({
      action: "preserve",
      reason: "explicit-keep",
    });
  });

  it("preserves protected branches and open pull request heads", () => {
    expect(classify({ protectedBranch: true })).toEqual({
      action: "preserve",
      reason: "protected-branch",
    });
    expect(
      classify({ openHeadRefs: new Set(["feature/example"]) }),
    ).toEqual({
      action: "preserve",
      reason: "open-pull-request",
    });
  });

  it("deletes only an exact current head already merged through a pull request", () => {
    expect(
      classify({
        exactMergedHeads: new Map([
          ["feature/example", new Set(["abc123"])],
        ]),
        aheadBy: null,
      }),
    ).toEqual({
      action: "delete",
      reason: "exact-merged-pr-head",
    });

    expect(
      classify({
        exactMergedHeads: new Map([
          ["feature/example", new Set(["older-sha"])],
        ]),
        aheadBy: 2,
      }),
    ).toEqual({
      action: "preserve",
      reason: "unique-commits",
    });
  });

  it("deletes a branch fully contained in main even without a merged PR match", () => {
    expect(classify({ aheadBy: 0 })).toEqual({
      action: "delete",
      reason: "fully-contained-in-base",
    });
  });

  it("deletes only an exact SHA-pinned audited superseded branch when explicitly supplied", () => {
    const auditedSupersededHeads = new Map([
      ["feature/example", new Set(["abc123"])],
    ]);

    expect(
      classify({ auditedSupersededHeads, aheadBy: 4 }),
    ).toEqual({
      action: "delete",
      reason: "audited-superseded-head",
    });

    expect(
      classify({
        sha: "different-sha",
        auditedSupersededHeads,
        aheadBy: 4,
      }),
    ).toEqual({
      action: "preserve",
      reason: "unique-commits",
    });
  });

  it("loads the repository superseded manifest as exact branch head pins", () => {
    const heads = loadAuditedSupersededHeads(
      "tools/github/branch-cleanup-superseded.json",
    );

    expect(
      heads.get("agent/security-nominatim-runtime-parity"),
    ).toContain("580a3b8ce62aa0df28400ef9edbf673e56756c01");
  });

  it("preserves every branch that still has unique commits", () => {
    expect(classify({ aheadBy: 7 })).toEqual({
      action: "preserve",
      reason: "unique-commits",
    });
    expect(classify({ aheadBy: null })).toEqual({
      action: "preserve",
      reason: "unique-commits",
    });
  });

  it("gives protection and open PR state precedence over merged/contained evidence", () => {
    const exactMergedHeads = new Map([
      ["feature/example", new Set(["abc123"])],
    ]);

    expect(
      classify({ protectedBranch: true, exactMergedHeads, aheadBy: 0 }),
    ).toEqual({
      action: "preserve",
      reason: "protected-branch",
    });

    expect(
      classify({
        openHeadRefs: new Set(["feature/example"]),
        exactMergedHeads,
        aheadBy: 0,
      }),
    ).toEqual({
      action: "preserve",
      reason: "open-pull-request",
    });
  });
});
