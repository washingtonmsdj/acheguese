# Checkpoint 2026-09-18 — P1: boundary por coluna do histórico territorial

## Contexto

As tabelas de governança territorial possuem um contrato legítimo de histórico
oficial público e append administrativo:

- `location_versions`;
- `territory_change_events`;
- `postal_code_history`.

A migration histórica `20260830061304_tighten_governance_history_browser_grants`
concedia SELECT de tabela a `anon/authenticated` e INSERT de tabela a
`authenticated`, sempre sob RLS de escrita admin.

## Mudança remota encontrada

O ledger remoto contém a migration posterior:

`20260918132546_bound_governance_history_browser_columns`

Ela já havia sido aplicada no Supabase, mas ainda não estava materializada na
`main`.

O corte:

- revoga grants de tabela das três relações;
- regranta SELECT somente nas colunas públicas atuais;
- regranta INSERT somente nas colunas que o admin/browser pode fornecer;
- mantém `service_role` com autoridade completa;
- esconde `location_versions.created_by` do browser;
- esconde `territory_change_events.processed_by` do browser;
- impede INSERT de timestamps/actor metadata server-owned;
- faz novas colunas nascerem privadas por padrão.

## Bug de runtime identificado

Com column privileges, wildcard deixa de ser compatível. O
`GovernanceRepositorySupabase` ainda usava:

- `select("*")` nas leituras;
- `.select()` nos receipts de INSERT.

Essas chamadas poderiam falhar após o hardening remoto por tentarem projetar
colunas não concedidas.

## Correção

O repository agora possui três projeções explícitas:

- `LOCATION_VERSION_PUBLIC_COLUMNS`;
- `TERRITORY_CHANGE_EVENT_PUBLIC_COLUMNS`;
- `POSTAL_CODE_HISTORY_PUBLIC_COLUMNS`.

As leituras e receipts usam essas projeções. Os tipos públicos também deixam de
prometer `created_by` e `processed_by`, que são metadados de ator
server/admin e não possuem consumer runtime.

## Verificação

O estado live foi consultado por `information_schema.column_privileges`:

- `anon/authenticated` têm SELECT somente nas colunas públicas revisadas;
- `authenticated` tem INSERT somente nas colunas de comando permitidas;
- `created_by` e `processed_by` não são browser-readable;
- `service_role` preserva autoridade completa.

## Ratchet

`tests/security/governance-history-authority.test.ts` agora:

- preserva a provenance do baseline original;
- exige a migration de column boundary;
- exige projeções explícitas no repository;
- impede actor metadata nos tipos públicos;
- proíbe migrations posteriores de restaurar SELECT de tabela ou ampliar
  mutações de browser.

## Limites

Este corte não torna o histórico privado. O histórico oficial continua público
por decisão de produto/governança. Apenas metadados internos de operador e
colunas futuras ficam fail-closed.
