# Roadmap e execução

Esta pasta contém somente planos ainda relevantes. Ela não é um arquivo histórico e não deve acumular handoffs concluídos, auditorias encerradas ou roadmaps substituídos.

## Execução atual do MVP

1. [`EXECUCAO_MAIN_ONLY.md`](./EXECUCAO_MAIN_ONLY.md) — **SSOT operacional atual**; escopo, blocker, gates e Definition of Done.
2. [`NEXT-STEPS.md`](./NEXT-STEPS.md) — resumo curto da sequência até MVP READY.

Se houver conflito entre qualquer outro plano desta pasta e esses dois documentos sobre o lançamento atual, `EXECUCAO_MAIN_ONLY.md` vence.

## Planos futuros / não bloqueadores do MVP

- [`CORE_PLATFORM_CONSOLIDATION_PLAN.md`](./CORE_PLATFORM_CONSOLIDATION_PLAN.md) — consolidação transversal ainda não concluída por depender de evidências de staging/carga; não é requisito para ativar domínios pausados no MVP atual.
- [`COMMUNITY_SCALE_READINESS_PLAN.md`](./COMMUNITY_SCALE_READINESS_PLAN.md) — preparação futura de Community para escala; Community permanece `paused`.
- [`MONOREPO_MIGRATION_PLAN.md`](./MONOREPO_MIGRATION_PLAN.md) — proposta histórica/futura de mobile/monorepo; não faz parte da certificação web atual e não deve ser usada como estimativa vigente sem revalidação.

## Evidências datadas

- [`checkpoints/`](./checkpoints/) — snapshots e marcos de execução. Servem como evidência histórica, não como estado corrente.

## Regras de higiene

- plano concluído ou substituído sai desta pasta e vai para `docs/10-archive/` ou permanece apenas no Git;
- handoff encerrado não permanece como “ativo”;
- documento futuro deve declarar explicitamente que não bloqueia o MVP quando o domínio relacionado estiver pausado;
- não fixar SHA como “main atual” em plano vivo;
- o lifecycle executável em `src/app/config` sempre prevalece sobre texto de roadmap.
