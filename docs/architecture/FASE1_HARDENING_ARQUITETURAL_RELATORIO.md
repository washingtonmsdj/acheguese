# FASE 1 - Hardening Arquitetural (Gate-First)

Gerado em: 2026-05-17T00:00:00-03:00
Atualizado em: 2026-05-18T00:35:00-03:00

## Problemas encontrados
- Dependencias ciclicas reais entre modulos: removidas nos pontos criticos mapeados (profile/professional e mobility UI).
- Acoplamento de acesso DB em services com tipagem quebrada (overloads `never` no client Supabase).
- Inconsistencias de contrato entre dominios (`core/business`, `modules/profile`, `modules/professionals`).
- Arquivos grandes e duplicacao estrutural (principalmente community e alguns services core).

## Modulos mais criticos
- community
- mobility
- profile/professional
- admin
- landing/routing

## Arquivos mais problematicos
- `src/core/profiles/services/ProfileService.ts`
- `src/core/posts/services/PostService.ts`
- `src/core/professional/services/ProfessionalService.ts`
- `src/core/admin/services/AdminProfileGovernanceService.ts`
- `src/modules/classifieds/jobs/pages/PublicarVagaPage.tsx`
- `src/modules/mobility/core/RideOperationalService.ts`
- `src/core/residence/ResidenceManager.ts`

## Riscos arquiteturais
- Debt de contratos tipados entre camadas em `core/business` e `modules/profile`.
- Duplicacoes amplas em community (components/hooks/services paralelos).
- Services muito extensos com responsabilidades mistas (ainda sem fatiamento completo nesta fase).

## Melhorias aplicadas
- Gates arquiteturais estabilizados:
  - `validate:deps`: PASS (0 ciclos, 0 violacoes)
  - `validate:architecture:incremental -- --strict --json`: PASS (`[]`)
  - `validate:architecture:governance -- --json`: PASS (`[]`)
  - `validate:taxonomy`: PASS
  - `validate:ssot`: PASS (0 violacoes)
  - `check:ssot`: PASS (0 violacoes)
- Normalizacao de boundaries em services criticos (remocao de acesso direto indevido e uso de service/client canonico).
- Remocao de ciclos de tipos em mobility com extracao de contrato compartilhado (`MobilityRide`) e desacoplamento de imports cruzados em cadeia.
- Consolidacao de uso de `NotificationService` no fluxo de notificacao de delivery.
- Ajustes incrementais em `admin` e `billing` para reduzir falhas estruturais de tipagem sem alterar UX.
- Fechamento de violacoes de layer `modules -> integrations` em:
  - `src/modules/business/education/services/EducationObservabilityService.ts`
  - `src/modules/business/education/services/EducationTrackingService.ts`
  substituindo import indevido de `Json` por tipo local no dominio.
- Fechamento de violacao de layer `modules -> integrations` em:
  - `src/modules/mobility/services/DriverModerationEventsService.ts`
  substituindo import indevido por tipo `Json` de owner permitido (`shared`).
- Correcoes finais de tipagem para fechamento do gate:
  - `src/modules/mobility/core/RideStateMachine.ts`
  - `src/modules/mobility/hooks/useRideHistory.ts`
  - `src/modules/mobility/hooks/useRideReports.ts`
  - `src/modules/mobility/pages/BuscandoMotoristaPage.tsx`
  - `src/modules/mobility/pages/CriarMotoristaPage.tsx`
  - `src/modules/business/gastronomy/services/OrderService.ts`
  - `src/modules/business/gastronomy/services/menu.queries.ts`
  - `src/modules/classifieds/jobs/services/VagasService.ts`

## Pendencias restantes
- `npm run lint` com 4 warnings não bloqueantes:
  - `src/core/maps/components/v3/MapLibreAdapter.tsx` (`maps/no-manual-entity-projection`)
  - `src/modules/community/components/MessagesInbox.tsx` (`react-hooks/exhaustive-deps`)
  - `src/modules/community/nearby/components/NearbyCard.tsx` (`react-hooks/exhaustive-deps`)
  - `src/shared/components/ui/sidebar-maker.tsx` (`react-refresh/only-export-components`)
- Smoke E2E (`test:e2e:mobile`, `test:e2e:operations`) permanece pendente para rodada dedicada de regressao funcional.
- Fatiamento de arquivos gigantes e remocao de duplicacao ampla ficam para fase posterior dedicada.

## Score de estabilidade arquitetural
- Baseline estimado: **70/100**
- Score atual (gate-first, arquitetura/governanca/ssot/deps/typecheck): **89/100**
- Justificativa do score:
  - Gates arquiteturais e SSOT automatizados aprovados.
  - Ciclos e boundaries criticos tratados.
  - Debt restante concentrado em contratos de tipagem e consolidacao estrutural de modulos grandes.

## Evidencias de validacao (execucao atual)
- `npm run validate:deps` -> PASS
- `npm run validate:architecture:incremental -- --strict --json` -> `[]`
- `npm run validate:architecture:governance -- --json` -> `[]`
- `npm run validate:taxonomy` -> PASS
- `npm run validate:ssot` -> PASS
- `npm run check:ssot` -> PASS
- `npm run lint` -> PASS com 1 warning
- `npm run lint` -> PASS com 4 warnings
- `npm run typecheck:app -- --pretty false` -> PASS

## Conclusao desta fase
A fundacao arquitetural gate-first foi estabelecida com sucesso para dependencias, boundaries, governanca, SSOT e tipagem de aplicacao. Permanecem apenas warnings de lint e refactors estruturais nao bloqueantes para fases seguintes.
