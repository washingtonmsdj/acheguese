# Auditoria Estrutural Modular - Acheguese

> **Data**: 2026-04-20
> **Tipo**: Auditoria arquitetural ponta a ponta (camadas, SSOT, boundaries, exports, orfos, legado)
> **Metodo**: Varredura real do codigo (`grep`, `find`, analise de imports, contagem de barrels, comparacao core-modules)
> **Escopo**: `src/app`, `src/core`, `src/modules`, `src/shared`, `src/integrations` + pastas legadas (`src/pages`, `src/components`, `src/features`)

---

## 1. Inventario Real

### 1.1 Volumetria por camada

| Camada | Arquivos `.ts/.tsx` | Status | Observacao |
|---|---:|---|---|
| `src/app` | 46 | OK correta | Shell, rotas, providers |
| `src/core` | **746** | OK correta | 70 Subdominios transversais |
| `src/modules` | **1.347** | WARN mistura | 25 modulos (alguns verticais, outros transversais mal posicionados) |
| `src/shared` | 261 | OK correta | UI/utils compartilhados |
| `src/integrations` | 14 | OK correta | Supabase + maps |
| `src/components` | 7 | CRIT **legado** | Deve ir para `core/*` ou `modules/*` |
| `src/pages` | 11 | CRIT **legado** | Deve ir para `app/pages` ou modulos |
| `src/features` | 1 dir | CRIT **legado** | `features/nearby` -> mover |
| `src/config` | 4 | WARN ok temporario | Avaliar mover para `app/config` |

### 1.2 modulos em `src/modules/`

```
admin               admin-identidade    admin-motoristas    analytics
business            classifieds         community           community-alerts
community-issues    dashboard           delivery            empresa
empresas-landing    gastronomy          guide               landing
mobility            notifications       onboarding          professionals
profile             promotions          services            vagas
verification
```

### 1.3 Subdominios em `src/core/` (70)

Todos respeitam o padrao `core/<dominio>/{services,hooks,types,...}`. Nucleo esta saudavel.

---

## 2. Classificacao dos modulos

| Modulo | Camada atual | Tipo | Veredito | Severidade |
|---|---|---|---|:---:|
| `modules/admin` | modules | transversal | WARN parcial - deveria ser apenas UI; muita logica deveria estar em `core/admin` | M |
| `modules/admin-identidade` | modules | transversal | CRIT **incorreto** - sub-shell de admin, sem barrel, importa `modules/admin` | A |
| `modules/admin-motoristas` | modules | transversal | CRIT **incorreto** - idem `admin-identidade` | A |
| `modules/analytics` | modules | transversal | OK consolidado - ownership movido para `core/analytics`; modulo mantido como facade de compatibilidade | B |
| `modules/business` | modules | vertical | OK correto | - |
| `modules/classifieds` | modules | vertical | OK correto | - |
| `modules/community` | modules | vertical | OK correto | - |
| `modules/community-alerts` | modules | vertical | OK correto (CHECKLIST presente) | - |
| `modules/community-issues` | modules | vertical | OK correto (barrel exemplar) | - |
| `modules/dashboard` | modules | transversal | WARN - verificar duplicacao com `app` | B |
| `modules/delivery` | modules | vertical | WARN - fronteira com `gastronomy`/`mobility` precisa documentacao | M |
| `modules/empresa` | modules | vertical | CRIT **sem barrel**, importa `gastronomy` e `business` | A |
| `modules/empresas-landing` | modules | vertical | CRIT **sem barrel** | M |
| `modules/gastronomy` | modules | vertical | OK correto | - |
| `modules/guide` | modules | vertical | OK ok | - |
| `modules/landing` | modules | transversal | WARN - landing pages podem ir para `app/pages` | B |
| `modules/mobility` | modules | vertical | OK correto, mas alvo de cross-imports | - |
| `modules/notifications` | modules | transversal | WARN - mover para `core/notifications` (ja existe) | M |
| `modules/onboarding` | modules | transversal | CRIT **sem barrel** | M |
| `modules/professionals` | modules | vertical | CRIT **sem barrel** | A |
| `modules/profile` | modules | vertical | OK correto (barrel ok) | - |
| `modules/promotions` | modules | transversal | OK correto (delega a `core`) | - |
| `modules/services` | modules | vertical | OK correto (wrapper sobre `core/professional`) | - |
| `modules/vagas` | modules | vertical | OK correto | - |
| `modules/verification` | modules | transversal | WARN - duplica `core/verification` | M |

**Resumo**: 13 OK corretos  7 WARN parciais  5 CRIT incorretos.

---

## 3. Achados criticos (raiz dos problemas)

### 3.1 CRIT Pastas legadas vivas

| Pasta | Arquivos | Refs externas | Acao |
|---|---:|---:|---|
| `src/pages/` | 11 | 10 (todos `app/routes`) | Migrar para `app/pages/*` ou `modules/<dominio>/pages` |
| `src/components/billing` | 2 | poucos | Mover para `core/billing/components` |
| `src/components/notifications` | 4 | medio | Mover para `modules/notifications/components` |
| `src/components/privacy` | 1 | 1 | Mover para `core/privacy/components` |
| `src/features/nearby` | dir | 1 | Mover para `modules/community` ou `core/geospatial` |

### 3.2 CRIT modulos sem barrel (`index.ts`)

Quebram contrato de API pblica e permitem deep imports descontrolados:

- `modules/admin-identidade`
- `modules/admin-motoristas`
- `modules/empresa`
- `modules/empresas-landing`
- `modules/onboarding`
- `modules/professionals`

### 3.3 WARN Cross-imports entre modulos verticais (23 ocorrncias)

```
admin-identidade  ->  admin       (6)
admin-motoristas  ->  admin       (5)
admin             ->  mobility    (4)
gastronomy        ->  mobility    (2)
admin             ->  vagas       (1)
admin             ->  admin-identidade  (1)
admin             ->  admin-motoristas  (1)
admin-motoristas  ->  mobility    (1)
empresa           ->  gastronomy  (1)
empresa           ->  business    (1)
```

**Padres problemticos**:
- **`admin-identidade` e `admin-motoristas` importam `admin`** -> deveriam ser sub-pastas de `modules/admin/`, no modulos separados.
- **`gastronomy -> mobility` (delivery flow)** -> fluxo cross-vertical deve passar por `core/delivery` ou `core/mobility` (contrato).
- **`empresa -> gastronomy/business`** -> indica que `empresa`  uma *landing page composta*, no um Modulo de domniOK Mover para `app/pages` ou redefinir como `modules/empresa-shell`.

### 3.4 WARN Acesso direto ao Supabase em `src/modules/` (55 arquivos)

Os 2 piores ofensores em UI (`.tsx`):
- `src/modules/admin/pages/AdminMotoboyOperations.tsx`
- `src/modules/profile/sections/MobilidadeSection.tsx`

Os outros 53 so em hooks/services internos do Modulo - aceitveis se contidos em `services/` mas devem ser auditados caso a caso (muitos podem delegar a `core`).

### 3.5 WARN duplicacao core - modules (mesmo nome)

| Domnio | Em `core/` | Em `modules/` | Recomendao |
|---|:---:|:---:|---|
| `admin` | o" | o" | OK - `modules/admin`  UI; `core/admin`  servio |
| `analytics` | o" | o" | **Consolidado** - logica/pgina/hook/config cannicos em `core`; `modules` atua como facade |
| `business` | o" | o" | OK |
| `community` | o" | o" | OK |
| `community-alerts` | o" | o" | OK |
| `community-issues` | o" | o" | OK |
| `classifieds` | o" | o" | OK |
| `gastronomy` | o" | o" | OK |
| `mobility` | o" | o" | OK |
| `notifications` | o" | o" | **Consolidar** em `core/notifications` |
| `promotions` | o" | o" | OK |
| `verification` | o" | o" | **Consolidar** em `core/verification` |

### 3.6 Documentacao dispersa

- **157 arquivos `.md` na raiz do projeto** (devem estar em `docs/` ou `docs/archive`)
- **1.540 arquivos em `docs/`** (historico e vigente misturados)
- Nao existe ainda um indice canonico de documentacao vigente

---

## 4. Plano de correcao (priorizado)

### P0 - Blindagem estrutural imediata - **CONCLUIDO em 2026-04-20**

- [x] Barrels `index.ts` criados em: `admin-identidade`, `admin-motoristas`, `empresa`, `empresas-landing`, `onboarding`, `professionals`
- [x] `src/pages/*` movido para `src/app/pages/*`
- [x] `src/components/{billing,notifications,privacy}` movido para `src/shared/components/*`
- [x] `src/features/nearby` movido para `src/modules/community/nearby`
- [x] Pastas legadas removidas: `src/pages`, `src/components`, `src/features`

### P0.1 - Gate arquitetural incremental no CI - **CONCLUIDO em 2026-04-20**

- [x] Script criado: `scripts/validate-architecture-boundaries-incremental.mjs`
- [x] Regras ativas no gate incremental:
  - cross-import entre modulos (`@/modules/X` -> `@/modules/Y`)
  - acesso direto a Supabase em arquivos `.tsx`
  - modulo sem barrel `index.ts`
  - bloqueio de regressao para imports legados `@/modules/analytics` e `@/modules/notifications` em `app/core/shared`
- [x] Baseline versionado: `docs/audits/architecture-boundaries-incremental-baseline.json` (**0 itens** apos saneamento completo)
- [x] Workflow atualizado: `.github/workflows/security-check.yml` executa `npm run validate:architecture:incremental`

### P1 - Refactor funcional de boundaries - **CONCLUIDO em 2026-04-20**

- [x] Eliminados imports cruzados `admin <-> admin-identidade/admin-motoristas` via contratos em `core/admin/*`.
- [x] Eliminado `admin -> mobility` via contrato em `core/mobility/services`.
- [x] Eliminado `gastronomy -> mobility` via contrato em `core/mobility/*`.
- [x] Eliminado `community -> classifieds` via contrato em `core/classifieds/*`.
- [x] Eliminado `empresa -> gastronomy/business` via contratos em `core/gastronomy/*` e `core/business/types`.

### P2 - Eliminacao de Supabase direto em UI - **CONCLUIDO em 2026-04-20**

- [x] `src/modules/admin/pages/AdminMotoboyOperations.tsx` migrado para `AdminMotoboyOperationsService`.
- [x] `src/app/pages/NotificationPreferencesPage.tsx` migrado para `UserNotificationPreferencesService`.
- [x] `src/app/pages/PrivacySettingsPage.tsx` migrado para `PrivacySettingsService`.
- [x] `src/shared/components/dashboard/SettingsTab.tsx` migrado para `BusinessSettingsService`.
- [x] `src/shared/components/privacy/ConsentBanner.tsx` migrado para `ConsentService`.

### P2.1 - Saneamento completo de governanca (boundary + business-rule) - **CONCLUIDO em 2026-04-20**

- [x] `validate:architecture:governance` zerado (`[]`).
- [x] DB access removido de boundary files e delegado para servicos:
  - `useLocationsOptimized` -> `LocationsReadService`
  - `useNotificationsOptimized` -> `useAuth` + `NotificationService`
  - `useAdminUserDetail` -> `AdminUserDetailService`
  - `useDriverManagement` -> `AdminDriverModerationService`
  - `useDriverDashboardBase` -> `RideRatingService`
  - `usePushNotifications` -> `PushNotificationPreferencesService`
  - `logger` -> `ApplicationLogService`
- [x] regra inline de assinatura removida de hook/page:
  - `useSubscription` + `SubscriptionStatusService`
  - `SubscriptionManagementPage` consome `statusLabel`.
- [x] comentario com padrao `supabase.from(...)` removido de `useAppointments` para nao gerar falso positivo no gate.

### P3 - Consolidacao core x modules (em andamento)

- [x] Removida inversao de dependencia em `verification`:
  - `src/core/verification/index.ts` nao importa mais `@/modules/verification`.
  - `VerificationBanner` movido para ownership de `core/verification/components`.
  - `modules/verification/components/VerificationBanner.tsx` mantido como compat wrapper.
- [x] Inicio da consolidacao de `notifications` no consumo de app:
  - `BottomNav` passou a consumir `useUnifiedNotifications` direto de `core/notifications`.
  - `UnifiedNotificationBellV2` migrado para ownership em `core/notifications/components`.
  - `AppTopbar` agora consome `UnifiedNotificationBellV2` de `@/core/notifications`.
  - `modules/notifications/components/notifications/UnifiedNotificationBellV2.tsx` mantido como compat wrapper.
- [x] Removida inversao de dependencia em `dashboard`:
  - `core/business/services/DashboardEmpresaPageV2.tsx` nao importa mais `modules/dashboard/*`.
  - hooks de dashboard movidos para ownership em `core/business/hooks`.
  - `modules/dashboard/hooks/*` mantidos como compat wrappers.
- [x] Removida inversao de dependencia em `landing`:
  - servicos canonicos migrados para `core/landing/services/*`.
  - `core/landing` e `core/routing/components/*Landing*` passaram a consumir `@/core/landing/services/LandingService`.
  - `modules/landing/services/*` mantidos como compat wrappers.
- [x] Removida inversao de dependencia em `analytics`:
  - ownership cannico de `AnalyticsPage`, `useAnalyticsAccess` e `dashboards.config` migrado para `core/analytics/*`.
  - `GeneralAnalyticsPage` em `app/routes/lazyImports.ts` passou a carregar `@/core/analytics/pages/AnalyticsPage`.
  - `modules/analytics/{pages,hooks,config}` mantidos como compat wrappers.
- [ ] Consolidar ownership final de `notifications` (decidir janela de deprecacao e remocao da facade de `modules/notifications`).

### P3.1 - Correcao de runtime/seguranca (concluido em 2026-04-20)

- [x] Corrigido `ReferenceError: Cannot access 'logger' before initialization` em `cookieStorage`:
  - removida dependencia de bootstrap com `logger` em `src/integrations/supabase/cookieStorage.ts`.
- [x] Corrigido bootstrap para evitar ciclo de import:
  - `src/integrations/supabase/supabase.ts` passou a usar logging local (`console`) no bootstrap.
- [x] Ajustado warning de CSP para nao gerar falso alerta no fluxo normal de desenvolvimento:
  - `unsafe-inline`/`unsafe-eval` em `script-src` ficam restritos a `DEV`;
  - warning de validacao so aparece com `VITE_SECURITY_DEBUG=true`.

### P4 - Higiene de documentacao (executado em 2026-04-20)

- [x] `.md` da raiz movidos para `docs/historico/root-markdown/` (mantidos apenas `README.md` e `SECURITY.md` na raiz).
- [x] `validate:docs-structure` em estado verde.
- [x] `docs/INDEX_CANONICOKmd` criado como entrada oficial da documentacao vigente.
- [x] `docs/STATUS.md` criado/atualizado como status oficial unicOK
- [x] `README.md` da raiz atualizado para refletir estrutura e validacoes reais.

### Fluxo de execucao revisado (sobre as opcoes propostas)

- `P0 completo - blindagem estrutural`: **faz sentido e ja foi executado**.
- `Apenas barrels + boundaries`: **faz sentido como modo conservador**, mas ja foi superado (estado atual com gate incremental e governanca zerada).
- `Tudo: P0 + P1 + P2 + docs`: **faz sentido e foi seguido em codigo/arquitetura e documentacao**.
- `So atualizar docs`: **nao era suficiente sozinho** porque havia divida real em governanca/boundary; docs foram atualizados apos correcao tecnica.

---

## 5. Status real vs documentado

| Documento | Afirma | Realidade auditada |
|---|---|---|
| `docs/STATUS.md` | status oficial do projeto | ? atualizado com evidencias de validacao desta execucao |
| `PRE_LAUNCH_AUDIT.md v4.0` | "PRONTO PARA LANCAMENTO" | ? build/typecheck/gates passaram; warning de chunk circular do supabase foi saneado nesta rodada |

### Estado validado nesta execucao

- `npm run validate:architecture:incremental -- --json` -> `currentTotal: 0`, `baselineTotal: 0`.
- `npm run validate:architecture:governance -- --json` -> `[]`.
- `npm run validate:ssot` -> sucessOK
- `npm run typecheck` -> sucessOK
- `npm run build` -> sucessOK
- Runtime fixado para os erros reportados no console:
  - `cookieStorage.ts: Cannot access 'logger' before initialization` -> resolvidOK
  - warning de seguranca de `script-src` em dev -> controlado por flag de debug.
- Ferramental:
  - bloqueio do comando `rg` no ambiente Windows -> resolvido com binario MSVC e override de perfil PowerShell.

---

## 6. Anexos

- Matriz completa de cross-imports: ver secao 3.3
- Lista de arquivos em `modules` com Supabase direto:
  - `npm run validate:architecture:governance -- --json`
- Baseline incremental do gate de CI:
  - `docs/audits/architecture-boundaries-incremental-baseline.json`
- Lista de docs na raiz:
  - `Get-ChildItem -Filter *.md`

---

*Auditoria atualizada por varredura real do codigo em 2026-04-20.*


