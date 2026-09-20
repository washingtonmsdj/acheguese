#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_REPOSITORY = "washingtonmsdj/acheguese";
const DEFAULT_BASE_BRANCH = "main";
const DEFAULT_KEEP_BRANCHES = new Set(["main", "work/mvp-urgent"]);

function parseArgs(argv) {
  const options = {
    apply: false,
    json: false,
    repo: process.env.GITHUB_REPOSITORY || DEFAULT_REPOSITORY,
    base: DEFAULT_BASE_BRANCH,
  };

  for (const arg of argv) {
    if (arg === "--apply") options.apply = true;
    else if (arg === "--json") options.json = true;
    else if (arg.startsWith("--repo=")) options.repo = arg.slice("--repo=".length);
    else if (arg.startsWith("--base=")) options.base = arg.slice("--base=".length);
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

export function classifyBranch({
  name,
  sha,
  protectedBranch,
  baseBranch,
  keepBranches = DEFAULT_KEEP_BRANCHES,
  openHeadRefs,
  exactMergedHeads,
  aheadBy,
}) {
  if (name === baseBranch || keepBranches.has(name)) {
    return { action: "preserve", reason: "explicit-keep" };
  }
  if (protectedBranch) {
    return { action: "preserve", reason: "protected-branch" };
  }
  if (openHeadRefs.has(name)) {
    return { action: "preserve", reason: "open-pull-request" };
  }
  if (exactMergedHeads.get(name)?.has(sha)) {
    return { action: "delete", reason: "exact-merged-pr-head" };
  }
  if (aheadBy === 0) {
    return { action: "delete", reason: "fully-contained-in-base" };
  }
  return { action: "preserve", reason: "unique-commits" };
}

function usage() {
  return [
    "Usage: node tools/github/cleanup-merged-branches.mjs [--apply] [--json] [--repo=owner/name] [--base=main]",
    "",
    "Default is dry-run. --apply performs deletions only after revalidating branch SHA, protection,",
    "open PR state and containment immediately before each DELETE.",
    "",
    "Credentials: GH_TOKEN or GITHUB_TOKEN with permission to read the repository and delete Git refs.",
  ].join("\n");
}

function createGitHubClient({ repo, token }) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) {
    throw new Error(`Invalid repository: ${repo}`);
  }
  if (!token) {
    throw new Error("GH_TOKEN or GITHUB_TOKEN is required.");
  }

  const [owner] = repo.split("/");
  const baseUrl = `https://api.github.com/repos/${repo}`;
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "acheguese-branch-hygiene",
  };

  async function request(path, init = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { ...headers, ...(init.headers || {}) },
    });

    if (response.status === 204) return null;

    const body = await response.text();
    let parsed = null;
    if (body) {
      try {
        parsed = JSON.parse(body);
      } catch {
        parsed = body;
      }
    }

    if (!response.ok) {
      const detail =
        typeof parsed === "object" && parsed && "message" in parsed
          ? parsed.message
          : body || response.statusText;
      throw new Error(`GitHub API ${response.status} ${path}: ${detail}`);
    }

    return parsed;
  }

  async function paginate(path) {
    const rows = [];
    for (let page = 1; ; page += 1) {
      const separator = path.includes("?") ? "&" : "?";
      const batch = await request(`${path}${separator}per_page=100&page=${page}`);
      if (!Array.isArray(batch)) {
        throw new Error(`Expected array from paginated endpoint: ${path}`);
      }
      rows.push(...batch);
      if (batch.length < 100) break;
    }
    return rows;
  }

  return { owner, repository: repo, request, paginate };
}

function branchParam(name) {
  return encodeURIComponent(name);
}

function refPath(name) {
  return name
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function auditBranches({ client, baseBranch }) {
  const [branches, closedPulls, openPulls, base] = await Promise.all([
    client.paginate("/branches"),
    client.paginate("/pulls?state=closed&sort=updated&direction=desc"),
    client.paginate("/pulls?state=open&sort=updated&direction=desc"),
    client.request(`/branches/${branchParam(baseBranch)}`),
  ]);

  const openHeadRefs = new Set(
    openPulls
      .filter((pr) => pr.head?.repo?.full_name === client.repository)
      .map((pr) => pr.head?.ref)
      .filter(Boolean),
  );

  const exactMergedHeads = new Map();
  for (const pr of closedPulls) {
    if (!pr.merged_at || !pr.head?.ref || !pr.head?.sha) continue;
    if (pr.head?.repo?.full_name !== client.repository) continue;
    const heads = exactMergedHeads.get(pr.head.ref) || new Set();
    heads.add(pr.head.sha);
    exactMergedHeads.set(pr.head.ref, heads);
  }

  const rows = [];
  for (const branch of branches) {
    if (branch.name === baseBranch) {
      rows.push({
        name: branch.name,
        sha: branch.commit.sha,
        action: "preserve",
        reason: "base-branch",
        aheadBy: 0,
        behindBy: 0,
      });
      continue;
    }

    let aheadBy = null;
    let behindBy = null;
    const exactMerged = exactMergedHeads.get(branch.name)?.has(branch.commit.sha) ?? false;

    if (!exactMerged && !openHeadRefs.has(branch.name) && !branch.protected && !DEFAULT_KEEP_BRANCHES.has(branch.name)) {
      const compare = await client.request(
        `/compare/${base.commit.sha}...${branch.commit.sha}`,
      );
      aheadBy = compare.ahead_by;
      behindBy = compare.behind_by;
    }

    const classification = classifyBranch({
      name: branch.name,
      sha: branch.commit.sha,
      protectedBranch: Boolean(branch.protected),
      baseBranch,
      openHeadRefs,
      exactMergedHeads,
      aheadBy,
    });

    rows.push({
      name: branch.name,
      sha: branch.commit.sha,
      protected: Boolean(branch.protected),
      aheadBy,
      behindBy,
      ...classification,
    });
  }

  return {
    base: { name: baseBranch, sha: base.commit.sha },
    rows,
  };
}

async function hasOpenPullRequest(client, branchName) {
  const head = encodeURIComponent(`${client.owner}:${branchName}`);
  const pulls = await client.request(`/pulls?state=open&head=${head}&per_page=10`);
  return Array.isArray(pulls) && pulls.length > 0;
}

async function revalidateAndDelete({ client, baseBranch, candidate }) {
  const current = await client.request(`/branches/${branchParam(candidate.name)}`);
  if (current.commit.sha !== candidate.sha) {
    return { ...candidate, deleted: false, skipReason: "sha-changed" };
  }
  if (current.protected) {
    return { ...candidate, deleted: false, skipReason: "became-protected" };
  }
  if (await hasOpenPullRequest(client, candidate.name)) {
    return { ...candidate, deleted: false, skipReason: "open-pr-created" };
  }

  if (candidate.reason === "fully-contained-in-base") {
    const base = await client.request(`/branches/${branchParam(baseBranch)}`);
    const compare = await client.request(
      `/compare/${base.commit.sha}...${current.commit.sha}`,
    );
    if (compare.ahead_by !== 0) {
      return { ...candidate, deleted: false, skipReason: "no-longer-contained" };
    }
  }

  await client.request(`/git/refs/heads/${refPath(candidate.name)}`, {
    method: "DELETE",
  });
  return { ...candidate, deleted: true };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  const client = createGitHubClient({ repo: options.repo, token });
  const audit = await auditBranches({ client, baseBranch: options.base });

  const candidates = audit.rows.filter((row) => row.action === "delete");
  const preserved = audit.rows.filter((row) => row.action !== "delete");

  const summary = {
    repository: options.repo,
    base: audit.base,
    mode: options.apply ? "apply" : "dry-run",
    totalBranches: audit.rows.length,
    deleteCandidates: candidates.length,
    preservedBranches: preserved.length,
    candidates: candidates.map(({ name, sha, reason }) => ({ name, sha, reason })),
    preserved: preserved.map(({ name, sha, reason, aheadBy, behindBy }) => ({
      name,
      sha,
      reason,
      aheadBy,
      behindBy,
    })),
  };

  if (!options.apply) {
    if (options.json) console.log(JSON.stringify(summary, null, 2));
    else {
      console.log(
        `DRY-RUN: ${candidates.length} delete candidates; ${preserved.length} preserved.`,
      );
      for (const candidate of candidates) {
        console.log(`DELETE? ${candidate.name} [${candidate.reason}] ${candidate.sha}`);
      }
      console.log("\nNo refs were deleted. Re-run with --apply after reviewing this output.");
    }
    return;
  }

  const results = [];
  for (const candidate of candidates) {
    try {
      results.push(
        await revalidateAndDelete({
          client,
          baseBranch: options.base,
          candidate,
        }),
      );
    } catch (error) {
      results.push({
        ...candidate,
        deleted: false,
        skipReason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const deleted = results.filter((row) => row.deleted);
  const skipped = results.filter((row) => !row.deleted);
  const appliedSummary = {
    ...summary,
    deleted: deleted.map(({ name, sha, reason }) => ({ name, sha, reason })),
    skipped: skipped.map(({ name, sha, reason, skipReason }) => ({
      name,
      sha,
      reason,
      skipReason,
    })),
  };

  if (options.json) console.log(JSON.stringify(appliedSummary, null, 2));
  else {
    console.log(`Deleted ${deleted.length} branches; skipped ${skipped.length}.`);
    for (const row of deleted) console.log(`DELETED ${row.name}`);
    for (const row of skipped) console.log(`SKIPPED ${row.name}: ${row.skipReason}`);
  }

  if (skipped.some((row) => /GitHub API/.test(row.skipReason || ""))) {
    process.exitCode = 1;
  }
}

const isDirectExecution =
  Boolean(process.argv[1]) &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectExecution) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
