import { spawnSync } from "node:child_process";

const AUDIT_MAX_ATTEMPTS = 3;
const AUDIT_RETRY_DELAY_MS = 2_000;
const TRANSIENT_AUDIT_PATTERNS = [
  /\b429\b/i,
  /\b50[234]\b/i,
  /service unavailable/i,
  /audit endpoint returned an error/i,
  /eai_again/i,
  /econnreset/i,
  /etimedout/i,
  /socket hang up/i,
];

const steps = [
  ["node", ["--check", "tools/release/supabase-edge-admin-canary-deploy.mjs"]],
  ["npm", ["run", "security:validate"]],
  ["npm", ["run", "lint:security"]],
  ["npm", ["audit", "--omit=dev", "--audit-level=moderate"]],
  ["npm", ["run", "validate:upload:ssot"]],
  ["npm", ["run", "validate:architecture:core-platform"]],
  ["npm", ["run", "generate:sitemap"]],
  ["node", ["tools/release/validate-production-sitemap.mjs", "public"]],
  ["npm", ["run", "build:vercel"]],
  ["node", ["tools/release/validate-production-sitemap.mjs", "dist"]],
];

function waitBeforeAuditRetry() {
  const blocker = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(blocker, 0, 0, AUDIT_RETRY_DELAY_MS);
}

function isAuditStep(command, args) {
  return command === "npm" && args[0] === "audit";
}

function runStandardStep(command, args) {
  return spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
  });
}

function runAuditStep(command, args) {
  for (let attempt = 1; attempt <= AUDIT_MAX_ATTEMPTS; attempt += 1) {
    const result = spawnSync(command, args, {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      shell: false,
    });

    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);

    if (result.error || result.status === 0) {
      return result;
    }

    const combinedOutput = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    const transient = TRANSIENT_AUDIT_PATTERNS.some((pattern) =>
      pattern.test(combinedOutput),
    );

    if (!transient || attempt === AUDIT_MAX_ATTEMPTS) {
      return result;
    }

    console.warn(
      `[vercel-build] npm audit provider failure is transient; retrying (${attempt + 1}/${AUDIT_MAX_ATTEMPTS})`,
    );
    waitBeforeAuditRetry();
  }

  throw new Error("unreachable npm audit retry state");
}

for (const [command, args] of steps) {
  console.log(`\n[vercel-build] ${command} ${args.join(" ")}`);
  const result = isAuditStep(command, args)
    ? runAuditStep(command, args)
    : runStandardStep(command, args);

  if (result.error) {
    console.error(`[vercel-build] failed to start ${command}:`, result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
