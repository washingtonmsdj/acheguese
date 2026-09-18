# Checkpoint 2026-09-18 — P1: boundary público de catálogo

## Achado

O catálogo comercial já tinha um hardening específico para
`catalog_pricing_policy`: browser recebe somente preço exibível de itens publicados,
sem IDs/lookup keys Stripe.

Dois contratos antigos ainda estavam mais amplos:

- `catalog_eligibility_rule` possuía leitura pública irrestrita (`USING true`)
  apesar de não existir caller de browser;
- `catalog_entitlement_policy` também possuía `USING true`, permitindo
  enumerar entitlements inclusive de itens em versões draft/deprecated por
  consulta direta.

## Uso runtime

A busca de source confirmou:

- `CatalogService` lê `catalog_item`, `catalog_entitlement_policy` e
  `catalog_pricing_policy` para exibir/resolver catálogo publicado;
- `catalog_eligibility_rule` não possui caller de browser;
- checkout/webhook e brokers de Mobility usam autoridades server-side;
- o conjunto de colunas de entitlement usado por `CatalogService` já é
  explícito.

## Mudança remota

Migration aplicada no Supabase:

`20260918123823_harden_catalog_eligibility_entitlement_boundary`

Ela:

1. remove a policy pública de `catalog_eligibility_rule`;
2. revoga todos os privilégios de `PUBLIC`, `anon` e `authenticated` nessa
   tabela;
3. preserva autoridade completa de `service_role`;
4. substitui a policy pública ampla de `catalog_entitlement_policy` por
   `catalog_entitlement_policy_published_read`;
5. restringe linhas de entitlement a itens pertencentes a versões
   `published`;
6. revoga grants de tabela e regranta apenas as colunas de entitlement usadas
   pelo contrato browser;
7. mantém `created_at` e `updated_at` fora da projeção pública;
8. preserva `service_role` como writer/reader completo.

## Verificação

A própria migration falha se:

- qualquer papel de browser ainda puder ler `catalog_eligibility_rule`;
- existir policy de SELECT ampla `USING true` em
  `catalog_entitlement_policy`;
- `created_at` ou `updated_at` permanecerem legíveis pelo browser.

O Security Advisor remoto após a aplicação não adicionou finding ligado a estas
tabelas. Os findings restantes são os débitos globais já conhecidos do projeto.

## Ratchet

`tests/security/catalog-public-boundary-security.test.ts` protege:

- elegibilidade server-only;
- entitlement público somente em catálogo publicado;
- grants explícitos de coluna alinhados ao `CatalogService`;
- ausência de `created_at/updated_at` na projeção pública;
- migrations futuras não podem restaurar SELECT público de elegibilidade,
  `USING true` de entitlement ou SELECT de tabela inteira sem quebrar o gate.

## Limites

Este corte não altera preços, planos, entitlements ou eligibility data.
Também não muda checkout, Stripe, subscription materialization ou Mobility.
Ele reduz apenas a superfície de leitura do Data API e mantém a semântica do
catálogo publicado já consumida pelo runtime.
