# Planos do Projeto

Status: transição controlada para `docs/**`
Data: 2026-08-28

Esta pasta é temporária durante a reorganização G2. Planos ativos devem terminar em `docs/08-roadmap/**`; planos concluídos devem terminar em `docs/10-archive/plans/**`. Nenhum plano substitui os SSOTs canônicos do projeto.

## Planos ativos — ainda no root temporário

- [Core Platform Consolidation](./CORE_PLATFORM_CONSOLIDATION_PLAN.md)
- [Security Authority - plano de implementação](./SECURITY_AUTHORITY_IMPLEMENTATION_PLAN.md)
- [Community Scale Readiness](./COMMUNITY_SCALE_READINESS_PLAN.md)

Esses três ainda possuem referências operacionais vivas e serão movidos para `docs/08-roadmap/**` somente com atualização atômica de seus consumidores.

## Planos concluídos — arquivados

- [Community Page Concept - implementação](../docs/10-archive/plans/COMMUNITY_PAGE_CONCEPT_IMPLEMENTATION_PLAN.md)
- [Community Persistent Shell - implementação](../docs/10-archive/plans/COMMUNITY_PERSISTENT_SHELL_IMPLEMENTATION_PLAN.md)
- [Community Production Hardening](../docs/10-archive/plans/COMMUNITY_PRODUCTION_HARDENING_PLAN.md)
- [Home real, anúncios, ranking e SSOT](../docs/10-archive/plans/HOME_REAL_PRODUCT_COMPLETION_PLAN.md)

## Planos concluídos — aguardando migração coordenada

- [Community First Architecture - plano de arquitetura](./COMMUNITY_FIRST_ARCHITECTURE_PLAN.md) — concluído, mas ainda referenciado por guards/registry; será arquivado no mesmo corte que atualizar esses consumidores.
- [Community Connectors Reliability](./COMMUNITY_CONNECTORS_RELIABILITY_PLAN.md) — concluído, mas ainda referenciado pelo plano ativo de Security Authority; será arquivado quando esse plano for reconciliado.

## Regras Para Novos Planos

- Não criar novos arquivos em `plans/**`.
- Roadmap ativo pertence a `docs/08-roadmap/**`.
- Histórico concluído pertence a `docs/10-archive/plans/**`.
- Registrar objetivo, escopo, fora de escopo e definição de pronto.
- Apontar para docs, tooling, migrations e testes canônicos existentes.
- Evitar criar fonte paralela de verdade.
- Separar claramente plano de implementação real.
- Manter checklist executável para continuidade futura.
