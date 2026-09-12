# G93 — Admin driver metrics truth

Data: 2026-09-12

## Problema

A área administrativa de motoristas misturava fatos operacionais reais com métricas fabricadas.

O fluxo antigo carregava `subscription_plan` e `total_earnings` no DTO `DriverRequest` por suposição, apesar de o contrato explícito atual de `driver_complete_profile` usado pela Mobilidade não declarar esses campos como parte necessária do read model.

Pior: a aba `Métricas` criava períodos financeiros localmente:

- `earnings_today = total_earnings * 0.1`;
- `earnings_week = total_earnings * 0.3`;
- `earnings_month = total_earnings`.

Depois apresentava esses números como faturamento/receita e classificava `subscription_plan === "prioritario"` como plano premium.

Esse comportamento não possuía authority server-side e não era aceitável para um painel administrativo.

## Investigação

O read model canônico de ganhos de motorista, `DriverEarningsReadService`, é deliberadamente self-only: o `driverProfileId` do cliente não é enviado ao servidor; `mobility-rpc` deriva o motorista da identidade autenticada.

Portanto ele não pode ser reutilizado pelo navegador administrativo para consultar ganhos de terceiros.

A presença administrativa, por outro lado, foi confirmada como correta: `AdminMobilityRuntimeService.getDriverProfiles()` sobrepõe `is_online`, `is_available` e `last_location_update` usando `AdminDriverPresenceReadService`/`driver_availability`.

## Correção

### Métricas administrativas

Criado:

`src/core/admin/components/DriverOperationalMetrics.tsx`

A aba `Métricas` agora apresenta somente fatos existentes no read model administrativo:

- motoristas cadastrados;
- motoristas online agora;
- corridas registradas;
- avaliação média;
- ranking dos motoristas melhor avaliados com pelo menos cinco corridas.

Nenhum valor financeiro é inferido ou estimado.

### DTO administrativo

Removidos de `DriverRequest` e de `useDriverManagement`:

- `subscription_plan`;
- `total_earnings`.

O fallback inventado `subscription_plan || "padrao"` deixou de existir.

### Gestão

O card `Receita` foi removido de `AdminMotoristasStatsSection`.

`DriverInfoCard` deixou de mostrar um plano inexistente e usa o espaço para presença operacional (`Online`/`Offline`), cuja origem é `driver_availability`.

### Código legado

`src/core/admin/components/DriverEarningsMetrics.tsx` foi removido fisicamente.

O barrel `src/core/admin/components/index.ts` exporta agora `DriverOperationalMetrics`.

## Ratchet

Criado:

`src/modules/mobility/__tests__/AdminDriverMetricsTruthG93.test.ts`

O teste impede:

- fórmulas `* 0.1` / `* 0.3` para ganhos;
- `earnings_today`, `earnings_week`, `earnings_month` fabricados;
- retorno de `total_earnings` ao fluxo AdminMotoristas;
- retorno de `subscription_plan`, `prioritario` ou `premium` nesse fluxo;
- retorno do componente removido `DriverEarningsMetrics`.

Também exige que as métricas usem `is_online`, `total_rides` e `rating` reais.

## O que não foi feito

Não foi criada uma API administrativa de ganhos de terceiros. Isso exigiria um read model server-side específico, com autorização administrativa e contrato financeiro próprio. Inventar números no cliente não é substituto aceitável.

## Rollout

`PUBLIC_LAUNCH_SURFACES.mobility=false` permanece inalterado.

Nenhuma migration, alteração de RLS ou deploy de Edge Function faz parte deste checkpoint.

## Validação

A source foi revisada e o ratchet foi adicionado. Certificação executada continua condicionada a runner funcional; falhas de rate-limit/plataforma não equivalem a falha de código nem a PASS.
