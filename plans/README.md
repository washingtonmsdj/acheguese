# Planos do Projeto — root legado em retirada

Status: TRANSITORIO — G2
Data de reorganizacao: 2026-08-29

`plans/` nao e mais owner de novos planos. Nao adicionar arquivos aqui.

## Roadmaps ativos canonicos

- `docs/08-roadmap/CORE_PLATFORM_CONSOLIDATION_PLAN.md`
- `docs/08-roadmap/COMMUNITY_SCALE_READINESS_PLAN.md`

## Historico concluido

Planos de implementacao concluidos pertencem a `docs/10-archive/plans/`.

O plano Community First tambem foi arquivado depois de migrar seus consumidores
tecnicos para o endereco historico canonico.

## Passivo ainda presente neste root

### `CORE_PLATFORM_CONSOLIDATION_PLAN.md`

Ponteiro temporario para o owner canonico em
`docs/08-roadmap/CORE_PLATFORM_CONSOLIDATION_PLAN.md`. Permanece apenas enquanto
dois manifests documentais grandes ainda usam literalmente o path antigo.

## Gate para remover `plans/`

1. migrar `docs/architecture/core-platform-ownership.json` para o roadmap canonico;
2. migrar `docs/03-architecture/authorization-enforcement-map.json` para o roadmap canonico;
3. apagar `plans/CORE_PLATFORM_CONSOLIDATION_PLAN.md` e este README;
4. adicionar `plans/` ao ratchet de roots aposentados da reorganizacao global.
