# Planos do Projeto — root legado em retirada

Status: TRANSITORIO — G2
Data de reorganizacao: 2026-08-29

`plans/` nao e mais owner de novos planos. Nao adicionar arquivos aqui.

## Roadmaps ativos canonicos

- `docs/08-roadmap/CORE_PLATFORM_CONSOLIDATION_PLAN.md`
- `docs/08-roadmap/COMMUNITY_SCALE_READINESS_PLAN.md`

## Historico concluido

Planos de implementacao concluidos pertencem a `docs/10-archive/plans/`.

Nesta reorganizacao foram classificados para archive, entre outros:

- `SECURITY_AUTHORITY_IMPLEMENTATION_PLAN.md`;
- `COMMUNITY_CONNECTORS_RELIABILITY_PLAN.md`;
- `COMMUNITY_PAGE_CONCEPT_IMPLEMENTATION_PLAN.md`;
- `COMMUNITY_PERSISTENT_SHELL_IMPLEMENTATION_PLAN.md`;
- `COMMUNITY_PRODUCTION_HARDENING_PLAN.md`;
- `HOME_REAL_PRODUCT_COMPLETION_PLAN.md`.

## Passivo ainda presente neste root

### `COMMUNITY_FIRST_ARCHITECTURE_PLAN.md`

Plano concluido que ainda e referenciado por `tools/architecture/validate-project-taxonomy.ts` e `tools/architecture/architecture-registry.ts`. Deve ser movido para `docs/10-archive/plans/` somente no mesmo corte que migrar esses consumidores tecnicos.

### `CORE_PLATFORM_CONSOLIDATION_PLAN.md`

Ponteiro temporario para o owner canonico em `docs/08-roadmap/CORE_PLATFORM_CONSOLIDATION_PLAN.md`. Permanece apenas enquanto manifests documentais ainda usam literalmente o path antigo.

## Gate para remover `plans/`

1. migrar os consumidores tecnicos de `COMMUNITY_FIRST_ARCHITECTURE_PLAN.md` para o archive;
2. migrar os consumidores restantes do ponteiro Core Platform para `docs/08-roadmap/`;
3. apagar os dois paths legados e este README;
4. adicionar `plans/` ao ratchet de roots aposentados da reorganizacao global.
