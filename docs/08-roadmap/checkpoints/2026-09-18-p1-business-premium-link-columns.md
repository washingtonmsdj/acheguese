# Checkpoint 2026-09-18 — P1: boundary por coluna de premium links

## Achado

`business_premium_links` possui leitura pública legítima para resolver
`/p/:slug`, e a RLS owner permite gestão por perfis autorizados.

O problema era o grant de tabela:

- `anon` tinha SELECT de tabela;
- `authenticated` tinha SELECT/INSERT/UPDATE/DELETE de tabela;
- por consequência, INSERT/UPDATE permitiam também `id`, `created_at` e
  `updated_at`, apesar desses campos possuírem default/trigger server-side;
- uma coluna futura entraria automaticamente no contrato browser.

A busca de runtime encontrou leitura em `BusinessUrlService`, mas nenhum
INSERT/UPDATE/DELETE direto da tabela.

## Mudança remota

Migration aplicada:

`20260918134639_bound_business_premium_link_browser_columns`

Ela preserva a semântica atual e troca autoridade de tabela por autoridade por
coluna:

- SELECT: `id,business_id,slug,created_at,updated_at` para
  `anon/authenticated`;
- INSERT: somente `business_id,slug` para `authenticated`;
- UPDATE: somente `slug` para `authenticated`;
- DELETE permanece owner-scoped pela policy RLS existente;
- `service_role` mantém autoridade completa;
- `id/created_at/updated_at` não podem ser fornecidos/alterados pelo browser;
- `business_id` não pode ser reassociado via UPDATE.

## Validação live

Após a migration:

- table SELECT=false para anon/authenticated;
- table INSERT=false para authenticated;
- table UPDATE=false para authenticated;
- DELETE authenticated=true, sujeito à RLS owner;
- `slug SELECT=true` para anon;
- `business_id INSERT=true` e `slug INSERT=true` para authenticated;
- `slug UPDATE=true`;
- `id INSERT=false`;
- `business_id UPDATE=false`;
- `created_at/updated_at UPDATE=false`.

## Ratchet

`tests/security/business-premium-link-authority.test.ts` protege:

- leitura pública explícita;
- ausência de wildcard no resolver;
- fields server-owned fora de mutações;
- runtime atual sem writer direto;
- migrations futuras não podem restaurar grants de tabela nem reautorizar
  ID/timestamps/business_id em operações inadequadas.

## Limites

Este corte não muda o slug existente, entitlement, URL pública ou policy owner.
Ele apenas torna a autoridade atual fail-closed para evolução de schema.
