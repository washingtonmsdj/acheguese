# G95 — Retire legacy driver plan schema

Data: 2026-09-12

## Problema

Mesmo após a remoção dos contratos administrativos falsos no G93 e do arquivo duplicado `src/shared/types/mobilidade.ts` no G94, `mobilitySchemas.ts` ainda declarava:

- `DriverPlanSchema = z.enum(["padrao", "prioritario"])`;
- `DriverProfileSchema.subscription_plan`;
- `DriverProfileSchema.total_earnings`.

`src/core/mobility/types/mobility.generated.ts` também reexportava `DriverPlan` derivado desse schema.

A busca de consumidores não encontrou uso externo ativo de `DriverPlanSchema`/`DriverPlan`. O contrato existia apenas para alimentar o próprio schema duplicado.

## Correção

Removidos de `mobilitySchemas.ts`:

- `DriverPlanSchema`;
- `subscription_plan` de `DriverProfileSchema`;
- `total_earnings` de `DriverProfileSchema`.

Removidos de `mobility.generated.ts`:

- import de `DriverPlanSchema`;
- `export type DriverPlan`;
- referência documental a `DriverPlan`.

## Preservado

O conceito legítimo de ganhos não foi removido do domínio.

Foram preservados:

- `DriverEarningsSchema`;
- `validateDriverEarnings`;
- `ValidatedDriverEarnings`;
- `DriverEarnings` reexportado pelo arquivo de tipos.

Isso evita misturar a aposentadoria do plano legado com uma remoção indevida da capacidade real de ganhos.

## Ratchet

Criado:

`src/modules/mobility/__tests__/DriverPlanSchemaRetirementG95.test.ts`

O teste impede o retorno de `DriverPlanSchema`, `padrao/prioritario`, `subscription_plan` e `total_earnings` no schema de perfil, enquanto exige a preservação do schema legítimo de earnings.

## Rollout

`PUBLIC_LAUNCH_SURFACES.mobility=false` permanece inalterado.

Nenhuma migration, RLS ou Edge Function foi alterada neste checkpoint.
