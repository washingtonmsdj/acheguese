#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const summaryPath = process.argv[2] || ".tmp/bench/economic-circulation-summary.md";
const outputPath = process.argv[3] || ".tmp/bench/economic-circulation-staging-report-draft.md";

if (!fs.existsSync(summaryPath)) {
  console.error(`Summary nao encontrado: ${summaryPath}`);
  process.exit(1);
}

const summary = fs.readFileSync(summaryPath, "utf8");
const now = new Date().toISOString();

const report = `# Relatorio de Staging - Circulacao Economica (Draft)

## Metadados da execucao

- Data: ${now}
- Ambiente: staging
- Responsavel: _preencher_
- Commit/branch: _preencher_
- Janela de teste: _preencher_

## 1) Validacoes tecnicas

- \`validate:migrations\`: _preencher_
- \`validate:deps\`: _preencher_
- \`build\`: _preencher_
- Observacoes: _preencher_

## 2) Benchmark before/after (auto-importado)

${summary}

## 3) Logs de slow operations

- \`global-search\`: _preencher_
- \`work-opportunity-search\`: _preencher_
- \`structured-vagas-search\`: _preencher_
- \`listPublicOpportunityCards\`: _preencher_
- \`getPublicOpportunityDetail\`: _preencher_
- \`listRecentOpportunitiesByAuthorProfile\`: _preencher_

## 4) Integridade funcional

- feed distribuindo cards corretamente: _SIM/NAO_
- abertura de detalhe correta: _SIM/NAO_
- CTA de contato funcionando: _SIM/NAO_
- consistencia feed/oportunidades/vagas: _SIM/NAO_

## 5) Decisao

- Status final: _GO / NO-GO_
- Justificativa: _preencher_
- Acoes cirurgicas pendentes (se houver): _preencher_
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, report, "utf8");
console.log(`Draft gerado: ${path.resolve(outputPath)}`);

