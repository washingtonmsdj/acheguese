#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const diagPath = process.argv[2] || ".tmp/bench/economic-circulation-db-diagnose.log";
const outPath = process.argv[3] || ".tmp/bench/economic-circulation-blocker-report.md";
const beforePath = ".tmp/bench/economic-circulation-before.txt";
const afterPath = ".tmp/bench/economic-circulation-after.txt";
const summaryPath = ".tmp/bench/economic-circulation-summary.md";

const now = new Date().toISOString();
const diag = fs.existsSync(diagPath)
  ? fs.readFileSync(diagPath, "utf8")
  : "Diagnostico nao encontrado.";

const before = fs.existsSync(beforePath) ? fs.readFileSync(beforePath, "utf8") : "";
const after = fs.existsSync(afterPath) ? fs.readFileSync(afterPath, "utf8") : "";
const summaryExists = fs.existsSync(summaryPath);
const benchmarkReady = before.length > 0 && after.length > 0 && summaryExists;

const skippedBefore = (before.match(/SKIPPED:/g) || []).length;
const skippedAfter = (after.match(/SKIPPED:/g) || []).length;
const partialCoverage = benchmarkReady && (skippedBefore > 0 || skippedAfter > 0);

const status = benchmarkReady
  ? partialCoverage
    ? "PARCIAL (benchmark gerado com cobertura incompleta)"
    : "OK (benchmark gerado com cobertura completa)"
  : "BLOQUEADO (sem benchmark before/after)";

const motivo = benchmarkReady
  ? partialCoverage
    ? "schema cache/API sem exposicao completa de fontes de oportunidades no ambiente ativo"
    : "sem bloqueios operacionais para benchmark"
  : "conectividade/credencial com banco de staging";

const impacto = benchmarkReady
  ? partialCoverage
    ? `- Benchmark gerado, porem com consultas puladas:\n  - SKIPPED before: ${skippedBefore}\n  - SKIPPED after: ${skippedAfter}\n- Risco: decisao de performance baseada em cobertura parcial.`
    : "- Benchmark gerado com cobertura completa e artefatos finais presentes."
  : `- Nao foi possivel gerar:\n  - \`.tmp/bench/economic-circulation-before.txt\`\n  - \`.tmp/bench/economic-circulation-after.txt\`\n  - \`.tmp/bench/economic-circulation-summary.md\``;

const actions = benchmarkReady
  ? partialCoverage
    ? `1. Garantir que \`work_opportunities\` e/ou \`public_work_opportunity_search\` estejam disponiveis no schema cache do ambiente.\n2. Reexecutar \`npm run bench:economic:run-all\`.\n3. Confirmar ausencia de \`SKIPPED\` nos arquivos before/after.`
    : `1. Manter execucao SSOT periodica:\n   - \`npm run bench:economic:run-all\`\n2. Publicar relatorio operacional final.`
  : `1. Validar credencial DB de staging (usuario/senha/pooler) no ambiente local.\n2. Validar rota de rede/DNS para host direto e pooler.\n3. Reexecutar fluxo SSOT:\n   - \`npm run bench:economic:before\`\n   - \`npm run bench:economic:after\`\n   - \`npm run bench:economic:report\`\n   - \`npm run bench:economic:finalize\``;

const content = `# Relatorio de Bloqueio Operacional - Benchmark Economico

## Contexto

- Data: ${now}
- Status: ${status}
- Motivo: ${motivo}

## Evidencia tecnica

\`\`\`text
${diag}
\`\`\`

## Impacto

${impacto}

## Acoes recomendadas (operacionais)

${actions}
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, content, "utf8");
console.log(`Blocker report gerado: ${path.resolve(outPath)}`);
