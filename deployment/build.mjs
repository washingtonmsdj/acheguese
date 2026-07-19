import { copyFileSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const deploymentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(deploymentDirectory, "..");
const releasePolicyPath = path.join(deploymentDirectory, "release-stage.json");
const isEntryPoint =
  typeof process.argv[1] === "string" &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

export function readReleasePolicy() {
  return JSON.parse(readFileSync(releasePolicyPath, "utf8"));
}

export function shouldServeClosedProduction(
  environment,
  policy = readReleasePolicy(),
) {
  const target = environment.VERCEL_TARGET_ENV || environment.VERCEL_ENV;

  return (
    target === "production" &&
    policy.stage === "private-alpha" &&
    policy.productionExposure === "closed" &&
    policy.publicLaunchApproved === false
  );
}

function buildClosedProduction() {
  const outputDirectory = path.join(projectRoot, "dist");
  rmSync(outputDirectory, { recursive: true, force: true });
  mkdirSync(outputDirectory, { recursive: true });
  copyFileSync(
    path.join(deploymentDirectory, "private-alpha.html"),
    path.join(outputDirectory, "index.html"),
  );
  console.log("Private alpha perimeter: closed production page generated.");
}

function buildApplication() {
  const viteBin = path.join(
    projectRoot,
    "node_modules",
    "vite",
    "bin",
    "vite.js",
  );
  const result = spawnSync(process.execPath, [viteBin, "build"], {
    cwd: projectRoot,
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (isEntryPoint) {
  if (shouldServeClosedProduction(process.env)) {
    buildClosedProduction();
  } else {
    buildApplication();
  }
}
