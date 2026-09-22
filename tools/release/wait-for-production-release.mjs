import { appendFileSync } from "node:fs";
import {
  buildReleaseIdentity,
  classifyReleaseIdentityMatch,
} from "./release-identity.mjs";

const DEFAULT_URL = "https://acheguese.com.br/release.json";
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;
const DEFAULT_INTERVAL_MS = 5_000;

function readPositiveInteger(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(name + " must be a positive integer.");
  }
  return value;
}

function writeOutput(name, value) {
  const output = process.env.GITHUB_OUTPUT;
  if (!output) return;
  appendFileSync(output, name + "=" + String(value) + "\\n", "utf8");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const expected = buildReleaseIdentity();
const targetUrl = new URL(
  process.env.RELEASE_IDENTITY_URL?.trim() || DEFAULT_URL,
);
if (targetUrl.protocol !== "https:") {
  throw new Error("Release identity URL must use HTTPS.");
}

const timeoutMs = readPositiveInteger(
  "RELEASE_WAIT_TIMEOUT_MS",
  DEFAULT_TIMEOUT_MS,
);
const intervalMs = readPositiveInteger(
  "RELEASE_WAIT_INTERVAL_MS",
  DEFAULT_INTERVAL_MS,
);
const deadline = Date.now() + timeoutMs;
let attempt = 0;
let lastObservation = "no response";

while (Date.now() <= deadline) {
  attempt += 1;
  const probeUrl = new URL(targetUrl);
  probeUrl.searchParams.set("expected", expected.commitSha.slice(0, 12));
  probeUrl.searchParams.set("attempt", String(attempt));

  try {
    const response = await fetch(probeUrl, {
      headers: {
        accept: "application/json",
        "cache-control": "no-cache",
      },
      cache: "no-store",
      redirect: "error",
    });

    if (response.ok) {
      const deployed = await response.json();
      const match = classifyReleaseIdentityMatch(expected, deployed);
      lastObservation =
        "HTTP " +
        response.status +
        " commit=" +
        (deployed?.commitSha ?? "missing") +
        " fingerprint=" +
        (deployed?.deployFingerprint ?? "missing") +
        " mode=" +
        match;

      if (match === "exact" || match === "equivalent") {
        console.log(
          "[release-identity] production runtime matched after " +
            attempt +
            " attempt(s): " +
            lastObservation,
        );
        writeOutput("mode", match);
        writeOutput("deployed_sha", deployed.commitSha);
        writeOutput("expected_sha", expected.commitSha);
        writeOutput("deploy_fingerprint", expected.deployFingerprint);
        process.exit(0);
      }
    } else {
      lastObservation = "HTTP " + response.status;
    }
  } catch (error) {
    lastObservation = error instanceof Error ? error.message : String(error);
  }

  if (Date.now() + intervalMs > deadline) break;
  console.log(
    "[release-identity] production not ready for this deploy tree; retrying in " +
      intervalMs +
      "ms (" +
      lastObservation +
      ")",
  );
  await sleep(intervalMs);
}

throw new Error(
  "Production release identity did not converge within " +
    timeoutMs +
    "ms. Expected commit=" +
    expected.commitSha +
    " fingerprint=" +
    expected.deployFingerprint +
    ". Last observation: " +
    lastObservation,
);
