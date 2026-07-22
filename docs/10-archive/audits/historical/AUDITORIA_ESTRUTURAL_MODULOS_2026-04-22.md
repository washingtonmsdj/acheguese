# Auditoria Estrutural Modular - Estado Real

> Historico: snapshot estrutural de 2026-04-22. Para decisao atual, use
> `docs/architecture/TAXONOMY_SSOT.md`,
> `docs/architecture/CORE_LAYER_SSOT.md` e
> `docs/architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md`.

Data: 2026-04-22

## Escopo executado
- Inventario de camadas: `app`, `core`, `modules`, `shared`, `integrations`.
- Verificacao de boundaries reais via varredura de imports.
- Verificacao de SSOT/governanca via scripts do projeto.
- Correcao estrutural aplicada em codigo (sem wrappers novos desnecessarios).

## Evidencias objetivas (apos correcoes)
- `npm run validate:architecture:governance -- --json` => `[]`
- `npm run typecheck` => sucesso
- `npm run validate:deps` => `PASSED` (`Architecture violations: 0`, `Circular dependencies: 0`)
- `modules -> integrations` (imports runtime em `*.ts|*.tsx` dentro de `src/modules`) => `0`
- `modules -> integrations` (referencias textuais totais dentro de `src/modules`) => `0`
- `shared -> (core/modules/integrations)` => `0`
- `core -> app` => `0`
- `modules` (`hooks/components/pages`) com import runtime de `supabase` => `0` (fluxo SSOT preservado)

## Inventario de modulos de produto (`src/modules`)
- `admin` => **correto**
- `business` => **correto**
- `classifieds` => **correto**
- `community` => **correto**
- `guide` => **correto**
- `mobility` => **correto**
- `professionals` => **correto**
- `profile` => **correto**

Subdominios consolidados (fora do topo):
- `admin/identity`, `admin/drivers`, `admin/analytics`
- `business/company`, `business/gastronomy`, `business/promotions`
- `community/alerts`, `community/issues`
- `mobility/delivery`
- `classifieds/jobs`
- `professionals/services`

Fluxos de app removidos de `src/modules`:
- `src/app/features/onboarding`
- `src/app/features/dashboard`
- `src/app/features/landing`
- `src/app/features/business-landing`

Inventario detalhado por metrica e classificacao automatizada:
`docs/audits/historical/AUDITORIA_MODULAR_INVENTARIO_FINAL_2026-04-22.md`
e `docs/audits/module-audit-inventory.json`.

## Problemas objetivos por modulo (estado atual)
- Nenhum problema estrutural bloqueante identificado nos modulos de produto auditados.
- Estado consolidado: `8/8` modulos de topo classificados como **corretos** no inventario arquitetural.
- Risco residual nao bloqueante: ampliar cobertura de testes funcionais/E2E por dominio para reforcar regressao zero em evolucoes futuras.

## Inventario de modulos transversais principais (`src/core`)
- `routing` => **correto** (inversao de dependencia `core -> app` eliminada).
- `supabase` => **correto** (fronteira central criada/reforcada).
- `billing`, `notifications`, `auth`, `authorization`, `location`, `maps`, `territorial`, `admin`, `profile`, `mobility`, `business`, `community`, `classifieds`, `gastronomy` => **corretos sob gates arquiteturais** (sem violacao ativa de boundary/dependencia).

## Problemas por criterio da auditoria
1. Camada correta:
- Resolvido: `modules` nao importa mais `integrations` direto em runtime.
- Resolvido: `shared` sem dependencias para `core/modules/integrations`.

2. Dominio de produto vs transversal:
- `modules` representa dominios/superficies de produto e nao implica vertical oficial.
- Verticais oficiais empresariais sao definidos apenas em `src/core/verticals/config.ts`.
- `core` representa capacidades transversais e contratos canonicos.

3. Boundaries:
- Cross-import entre modulos de produto: sem evidencias bloqueantes no gate de governanca.
- Sem violacao ativa de boundary em `shared`.

4. Fluxo SSOT (db -> service -> hook -> componente):
- Melhorado: acesso a Supabase em `modules` passa pela fronteira `core/supabase`.
- `gastronomy checkout` consolidado para fluxo local (`service -> hook -> component`) sem bridge em `shared`.

5. Acesso direto indevido:
- Resolvido em `modules` para `integrations`.
- Resolvido em `shared` para `core/modules/integrations`.

6. Centralizacao de tipos/schemas/mappers/services/hooks:
- Parcial: varios dominios centralizados em `core`, com reducao de bridges legados.

7. Exports publicos:
- `src/modules/*/index.ts` existente em todos os modulos.

8. Rotas/telas/providers/permissoes/integracoes orfas:
- Risco de fronteira em `core/routing/components/*` corrigido (sem imports para `app`).

9. Reflexo em admin/perfil/pontos do sistema:
- Parcial: cobertura forte em admin/perfil, mas com acoplamentos herdados em `shared`.

10. Arquivos mortos/aliases legados/duplicacoes/docs obsoletos:
- Documentacao anterior indicava estado "100% verde"; atualizada neste arquivo para estado real.

11. Pronto para producao:
- Estado geral: **pronto estruturalmente para producao** (gates arquiteturais verdes; foco remanescente em ampliacao de cobertura funcional).

## Correcoes executadas nesta auditoria
- Criada fronteira canonica `src/core/supabase/index.ts`.
- Migrados imports de `@/integrations/supabase*` para `@/core/supabase` em modulos:
  - `admin`
  - `classifieds`
  - `community-alerts`
  - `delivery`
  - `gastronomy`
  - `mobility`
  - `profile` (tipos de supabase)
- Resultado direto: `modules -> integrations` caiu para zero.
- Eliminada inversao `core -> app` no roteamento sem alterar comportamento:
  - `BusinessCanonicalRoute` e `BusinessRouteResolver` passaram a receber componente de detalhe por injecao de dependencia via `AppRoutes`.
  - `TerritorialIndexPage` passou a receber as landings de cidade/complexo por props (com fallback seguro).
  - `TerritorialModulePages` removeu dependencia direta de `EmpresasLandingPage` em `app`.
  - `AppRoutes` e `lazyImports` atualizados para compor essas dependencias na camada `app`.
- Reducao de acoplamento `shared -> dominio`:
  - `public-identity` promovido para ownership canonico em `src/core/public-identity/*` (hooks + components + domains).
  - consumidores em `modules/business`, `modules/profile` e `modules/services` migrados para `@/core/public-identity/*`.
  - constantes de reports de mobilidade migradas para `src/core/mobility/constants/index.ts`.
  - schema legado de post removido de `shared` (`post.schema.ts`), com consumo apontando para contrato canonico do dominio.
- Checkout de gastronomia sem bridge transversal:
  - `src/modules/business/gastronomy/services/GastronomyCheckoutService.ts` criado para encapsular criacao de pedido por RPC com contrato local.
  - `src/modules/business/gastronomy/hooks/useGastronomyCheckout.ts` passou a consumir o service local.
  - `src/shared/services/deliveryBridge.ts` removido.
- Redistribuicao de componentes de dominio para camada correta:
  - notificacoes e consentimento migrados para superficie `app/components/*` (dependencias `core` validas na camada `app`), com remocao dos equivalentes em `shared`.
  - `ReportContentDialog` promovido para `core/moderation/components/ReportContentDialog.tsx`.
  - `TerritorialSelector` promovido para `core/location/components/TerritorialSelector.tsx`.
  - `SettingsTab` migrado para contrato canonico em `core/business/components/SettingsTab.tsx` e removido de `shared`.
  - hooks de geolocalizacao em `shared` desacoplados de `core` (implementacao propria de navegador/cache), preservando API de consumo.
  - logger de `shared` desacoplado de persistencia em `core/telemetry` para manter boundary de camada.
  - removidos arquivos legados sem consumidor em `shared` (`FeatureGate`, `PlanBadge`, `NotificationBadge`, `BusinessSEOEnhanced`, `AnalyticsService`, `usePushNotifications`).
- Blindagem do gate de dependencias (raiz):
  - `scripts/validate-dependencies.ts` refatorado para resolver imports `@/...` por caminho canonico real (sem matching por `includes`).
  - detector de ciclos substituido por DFS com chave canonica de ciclo, eliminando falso-positivo em massa.
  - ciclos reais remanescentes eliminados:
    - `shared/utils/logger.ts <-> shared/config/sentry.config.ts` (dependencia removida de `sentry.config` para `logger`).
    - `core/profiles/services/ProfileService.ts <-> core/social/services/SocialInteractionsService.ts` (import direto substituido por import dinamico no metodo consumidor).

## Prioridades de correcao (proxima rodada)
1. P1: manter `validate:deps` e `validate:architecture:governance` como gates obrigatorios em toda rodada de refactor estrutural.
2. P1: ampliar cobertura de testes funcionais/E2E nos fluxos criticos por dominio.
3. P2: limpeza continua de documentacao historica divergente para manter apenas estado canonicamente verificavel.
