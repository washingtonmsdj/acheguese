# G5 — Provenance dos legados de Billing — 2026-08-30

## Escopo

Este corte da fase G5 audita as quatro tabelas que o owner canônico de Billing já classifica como legado de banco:

- `public.billing_plans`;
- `public.subscription_plans`;
- `public.business_subscriptions`;
- `public.gastronomy_subscriptions`.

A regra deste corte é **não apagar dados por heurística**. Primeiro foram confirmados callers, dados retidos, grants/policies e relação com os SSOTs atuais; depois a superfície de browser foi fechada sem `DROP`/`DELETE`.

## Autoridades atuais

O source de G4 define:

- catálogo/preço/entitlements: catálogo comercial publicado;
- assinatura: `public.user_subscriptions`;
- mudança comercial: Stripe Checkout / Customer Portal;
- materialização server-side: `billing-webhook`;
- ausência de uma linha canônica de assinatura Business: fallback determinístico para plano Free no `BusinessSubscriptionService`.

`tests/architecture/billing-subscription-authority.test.ts` impede as quatro tabelas legadas de voltarem como fonte do runtime em `src`.

## Inventário remoto antes do lockdown

| tabela | linhas | anon SELECT | authenticated SELECT | anon/auth write | observação |
| --- | ---: | --- | --- | --- | --- |
| `billing_plans` | 7 | sim | sim | não | catálogo legado com leitura pública |
| `subscription_plans` | 3 | sim | sim | não | catálogo legado com leitura pública |
| `business_subscriptions` | 5 | sim | sim | sim (grant) | RLS limitava writes, mas grants eram excessivos |
| `gastronomy_subscriptions` | 5 | sim | sim | não | legado read-only, ainda exposto para SELECT |

A busca no source não encontrou caller runtime direto para as quatro tabelas. Referências restantes são migrations, documentação, testes/ratchets e material arquivado.

## Achado de provenance: migration histórica de Gastronomy

`20260421000004_migrate_legacy_subscriptions.sql` tinha intenção explícita de migrar `gastronomy_subscriptions` para `user_subscriptions`, mas fazia o join:

```sql
INNER JOIN business_data bd ON gs.business_id = bd.profile_id
```

O schema remoto atual prova que `gastronomy_subscriptions.business_id` possui FK para `business_data(id)`, não para `business_data(profile_id)`.

Resultado observado em 2026-08-30:

- 5 linhas em `gastronomy_subscriptions`;
- todas `plan_tier = free` e `status = active`;
- todas ligadas a Businesses/Profile ativos;
- zero linhas correspondentes em `user_subscriptions` por `business_id`, `legacy_id` ou `stripe_subscription_id`;
- o usuário proprietário desses Businesses também não possuía outra linha em `user_subscriptions` no snapshot auditado.

### Decisão: não fazer backfill sintético de Free ativo

O runtime canônico já interpreta ausência de assinatura Business persistida como plano Free. Além disso, `user_subscriptions` possui índice único para uma assinatura Business ativa por `business_id`, enquanto `billing-webhook` materializa uma nova assinatura paga procurando primeiro por `stripe_subscription_id`.

Criar agora cinco linhas sintéticas `active/free` poderia fazer um primeiro webhook pago tentar inserir outra linha ativa e colidir com essa unicidade. Portanto, o reparo correto deste corte é **preservar a provenance sem transformar legado em nova autoridade**.

## Correções aplicadas

### `20260830032622_lock_legacy_gastronomy_subscriptions_surface`

- `REVOKE ALL` de `anon` e `authenticated`;
- remove a policy legada de leitura;
- mantém os 5 registros;
- amplia `prevent_gastronomy_subscriptions_writes` para bloquear também `DELETE`;
- documenta a tabela como provenance-only.

### `20260830032757_lock_remaining_legacy_billing_browser_surfaces`

- `REVOKE ALL` de `anon` e `authenticated` em `billing_plans`, `subscription_plans` e `business_subscriptions`;
- remove policies públicas/browser dos três legados;
- substitui a antiga policy `PUBLIC` condicionada a JWT de service role por uma policy explicitamente `TO service_role` em `business_subscriptions`;
- amplia `prevent_business_subscriptions_writes` para bloquear também `DELETE`;
- mantém todas as linhas.

## Estado remoto pós-migration

| tabela | linhas preservadas | anon SELECT | authenticated SELECT | browser write | browser policies | service_role SELECT |
| --- | ---: | --- | --- | --- | ---: | --- |
| `billing_plans` | 7 | não | não | não | 0 | sim |
| `subscription_plans` | 3 | não | não | não | 0 | sim |
| `business_subscriptions` | 5 | não | não | não | 0 | sim |
| `gastronomy_subscriptions` | 5 | não | não | não | 0 | sim |

Nenhuma linha foi excluída.

## Ratchet

`tests/security/legacy-billing-surface-security.test.ts` passa a exigir que:

1. as migrations de lockdown permaneçam versionadas;
2. migrations futuras não concedam novamente grants/policies de browser para os quatro legados;
3. os dois legados de assinatura com dados preservados continuem bloqueando `DELETE` além de `INSERT/UPDATE`.

## Classificação G5

- `billing_plans`: **LEGACY / LOCKED / RETAIN PENDING CLEANUP**;
- `subscription_plans`: **LEGACY / LOCKED / RETAIN PENDING CLEANUP**;
- `business_subscriptions`: **LEGACY / LOCKED / RETAIN PENDING CLEANUP**;
- `gastronomy_subscriptions`: **LEGACY / LOCKED / RETAIN PENDING CLEANUP**, com drift histórico de migration documentado.

Este corte fecha a superfície de browser desses quatro objetos, mas **não autoriza DROP**. A remoção física só pode ocorrer depois de certificar dependências externas, retenção/auditoria necessária e uma estratégia de export/snapshot que preserve a provenance exigida.

## Próximo corte

Continuar `tabelas legadas sem caller` fora de Billing, priorizando objetos já marcados como deprecated/dormant no G4 e objetos que ainda mantêm grants de browser apesar de não possuírem owner runtime canônico.
