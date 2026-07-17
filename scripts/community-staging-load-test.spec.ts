import { describe, expect, it } from "vitest";

import {
  percentile,
  summarize,
  validateStagingTarget,
} from "./community-staging-load-test.mjs";

describe("community staging load harness", () => {
  it("accepts only the explicitly declared Supabase staging PostgREST host", () => {
    expect(
      validateStagingTarget(
        "https://stagingref.supabase.co/rest/v1/posts?select=id&limit=20",
        "stagingref",
      ).pathname,
    ).toBe("/rest/v1/posts");

    expect(() =>
      validateStagingTarget(
        "https://productionref.supabase.co/rest/v1/posts?select=id",
        "stagingref",
      ),
    ).toThrow(/declared staging project/);
    expect(() =>
      validateStagingTarget(
        "https://stagingref.supabase.co/functions/v1/community-rpc",
        "stagingref",
      ),
    ).toThrow(/read-only PostgREST/);
  });

  it("calculates deterministic latency percentiles and error rate", () => {
    const summary = summarize(
      [
        { durationMs: 10, ok: true, status: 200 },
        { durationMs: 20, ok: true, status: 200 },
        { durationMs: 30, ok: true, status: 200 },
        { durationMs: 40, ok: false, status: 503 },
      ],
      2,
    );

    expect(percentile([10, 20, 30, 40], 95)).toBe(40);
    expect(summary).toMatchObject({
      error_rate_percent: 25,
      p50_ms: 20,
      p95_ms: 40,
      p99_ms: 40,
      requests_per_second: 2,
      successful_requests: 3,
      total_requests: 4,
    });
  });
});
