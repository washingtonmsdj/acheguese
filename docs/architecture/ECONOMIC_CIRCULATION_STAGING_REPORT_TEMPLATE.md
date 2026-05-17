# Relatorio de Staging - Circulacao Economica (Template)

## Metadados da execucao

- Data:
- Ambiente:
- Responsavel:
- Commit/branch:
- Janela de teste:

## 1) Validacoes tecnicas

- `validate:migrations`: PASS/FAIL
- `validate:deps`: PASS/FAIL
- `build`: PASS/FAIL
- Observacoes:

## 2) Resultados de jornada (antes/depois)

### 2.1 Busca global

- Cenarios: `pizzaiolo pituba`, `pedreiro amaralina`, `eletricista`
- p50 antes:
- p95 antes:
- p50 depois:
- p95 depois:
- Delta p95 (%):

### 2.2 Oportunidades (lista + detalhe)

- p50 antes:
- p95 antes:
- p50 depois:
- p95 depois:
- Delta p95 (%):

### 2.3 Vagas estruturadas

- p50 antes:
- p95 antes:
- p50 depois:
- p95 depois:
- Delta p95 (%):

## 3) Logs de slow operations

- `global-search`:
- `work-opportunity-search`:
- `structured-vagas-search`:
- `listPublicOpportunityCards`:
- `getPublicOpportunityDetail`:
- `listRecentOpportunitiesByAuthorProfile`:

Resumo:

- quantidade de ocorrencias antes:
- quantidade de ocorrencias depois:
- principais picos:

## 4) Banco (EXPLAIN ANALYZE)

- Query 1 (timeline oportunidades): OK/ALERTA
- Query 2 (busca textual oportunidades): OK/ALERTA
- Query 3 (busca textual vagas): OK/ALERTA

Observacoes de plano:

- scans relevantes:
- indexes usados:
- risco residual:

## 5) Integridade funcional

- feed distribuindo cards corretamente: SIM/NAO
- abertura de detalhe correta: SIM/NAO
- CTA de contato funcionando: SIM/NAO
- consistencia feed/oportunidades/vagas: SIM/NAO

## 6) Decisao

- Status final: GO / NO-GO
- Justificativa:
- Acoes cirurgicas pendentes (se houver):
