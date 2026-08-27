#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const required = [
  ".tmp/bench/economic-circulation-before.txt",
  ".tmp/bench/economic-circulation-after.txt",
  ".tmp/bench/economic-circulation-summary.md",
  ".tmp/bench/economic-circulation-staging-report-draft.md",
];

const missing = required.filter((p) => !fs.existsSync(p));

console.log("=== Economic Benchmark Finalize ===");
for (const file of required) {
  const ok = fs.existsSync(file);
  console.log(`${ok ? "OK " : "MISS"} ${path.resolve(file)}`);
}

if (missing.length > 0) {
  console.log("");
  console.log("Status: INCOMPLETO");
  console.log("Pendencias:");
  for (const item of missing) {
    console.log(`- ${item}`);
  }
  console.log("");
  console.log("Proximo passo:");
  console.log("1) npm run bench:economic:before");
  console.log("2) npm run bench:economic:after");
  console.log("3) npm run bench:economic:report");
  process.exit(1);
}

console.log("");
console.log("Status: COMPLETO");
console.log("Proximo passo:");
console.log("1) Revisar .tmp/bench/economic-circulation-staging-report-draft.md");
console.log("2) Preencher campos manuais (responsavel, janela, decisao GO/NO-GO)");
console.log("3) Publicar relatorio final para aprovacao operacional");

