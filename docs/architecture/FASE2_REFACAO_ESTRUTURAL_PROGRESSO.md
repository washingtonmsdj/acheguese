# FASE 2 - Refatoracao Estrutural Profunda (Debt Burn-down)

Gerado em: 2026-05-18T00:00:00-03:00
Atualizado em: 2026-05-18T01:20:00-03:00
Atualizado em: 2026-05-18T01:45:00-03:00
Atualizado em: 2026-05-18T02:05:00-03:00
Atualizado em: 2026-05-18T02:35:00-03:00
Atualizado em: 2026-05-18T02:55:00-03:00
Atualizado em: 2026-05-18T03:20:00-03:00
Atualizado em: 2026-05-18T03:45:00-03:00
Atualizado em: 2026-05-18T04:10:00-03:00

## Objetivo
Reduzir divida estrutural de modulos criticos apos a estabilizacao gate-first da Fase 1, mantendo SSOT, boundaries e comportamento funcional.

## Baseline de arquivos criticos (linhas)
- `src/core/profiles/services/ProfileService.ts`: 2697
- `src/core/posts/services/PostService.ts`: 2369
- `src/core/professional/services/ProfessionalService.ts`: 1778
- `src/core/admin/services/AdminProfileGovernanceService.ts`: 1765
- `src/modules/classifieds/jobs/pages/PublicarVagaPage.tsx`: 1370
- `src/modules/mobility/core/RideOperationalService.ts`: 1312

## Progresso aplicado nesta etapa
- Iniciada modularizacao de `PublicarVagaPage` com extracao de contratos/constantes/utilitarios puros para:
  - `src/modules/classifieds/jobs/pages/publicarVaga.shared.ts`
- `PublicarVagaPage` passou a consumir shared local para:
  - `STEPS` e `StepId`
  - mapas de labels (`contrato`, `modalidade`, `nivel`)
  - beneficios sugeridos
  - helpers puros de lista
  - helpers de salario (`parse` e `resolve mode`)
  - resolucao de rota de retorno (`buildVagasListPath`)
- Reducao de duplicacao interna com extracao de blocos repetidos para componentes compartilhados de step em:
  - `src/modules/classifieds/jobs/pages/steps/shared.tsx`
- Extracao completa dos steps para arquivos dedicados:
  - `src/modules/classifieds/jobs/pages/steps/InfoStep.tsx`
  - `src/modules/classifieds/jobs/pages/steps/DetailsStep.tsx`
  - `src/modules/classifieds/jobs/pages/steps/SalaryStep.tsx`
  - `src/modules/classifieds/jobs/pages/steps/LocationStep.tsx`
  - `src/modules/classifieds/jobs/pages/steps/ContactStep.tsx`
  - `src/modules/classifieds/jobs/pages/steps/PreviewStep.tsx`
  - barrel: `src/modules/classifieds/jobs/pages/steps/index.ts`
- Extracao de chrome/layout da pagina para componente dedicado:
  - `src/modules/classifieds/jobs/pages/publicarVaga.chrome.tsx`
  - blocos movidos: header, banner de permissao, acoes fixas de rodape
- Arquivo monolitico removido:
  - `src/modules/classifieds/jobs/pages/publicarVaga.steps.tsx`
- Extracao do fluxo de publicacao para servico de aplicacao do modulo:
  - `src/modules/classifieds/jobs/services/VagasPublishWorkflowService.ts`
- Extracao da validacao de pre-publicacao para utilitario puro:
  - `src/modules/classifieds/jobs/pages/publicarVaga.validation.ts`
- Novo gate de regressao estrutural por tamanho de arquivo critico:
  - `scripts/validate-critical-file-sizes.ts`
  - script npm: `validate:architecture:file-sizes`

## Validacao da etapa
- `npm run -s validate:deps`: PASS
- `npm run -s validate:architecture:incremental -- --strict --json`: PASS (`[]`)
- `npm run -s validate:architecture:governance -- --json`: PASS (`[]`)
- `npm run -s validate:taxonomy`: PASS
- `npm run -s validate:ssot`: PASS
- `npm run -s check:ssot`: PASS
- `npm run -s validate:architecture:file-sizes`: PASS
- `npm run -s typecheck:app -- --pretty false`: PASS
- `npm run -s lint`: PASS com 4 warnings preexistentes (nao bloqueantes)
- Tamanho atual:
  - `PublicarVagaPage.tsx`: 548 linhas
  - `steps/InfoStep.tsx`: 160 linhas
  - `steps/DetailsStep.tsx`: 126 linhas
  - `steps/SalaryStep.tsx`: 99 linhas
  - `steps/LocationStep.tsx`: 72 linhas
  - `steps/ContactStep.tsx`: 92 linhas
  - `steps/PreviewStep.tsx`: 194 linhas
  - `steps/shared.tsx`: 193 linhas
  - `publicarVaga.shared.ts`: 134 linhas
  - `publicarVaga.chrome.tsx`: 214 linhas

## Pendencias imediatas (proximos cortes)
1. Reduzir responsabilidades de `ProfileService` em slices por caso de uso (`queries`, `mutations`, `identity`, `permissions`).
2. Consolidar duplicacoes `core/community` vs `modules/community` com owners canonicos e deprecacao explicita.
3. Evoluir o gate de tamanho com budgets por tendencia de reducao para os demais arquivos criticos (hoje em modo baseline/warn).

## Criterio de aceite da Fase 2 (parcial)
- Reducao mensuravel de tamanho e acoplamento nos 6 arquivos criticos.
- Zero regressao em `validate:*`, `typecheck`, `lint`, e smoke E2E aplicavel.
