# Core Billing

**Status:** G4 SSOT SOURCE CLOSED — NAO MVP CERTIFICADO  
**Checkpoint:** 2026-08-29

Este diretório é o owner horizontal de catálogo comercial, assinaturas e entitlements do Achegue-se. Fechar G4 significa consolidar autoridade de source e confirmar que o estado remoto conhecido não contradiz essa autoridade. Isso **não** certifica checkout real, webhook end-to-end, banco completo, deploy ou MVP; essas provas pertencem a G5/G6/G7.

## Autoridades canônicas

### Catálogo comercial

- `services/CatalogService.ts` lê o catálogo publicado em `commercial_catalog_version`, `catalog_item` e políticas associadas.
- `services/BillingPlanService.ts` é adapter de compatibilidade para o DTO histórico usado pela UI; não lê nem escreve `billing_plans`.
- nome, preço, features, destaque e entitlements comerciais vêm do catálogo publicado.
- `entitlementBaselines.ts` é somente fallback determinístico para guards síncronos/indisponibilidade; não é a fonte comercial primária.

### Assinatura de usuário

- `services/SubscriptionService.ts` é o reader da assinatura de escopo `user`.
- a leitura prioriza `plan_code` e `status_v2`, restringe `subscription_scope = 'user'` e escolhe a linha mais recente.
- capabilities privilegiadas continuam passando pelo broker `BillingEntitlementsRpcService`.

### Assinatura de Business

- `BusinessSubscriptionService.ts` é o owner explícito de leitura/gateway de assinatura de Business.
- `SubscriptionService.ts` na raiz é apenas bridge deprecated one-way para callers antigos; não contém persistência nem regra comercial.
- upgrade pago delega ao Stripe Checkout; downgrade/gestão delega ao Stripe Customer Portal.

### Entitlements

- `services/EntitlementResolver.ts` resolve na ordem: catálogo publicado -> snapshot de contrato como fallback -> `entitlementBaselines.ts` como último fallback técnico.
- `entitlements.ts` e `entitlements-extended.ts` são helpers/guards que reutilizam o mesmo baseline; não mantêm matrizes independentes.

### Escrita comercial

O browser **não** escreve `user_subscriptions` nem as tabelas canônicas do catálogo.

- aquisição/upgrade: `services/BillingService.ts` -> `billing-create-checkout` -> Stripe;
- gestão/cancelamento/downgrade: Customer Portal;
- materialização server-side: `supabase/functions/billing-webhook/index.ts`;
- painel administrativo de assinaturas é read-only.

O remoto foi revalidado em 2026-08-29: `user_subscriptions` ficou apenas com policies SELECT para usuário, proprietário de Business e admin. A antiga policy administrativa `ALL` foi removida por `20260829183431_harden_user_subscription_server_write_authority.sql`.

## Migrations do fechamento G4

- `20260829173833_harden_user_subscription_write_authority.sql` — remove self-service write do usuário autenticado e preserva leitura própria.
- `20260829175638_backfill_catalog_extra_entitlements.sql` — preserva no catálogo canônico entitlements extras que existiam somente no JSON legado.
- `20260829183431_harden_user_subscription_server_write_authority.sql` — remove write comercial direto de admin autenticado; estado comercial fica server-owned.

## Superfícies aposentadas

Foram retiradas do runtime por não serem autoridade válida ou por estarem órfãs:

- `src/core/subscription`;
- `src/core/gastronomy/billing` — não existe mais; a referência antiga no registry era drift documental;
- `services/SubscriptionContractService.ts`;
- `services/CatalogAdminService.ts`;
- `services/CatalogVersionService.ts`;
- `services/ImpactAnalysisService.ts`;
- `types/admin.types.ts`;
- editor/form/hooks antigos de CRUD de `billing_plans` no Admin.

## Legados de banco — G5

Estas tabelas não são autoridade runtime e não devem ser removidas sem provenance/dependências comprovadas:

- `billing_plans`;
- `subscription_plans`;
- `business_subscriptions`;
- `gastronomy_subscriptions`.

A limpeza física, grants completos, migrations históricas e dependências externas pertencem a G5.

## Regression guard

`tests/architecture/billing-subscription-authority.test.ts` bloqueia:

- recriação dos namespaces/services paralelos aposentados;
- DML browser em `user_subscriptions`;
- DML browser nas tabelas canônicas de catálogo;
- retorno das tabelas legacy como fonte runtime;
- perda do escopo `user`/`status_v2` no reader de usuário;
- retorno de matriz própria de entitlements;
- bypass de Stripe como autoridade de mudança comercial.

Os testes de `BillingPlanService` e `CatalogService` também foram alinhados ao contrato do catálogo publicado, incluindo planos base horizontais com `vertical = null`.

## O que ainda NÃO está certificado

- semântica de imutabilidade/evolução de `contract_snapshot` em eventos Stripe updated;
- drift completo de migrations/schema/RLS/grants e provenance de tabelas legacy;
- checkout, portal, webhook e reconciliação Stripe executados end-to-end no ambiente alvo;
- cenários negativos/retentativa/idempotência completos;
- lint/typecheck/test/security/E2E/build executados de verdade no mesmo SHA;
- deploy e smoke do mesmo SHA.

Esses itens pertencem a G5/G6/G7 e não reabrem um segundo SSOT de Billing.

## Conclusão

**Billing/subscriptions está fechado para G4 no nível de source/ownership e autoridade remota conhecida, mas não está MVP certificado.**
