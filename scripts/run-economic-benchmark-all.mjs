#!/usr/bin/env node
import { spawnSync } from "node:child_process";

function runStep(label, command, args) {
  console.log(`\n=== ${label} ===`);
  const r = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  return r.status ?? 1;
}

function main() {
  const steps = [
    { label: "BEFORE", command: "npm", args: ["run", "bench:economic:before"] },
    { label: "AFTER", command: "npm", args: ["run", "bench:economic:after"] },
    { label: "REPORT", command: "npm", args: ["run", "bench:economic:report"] },
    { label: "FINALIZE", command: "npm", args: ["run", "bench:economic:finalize"] },
  ];

  for (const step of steps) {
    const code = runStep(step.label, step.command, step.args);
    if (code !== 0) {
      console.log(`\nStep failed: ${step.label} (code=${code}). Gerando blocker report...`);
      runStep("DIAGNOSE_DB", "npm", ["run", "bench:economic:diagnose-db"]);
      runStep("BLOCKER_REPORT", "npm", ["run", "bench:economic:blocker-report"]);
      process.exit(code);
    }
  }

  console.log("\nFluxo completo finalizado com sucesso.");
}

main();

