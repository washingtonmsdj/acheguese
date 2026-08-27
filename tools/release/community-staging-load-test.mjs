import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CONFIRMATION = "STAGING_ONLY_CONFIRMED";
const DEFAULT_DURATION_SECONDS = 15;
const DEFAULT_CONCURRENCY = 10;
const MAX_DURATION_SECONDS = 300;
const MAX_CONCURRENCY = 500;

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function percentile(sortedValues, percentileValue) {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(
    sortedValues.length - 1,
    Math.ceil((percentileValue / 100) * sortedValues.length) - 1,
  );
  return sortedValues[Math.max(0, index)];
}

export function validateStagingTarget(rawUrl, stagingProjectRef) {
  const target = new URL(rawUrl);
  const expectedHost = `${stagingProjectRef}.supabase.co`;

  if (target.protocol !== "https:" || target.hostname !== expectedHost) {
    throw new Error(
      `Target must be HTTPS on the declared staging project: ${expectedHost}`,
    );
  }
  if (!target.pathname.startsWith("/rest/v1/")) {
    throw new Error("Only read-only PostgREST staging targets are accepted");
  }
  return target;
}

function boundedInteger(name, fallback, minimum, maximum) {
  const raw = process.env[name];
  const value = raw ? Number(raw) : fallback;
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(
      `${name} must be an integer between ${minimum} and ${maximum}`,
    );
  }
  return value;
}

async function executeRequest(target, apiKey) {
  const startedAt = performance.now();
  try {
    const response = await fetch(target, {
      headers: {
        Accept: "application/json",
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
      method: "GET",
    });
    await response.arrayBuffer();
    return {
      durationMs: performance.now() - startedAt,
      ok: response.ok,
      status: response.status,
    };
  } catch {
    return {
      durationMs: performance.now() - startedAt,
      ok: false,
      status: 0,
    };
  }
}

export async function runLoadTest({
  apiKey,
  concurrency,
  durationSeconds,
  target,
}) {
  const deadline = performance.now() + durationSeconds * 1000;
  const results = [];

  async function worker() {
    while (performance.now() < deadline) {
      results.push(await executeRequest(target, apiKey));
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

export function summarize(results, elapsedSeconds) {
  const durations = results
    .map((result) => result.durationMs)
    .sort((a, b) => a - b);
  const successfulRequests = results.filter((result) => result.ok).length;
  const statusCounts = results.reduce((counts, result) => {
    const key = String(result.status);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});

  return {
    average_ms:
      durations.length === 0
        ? 0
        : Number(
            (
              durations.reduce((total, value) => total + value, 0) /
              durations.length
            ).toFixed(2),
          ),
    error_rate_percent:
      results.length === 0
        ? 100
        : Number(
            (
              (100 * (results.length - successfulRequests)) /
              results.length
            ).toFixed(2),
          ),
    p50_ms: Number(percentile(durations, 50).toFixed(2)),
    p95_ms: Number(percentile(durations, 95).toFixed(2)),
    p99_ms: Number(percentile(durations, 99).toFixed(2)),
    requests_per_second: Number(
      (results.length / Math.max(elapsedSeconds, 0.001)).toFixed(2),
    ),
    status_counts: statusCounts,
    successful_requests: successfulRequests,
    total_requests: results.length,
  };
}

function writeReport(summary, metadata, outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `${JSON.stringify({ metadata, summary }, null, 2)}\n`,
    "utf8",
  );
}

async function main() {
  if (requiredEnv("COMMUNITY_LOAD_CONFIRM") !== CONFIRMATION) {
    throw new Error(`COMMUNITY_LOAD_CONFIRM must equal ${CONFIRMATION}`);
  }

  const projectRef = requiredEnv("COMMUNITY_LOAD_STAGING_PROJECT_REF");
  const target = validateStagingTarget(
    requiredEnv("COMMUNITY_LOAD_TARGET_URL"),
    projectRef,
  );
  const apiKey = requiredEnv("COMMUNITY_LOAD_ANON_KEY");
  const durationSeconds = boundedInteger(
    "COMMUNITY_LOAD_DURATION_SECONDS",
    DEFAULT_DURATION_SECONDS,
    1,
    MAX_DURATION_SECONDS,
  );
  const concurrency = boundedInteger(
    "COMMUNITY_LOAD_CONCURRENCY",
    DEFAULT_CONCURRENCY,
    1,
    MAX_CONCURRENCY,
  );
  const outputPath =
    process.env.COMMUNITY_LOAD_OUTPUT?.trim() ||
    ".tmp/community-load/community-staging-load.json";

  const startedAt = performance.now();
  const results = await runLoadTest({
    apiKey,
    concurrency,
    durationSeconds,
    target,
  });
  const elapsedSeconds = (performance.now() - startedAt) / 1000;
  const summary = summarize(results, elapsedSeconds);
  const metadata = {
    concurrency,
    duration_seconds: durationSeconds,
    executed_at: new Date().toISOString(),
    staging_project_ref: projectRef,
    target_path: `${target.pathname}${target.search}`,
  };

  writeReport(summary, metadata, outputPath);
  console.log(
    JSON.stringify({ output: path.resolve(outputPath), summary }, null, 2),
  );

  const maximumErrorRate = Number(
    process.env.COMMUNITY_LOAD_MAX_ERROR_RATE_PERCENT ?? "1",
  );
  const maximumP95 = Number(process.env.COMMUNITY_LOAD_MAX_P95_MS ?? "1000");
  if (
    summary.error_rate_percent > maximumErrorRate ||
    summary.p95_ms > maximumP95
  ) {
    process.exitCode = 2;
  }
}

const isDirectExecution =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  main().catch((error) => {
    console.error(
      `[community-load] ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  });
}
