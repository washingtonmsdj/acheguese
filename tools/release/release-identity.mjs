import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { isSkippableVercelPath } from "./vercel-ignore-build.mjs";

export const RELEASE_IDENTITY_SCHEMA_VERSION = "acheguese-release/v1";

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: false,
  });

  if (result.error || result.status !== 0) {
    const detail = String(
      result.stderr ?? result.error?.message ?? "git command failed",
    ).trim();
    throw new Error(detail || "git " + args.join(" ") + " failed");
  }

  return String(result.stdout ?? "");
}

function normalizeSha(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return /^[0-9a-f]{40}$/.test(normalized) ? normalized : "";
}

export function isDeployRelevantReleasePath(filePath) {
  return !isSkippableVercelPath(filePath);
}

export function listTrackedDeployEntries() {
  const output = runGit(["ls-files", "--stage", "-z"]);
  const entries = [];

  for (const record of output.split("\0")) {
    if (!record) continue;

    const tabIndex = record.indexOf("\t");
    if (tabIndex < 0) {
      throw new Error("Unexpected git ls-files record: " + record);
    }

    const metadata = record.slice(0, tabIndex).trim().split(/\s+/);
    const filePath = record.slice(tabIndex + 1);
    const [mode, blobSha, stage] = metadata;

    if (!mode || !/^[0-9a-f]{40}$/i.test(blobSha ?? "") || stage !== "0") {
      throw new Error("Unexpected tracked entry metadata for " + filePath);
    }

    if (!isDeployRelevantReleasePath(filePath)) continue;
    entries.push({ path: filePath, mode, blobSha: blobSha.toLowerCase() });
  }

  return entries.sort((a, b) =>
    a.path < b.path ? -1 : a.path > b.path ? 1 : 0,
  );
}

export function computeDeployFingerprint() {
  const entries = listTrackedDeployEntries();
  if (entries.length === 0) {
    throw new Error("Release identity cannot be built from an empty deploy tree.");
  }

  const hash = createHash("sha256");
  for (const entry of entries) {
    hash.update(entry.path);
    hash.update("\0");
    hash.update(entry.mode);
    hash.update("\0");
    hash.update(entry.blobSha);
    hash.update("\0");
  }

  return hash.digest("hex");
}

export function resolveCurrentCommitSha() {
  const headSha = normalizeSha(runGit(["rev-parse", "HEAD"]));
  if (!headSha) {
    throw new Error("Git HEAD is not an exact 40-character SHA.");
  }

  const providerSha =
    normalizeSha(process.env.VERCEL_GIT_COMMIT_SHA) ||
    normalizeSha(process.env.GITHUB_SHA);

  if (providerSha && providerSha !== headSha) {
    throw new Error(
      "Release identity SHA mismatch: provider=" +
        providerSha +
        " checkout=" +
        headSha,
    );
  }

  return providerSha || headSha;
}

export function buildReleaseIdentity(commitSha = resolveCurrentCommitSha()) {
  const normalizedSha = normalizeSha(commitSha);
  if (!normalizedSha) {
    throw new Error("Release identity requires an exact 40-character commit SHA.");
  }

  return {
    schemaVersion: RELEASE_IDENTITY_SCHEMA_VERSION,
    commitSha: normalizedSha,
    deployFingerprint: computeDeployFingerprint(),
  };
}

export function classifyReleaseIdentityMatch(expected, deployed) {
  if (
    !expected ||
    !deployed ||
    expected.schemaVersion !== RELEASE_IDENTITY_SCHEMA_VERSION ||
    deployed.schemaVersion !== RELEASE_IDENTITY_SCHEMA_VERSION ||
    !/^[0-9a-f]{40}$/.test(String(expected.commitSha ?? "")) ||
    !/^[0-9a-f]{40}$/.test(String(deployed.commitSha ?? "")) ||
    !/^[0-9a-f]{64}$/.test(String(expected.deployFingerprint ?? "")) ||
    !/^[0-9a-f]{64}$/.test(String(deployed.deployFingerprint ?? ""))
  ) {
    return "mismatch";
  }

  if (expected.deployFingerprint !== deployed.deployFingerprint) {
    return "mismatch";
  }

  return expected.commitSha === deployed.commitSha ? "exact" : "equivalent";
}
