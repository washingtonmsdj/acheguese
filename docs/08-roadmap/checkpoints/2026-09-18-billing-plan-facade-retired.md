# Checkpoint — Billing plan facade retired

**Data:** 2026-09-18  
**Branch:** `cleanup/retire-billing-plan-facade-20260918`

## Defeito

`BillingPlanService` era uma facade de compatibilidade sobre o catálogo
publicado. Ela mantinha um DTO histórico de UI, cache próprio e helpers que
duplicavam a superfície do owner real `CatalogService`.

O arquivo de hooks ainda exportava APIs sem caller runtime.

## Contrato final

`CatalogService` é o único owner de:

- catálogo publicado;
- projeção pública dos planos base;
- preço/formatação publicada;
- features/destaque;
- entitlements publicados combinados com o baseline técnico.

Foram adicionados ao owner canônico somente os contratos com caller real:

- `getPublishedPlans()`;
- `getPublishedPlanByCode()`;
- `getPublishedPlanEntitlements()`;
- tipo `PublishedPlan`.

Não foram migrados os helpers callerless de featured/payment/cache.

## Remoções

Removidos fisicamente:

- `src/core/billing/services/BillingPlanService.ts`;
- `src/core/billing/__tests__/BillingPlanService.test.ts`.

`useBillingPlans.ts` foi reduzido às duas APIs usadas em runtime:

- `useBillingPlans`;
- `useBillingPlan`.

Foram removidos por ausência de caller:

- `usePlanEntitlements`;
- `useFeaturedPlan`;
- `useRequiresPayment`;
- `useClearPlansCache`;
- `useHasEntitlement`;
- `usePlanLimit`.

## Callers migrados

Passaram a usar `CatalogService`/tipos canônicos diretamente:

- `useBilling.ts`;
- `EntitlementResolver`;
- `MenuService`;
- Education subscription service;
- `SubscriptionPlans`;
- `useEntitlements`;
- barrel de Billing.

`BillingService` voltou ao escopo próprio: checkout, portal Stripe e histórico
de transações; não encaminha leituras de catálogo.

## Guardrails

- `src/core/billing/__tests__/CatalogPublishedPlans.test.ts` cobre a projeção
  pública, normalização de code e merge de entitlements;
- `tests/architecture/billing-subscription-authority.test.ts` exige ausência
  física de `BillingPlanService`, zero caller runtime e `CatalogService`
  como owner;
- o ratchet Education exige `CatalogService.getPublishedPlanEntitlements`.

## Documentação

Atualizados:

- `src/core/billing/README.md`;
- `docs/architecture/SSOT_REGISTRY.md`;
- `src/core/billing/entitlementBaselines.ts`.

A única referência ativa ao nome antigo na README aparece na lista explícita de
superfícies aposentadas.

## Validação desta sessão

A inspeção do branch confirmou:

- service antigo ausente;
- teste antigo ausente;
- consumers runtime sem `BillingPlanService`;
- hooks callerless ausentes;
- owner canônico contém apenas APIs publicadas ainda consumidas.

O executor segue sem DNS para `github.com`, portanto não foi possível clonar
o branch e executar Vitest localmente. Nenhum PASS local foi inventado.

O PR só pode ser considerado certificado quando os gates do mesmo SHA
executarem steps reais.
