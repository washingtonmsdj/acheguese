# Checkpoint 2026-09-18 — P1: boundary de colunas da governança territorial

## Contexto

As tabelas de histórico territorial foram deliberadamente mantidas como:

- leitura pública;
- append autenticado protegido por RLS admin;
- autoridade completa de `service_role`.

Esse contrato foi estabelecido em
`20260830061304_tighten_governance_history_browser_grants.sql`.

A auditoria de 2026-09-18 encontrou que o contrato ainda usava grants de tabela.
Isso fazia duas coisas indesejadas:

1. qualquer coluna futura entraria automaticamente no histórico público;
2. campos de ator/auditoria podiam ser lidos ou fornecidos pelo browser.

## Campos afetados

### `location_versions`

`created_by` é metadata de ator e não faz parte do histórico oficial público.
Não possui default nem trigger de derivação server-side.

### `territory_change_events`

`processed_by` é metadata de ator. `processed_at` também não deve ser
fornecido pelo writer browser append-only.

### `postal_code_history`

Não possui coluna de ator, mas também foi convertido para grants explícitos para
que novas colunas nasçam privadas por padrão.

## Migration remota

Aplicada:

`20260918132546_bound_governance_history_browser_columns`

A migration:

- revoga grants de tabela de `PUBLIC`, `anon` e `authenticated`;
- regranta apenas as colunas oficiais de leitura a `anon/authenticated`;
- mantém `created_by` e `processed_by` fora da leitura browser;
- regranta INSERT apenas nas colunas realmente aceitas pelo writer admin;
- impede INSERT browser de `created_by`, `processed_by`, `processed_at` e
  timestamps server-owned;
- preserva `service_role` com autoridade completa;
- não altera as policies RLS existentes.

## Validação live

Após a migration:

- as três tabelas têm `table SELECT=false` para browser;
- as colunas oficiais continuam com SELECT;
- `location_versions.created_by SELECT=false`;
- `territory_change_events.processed_by SELECT=false`;
- `table INSERT=false` para authenticated;
- INSERT por coluna continua disponível somente no payload canônico;
- campos de ator/auditoria não são inseríveis pelo browser.

O Security Advisor não adicionou finding ligado a este corte.

## Runtime

`GovernanceRepositorySupabase` passou a usar projeções explícitas:

- `LOCATION_VERSION_PUBLIC_COLUMNS`;
- `TERRITORY_CHANGE_EVENT_PUBLIC_COLUMNS`;
- `POSTAL_CODE_HISTORY_PUBLIC_COLUMNS`.

Os campos ocultos e nulláveis de ator são normalizados para `null` no contrato
browser, mantendo o shape TypeScript sem expor IDs internos.

## Ratchet

`tests/security/governance-history-authority.test.ts` agora impede:

- retorno a `select("*")` nas três tabelas;
- grant de tabela SELECT/INSERT para browser após este boundary;
- reexposição de `created_by` ou `processed_by`;
- expansão de UPDATE/DELETE ou mutação anônima já proibida pelo baseline G5.

## Limites

Este corte não privatiza o histórico oficial e não muda seus dados.
Também não redesenha a autorização admin. Ele apenas faz a superfície Data API
seguir least privilege por coluna e fail-closed para evolução futura.
