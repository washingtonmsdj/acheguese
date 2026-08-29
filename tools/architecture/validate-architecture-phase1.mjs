#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const PHASE1_COMMANDS = [
  ["npm", ["run", "-s", "validate:deps"]],
  ["node", ["tools/architecture/validate-reverse-layer-imports.mjs", "--json"]],
  ["npm", ["exec", "--", "vitest", "run", "tests/architecture/reverse-layer-imports.test.ts"]],
  ["npm", ["run", "-s", "validate:architecture:incremental", "--", "--strict", "--json"]],
  ["npm", ["run", "-s", "validate:architecture:governance", "--", "--json"]],
  ["npm", ["run", "-s", "validate:taxonomy"]],
  ["npm", ["run", "-s", "validate:ssot"]],
  ["npm", ["run", "-s", "check:ssot"]],
  ["npm", ["run", "-s", "validate:architecture:file-sizes"]],
  ["npm", ["run", "-s", "typecheck:app", "--", "--pretty", "false"]],
  ["npm", ["run", "-s", "lint"]],
  ["npm", ["run", "-s", "report:architecture:hardening"]],
];

function runCommand(command, args) {
  const label = `${command} ${args.join(" ")}`;
  console.log(`\n==> ${label}`);

  const result =
    process.platform === "win32"
      ? spawnSync("cmd.exe", ["/d", "/s", "/c", label], { stdio: "inherit" })
      : spawnSync(command, args, { stdio: "inherit" });

  if (result.status !== 0) {
    console.error(`\n[FAIL] ${label} (exit=${result.status ?? "unknown"})`);
    process.exit(result.status ?? 1);
  }
}

console.log("FASE 1 Gate-First: validating architecture hardening...");
for (const [command, args] of PHASE1_COMMANDS) {
  runCommand(command, args);
}
console.log("\n[OK] FASE 1 architecture hardening validation complete.");
