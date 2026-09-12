# G129 — Worker Plan Catalog Authority

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

A Mobilidade ainda preservava fontes fictícias/paralelas para planos de motorista e motoboy:

- `DriverSubscriptionCard` tinha planos `padrao/prioritario`, preços e benefícios definidos no cliente;
- páginas de motorista/motoboy injetavam um `currentPlan` fabricado;
- `MobilidadeRightSidebar` repetia `Padrao`, `Prioritario`, `PRO` e benefícios hardcoded;
- um card legado de perfil ainda preservava o contrato antigo.

Isso contrariava o catálogo/billing SSOT e permitia a UI afirmar um plano atual sem snapshot de assinatura com escopo `worker`.

## Correção

`DriverSubscriptionCard` agora:

- carrega planos publicados por `CatalogService.getEligibleCatalog`;
- filtra `entity_family=worker` + vertical/actor correspondentes;
- usa `item_code`, preço, descrição e features vindos do catálogo;
- abre checkout com `subscriptionScope=worker` e a vertical correta;
- não aceita mais `currentPlan` e não tenta inferir a assinatura atual no cliente.

`MotoristaPage` e `MotoboyPage` deixaram de fabricar plano atual.

`MobilidadeRightSidebar` deixou de publicar uma segunda lista hardcoded de planos. A sidebar voltou a ser apenas uma superfície operacional.

O card/export legado de perfil de motorista associado ao contrato antigo também foi removido durante o gate.

## Authority atual

- **catálogo publicável:** `CatalogService` / catálogo de billing;
- **checkout/portal:** `BillingService`;
- **plano atual do worker:** ainda não é inferido no cliente. Deve vir de snapshot de assinatura dedicado ao escopo `worker` quando essa authority existir.

## Ratchet

`src/modules/mobility/__tests__/WorkerPlanCatalogAuthorityG129.test.ts`

Protege:

- uso do catálogo publicado;
- ausência de `currentPlan` fabricado;
- ausência de `Padrao/Prioritario/PRO` na sidebar operacional;
- checkout explicitamente limitado ao escopo/vertical de worker.

## Validação

Source/diffs foram inspecionados e o ratchet foi versionado. Este checkpoint **não declara suite/CI verde** sem execução confiável.