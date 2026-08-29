#!/usr/bin/env tsx
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

type Violation = {
  file: string;
  rule: string;
  detail: string;
};

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, "src");
const CANONICAL_SERVICE = "src/core/analytics/AnalyticsService.ts";

const RETIRED_PATHS = [
  "src/core/analytics/services/AnalyticsService.ts",
  "src/core/analytics/pages",
  "src/core/analytics/hooks",
  "src/core/analytics/config",
  "src/core/work-opportunities/services/WorkOpportunityCirculationAnalyticsService.ts",
] as const;

const TS_FILE = /\.(?:ts|tsx)$/;
const DIRECT_EVENT_TABLE =
  /\.from(?:<[^>]+>)?\(\s*["']analytics_(?:events|sessions)["']\s*\)/g;
const DIRECT_DAILY_METRICS =
  /\.from(?:<[^>]+>)?\(\s*["']analytics_daily_metrics["']\s*\)/g;
const DIRECT_ANALYTICS_RPC =
  /\.rpc(?:<[^>]+>)?\(\s*["'](?:track_analytics_event|get_analytics_metrics|get_recent_analytics_events)["']/g;
const LEGACY_WRAPPER_IMPORT = /core\/analytics\/services\/AnalyticsService/;

function normalize(path: string): string {
  return path.replace(/\\/g, "/");
}

function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === "dist" || entry.startsWith(".")) continue;
      walk(full, out);
      continue;
    }
    if (TS_FILE.test(entry)) out.push(full);
  }
}

function scanSourceFile(file: string): Violation[] {
  const rel = normalize(relative(ROOT, file));
  const content = readFileSync(file, "utf8");
  const violations: Violation[] = [];

  if (LEGACY_WRAPPER_IMPORT.test(content)) {
    violations.push({
      file: rel,
      rule: "legacy analytics wrapper import",
      detail: "Import must target the canonical AnalyticsService/barrel instead of the retired wrapper.",
    });
  }

  const eventTableMatches = [...content.matchAll(DIRECT_EVENT_TABLE)];
  if (eventTableMatches.length > 0) {
    violations.push({
      file: rel,
      rule: "direct analytics event/session table access",
      detail: `${eventTableMatches.length} direct table access(es); events must use canonical RPC contracts.`,
    });
  }

  if (rel !== CANONICAL_SERVICE) {
    const dailyMatches = [...content.matchAll(DIRECT_DAILY_METRICS)];
    if (dailyMatches.length > 0) {
      violations.push({
        file: rel,
        rule: "direct analytics daily metrics access",
        detail: `${dailyMatches.length} direct read(s); daily metrics belong to ${CANONICAL_SERVICE}.`,
      });
    }

    const rpcMatches = [...content.matchAll(DIRECT_ANALYTICS_RPC)];
    if (rpcMatches.length > 0) {
      violations.push({
        file: rel,
        rule: "direct platform analytics RPC access",
        detail: `${rpcMatches.length} direct analytics RPC call(s); use the canonical AnalyticsService.`,
      });
    }
  }

  return violations;
}

function main(): void {
  const violations: Violation[] = [];

  for (const retiredPath of RETIRED_PATHS) {
    if (existsSync(join(ROOT, retiredPath))) {
      violations.push({
        file: retiredPath,
        rule: "retired analytics path recreated",
        detail: "This path was retired during G4 Analytics SSOT consolidation.",
      });
    }
  }

  const canonicalPath = join(ROOT, CANONICAL_SERVICE);
  if (!existsSync(canonicalPath)) {
    violations.push({
      file: CANONICAL_SERVICE,
      rule: "canonical analytics owner missing",
      detail: "AnalyticsService must remain the platform analytics owner.",
    });
  } else {
    const canonical = readFileSync(canonicalPath, "utf8");
    const requiredTokens = [
      'analyticsDb.rpc<string>("track_analytics_event"',
      'analyticsDb.rpc<AnalyticsMetrics[]>("get_analytics_metrics"',
      'analyticsDb.rpc<RecentAnalyticsEvent[]>("get_recent_analytics_events"',
      "Promise<ServiceResult<RecentAnalyticsEvent[]>>",
      'from<AnalyticsDailyMetricsRow>("analytics_daily_metrics")',
    ];

    for (const token of requiredTokens) {
      if (!canonical.includes(token)) {
        violations.push({
          file: CANONICAL_SERVICE,
          rule: "canonical analytics contract drift",
          detail: `Missing required token: ${token}`,
        });
      }
    }

    if (DIRECT_EVENT_TABLE.test(canonical)) {
      violations.push({
        file: CANONICAL_SERVICE,
        rule: "canonical service bypasses event RPC read boundary",
        detail: "analytics_events/analytics_sessions must not be read directly from browser source.",
      });
    }
  }

  const files: string[] = [];
  walk(SRC_DIR, files);
  for (const file of files) violations.push(...scanSourceFile(file));

  if (violations.length === 0) {
    console.log("✅ Analytics SSOT validado: owner único e sem bypass de persistence.");
    return;
  }

  console.error(`❌ Analytics SSOT: ${violations.length} desvio(s) encontrado(s).`);
  for (const violation of violations) {
    console.error(`- ${violation.file} | ${violation.rule}`);
    console.error(`  ${violation.detail}`);
  }
  process.exit(1);
}

main();
