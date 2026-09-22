import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildReleaseIdentity,
  classifyReleaseIdentityMatch,
} from "./release-identity.mjs";

const outputPath = resolve(process.cwd(), "dist", "release.json");
mkdirSync(resolve(process.cwd(), "dist"), { recursive: true });

const identity = buildReleaseIdentity();
writeFileSync(outputPath, JSON.stringify(identity, null, 2) + "\\n", "utf8");

const persisted = JSON.parse(readFileSync(outputPath, "utf8"));
if (classifyReleaseIdentityMatch(identity, persisted) !== "exact") {
  throw new Error("Persisted release identity does not match the build checkout.");
}

console.log(
  "[release-identity] wrote dist/release.json commit=" +
    identity.commitSha +
    " fingerprint=" +
    identity.deployFingerprint,
);
