#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CRITICAL_DOC_PREFIXES = [
  "docs/architecture/",
  "docs/09-reference/governance/security/",
];

function normalizePath(filePath) {
  return String(filePath ?? "")
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\.\//, "");
}

export function isSkippableVercelPath(filePath) {
  const normalized = normalizePath(filePath);
  if (!normalized) return false;

  if (normalized.startsWith(".github/")) return true;
  if (normalized.startsWith(".kiro/")) return true;
  if (normalized.startsWith("tests/")) return true;
  if (normalized.startsWith("e2e/")) return true;

  if (normalized.startsWith("docs/")) {
    return !CRITICAL_DOC_PREFIXES.some((prefix) =>
      normalized.startsWith(prefix),
    );
  }

  if (!normalized.includes("/") && normalized.toLowerCase().endsWith(".md")) {
    return true;
  }

  return false;
}

export function shouldSkipVercelBuild(changedPaths) {
  return changedPaths.length > 0 && changedPaths.every(isSkippableVercelPath);
}

export function previousCommitFetchArgs(sha) {
  return ["fetch", "--no-tags", "--depth=1", "origin", sha];
}

function runGit(args) {
  return spawnSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: false,
  });
}

function gitCommitAvailable(sha) {
  const result = runGit(["cat-file", "-e", `${sha}^{commit}`]);
  return !result.error && result.status === 0;
}

function ensureGitCommitAvailable(sha) {
  if (gitCommitAvailable(sha)) {
    return { available: true, fetched: false, detail: "" };
  }

  const fetchResult = runGit(previousCommitFetchArgs(sha));
  if (fetchResult.error || fetchResult.status !== 0) {
    const detail = String(
      fetchResult.stderr ?? fetchResult.error?.message ?? "git fetch failed",
    ).trim();
    return { available: false, fetched: false, detail };
  }

  if (!gitCommitAvailable(sha)) {
    return {
      available: false,
      fetched: true,
      detail: "fetched previous deployment commit but it remains unavailable",
    };
  }

  return { available: true, fetched: true, detail: "" };
}

function continueBuild(reason) {
  console.log(`[vercel-ignore] build required: ${reason}`);
  process.exit(1);
}

function main() {
  const previousSha = String(process.env.VERCEL_GIT_PREVIOUS_SHA ?? "").trim();
  const currentSha =
    String(process.env.VERCEL_GIT_COMMIT_SHA ?? "HEAD").trim() || "HEAD";

  if (!/^[0-9a-f]{40}$/i.test(previousSha)) {
    continueBuild("VERCEL_GIT_PREVIOUS_SHA is unavailable or invalid");
  }

  const previousCommit = ensureGitCommitAvailable(previousSha);
  if (!previousCommit.available) {
    continueBuild(
      previousCommit.detail
        ? `previous successful deployment commit unavailable: ${previousCommit.detail}`
        : "previous successful deployment commit unavailable",
    );
  }

  if (previousCommit.fetched) {
    console.log("[vercel-ignore] fetched previous successful deployment commit");
  }

  const diff = runGit([
    "diff",
    "--name-only",
    "--diff-filter=ACDMRTUXB",
    previousSha,
    currentSha,
    "--",
  ]);

  if (diff.error || diff.status !== 0) {
    const detail = String(
      diff.stderr ?? diff.error?.message ?? "git diff failed",
    ).trim();
    continueBuild(detail || "git diff failed");
  }

  const changedPaths = String(diff.stdout ?? "")
    .split(/\r?\n/)
    .map(normalizePath)
    .filter(Boolean);

  if (!shouldSkipVercelBuild(changedPaths)) {
    const buildPaths = changedPaths.filter(
      (path) => !isSkippableVercelPath(path),
    );
    continueBuild(
      buildPaths.length > 0
        ? `deploy-relevant changes: ${buildPaths.join(", ")}`
        : "no safely skippable change set was detected",
    );
  }

  console.log(
    `[vercel-ignore] build skipped: only non-deploy paths changed (${changedPaths.join(", ")})`,
  );
  process.exit(0);
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) {
  main();
}
