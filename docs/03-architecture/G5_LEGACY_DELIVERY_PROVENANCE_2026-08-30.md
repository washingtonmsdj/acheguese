# G5 — Provenance do legado Delivery — 2026-08-30

## Escopo

Este corte da fase G5 separa duas superfícies com nomes de Delivery que tinham estados arquiteturais diferentes:

1. o cluster legado de despacho `delivery_requests` / `delivery_status_history` / `delivery_tracking`, já fora do runtime canônico;
2. `emergency_delivery_log`, que apesar do nome continua sendo uma tabela ativa do Core Safety.

A regra aplicada foi provenance antes de remoção: nenhum objeto foi apagado apenas por estar vazio ou por aparecer no Advisor.

## 1. Cluster legado de despacho

O runtime canônico de entrega por motoboy está preso a `public.ride_requests`. O guard `src/modules/mobility/delivery/__tests__/DeliverySSOTGuard.test.ts` impede `delivery_requests` de voltar aos serviços ativos e mantém a experiência de rede de motoboy pausada no lançamento atual.

A auditoria remota encontrou:

| objeto | linhas | estado anterior |
| --- | ---: | --- |
| `delivery_requests` | 0 | RLS ativo, browser sem grants, service-role-only |
| `delivery_status_history` | 0 | dependente apenas de `delivery_requests` dentro do cluster |
| `delivery_tracking` | 0 | dependente apenas de `delivery_requests` dentro do cluster |

Não havia FK de tabela externa apontando para qualquer um dos três objetos. As únicas referências SQL remanescentes eram:

- `get_available_deliveries(...)`;
- `get_delivery_stats(...)`;
- `get_next_delivery_request_number(...)`;
- `log_delivery_status_change()`;
- policies/triggers pertencentes ao próprio cluster.

Os três primeiros helpers já estavam classificados e restringidos a `service_role` pela governança anterior. A busca no HEAD não encontrou caller runtime para o cluster.

### Retirada

A migration `20260830033337_retire_empty_legacy_delivery_cluster.sql`:

- removeu os quatro helpers legados;
- removeu `delivery_tracking`, `delivery_status_history` e `delivery_requests` com `RESTRICT`;
- não usou `CASCADE`;
- não removeu dados, porque as três tabelas tinham zero linhas.

O pós-check remoto confirmou:

- `to_regclass('public.delivery_requests') IS NULL`;
- `to_regclass('public.delivery_status_history') IS NULL`;
- `to_regclass('public.delivery_tracking') IS NULL`;
- nenhum dos quatro helpers continua presente.

`tests/security/retired-legacy-delivery-cluster.test.ts` impede recriação silenciosa dessas tabelas/funções depois do baseline de retirada.

## 2. `emergency_delivery_log` não é legado

O Advisor também apresenta `public.emergency_delivery_log` como RLS habilitado sem policy. Esse alerta não significa que a tabela esteja abandonada.

O caller ativo `supabase/functions/send-emergency-email/index.ts` usa `emergency_delivery_log` para:

- contabilizar tentativas recentes por alerta/contato/canal;
- aplicar rate limit de e-mail de emergência;
- registrar entrega enviada;
- registrar falha do provedor;
- registrar bloqueio por rate limit.

O Edge Function usa service role depois de autenticar o usuário e validar ownership do alerta e vínculo do contato de emergência.

Estado remoto auditado:

- RLS: habilitado;
- policies: 0;
- `anon`: nenhum SELECT/INSERT/UPDATE/DELETE;
- `authenticated`: nenhum SELECT/INSERT/UPDATE/DELETE;
- `service_role`: acesso DML completo;
- FKs para `emergency_alerts` e `emergency_contacts`;
- constraints de channel/status/target/metadata/error.

### Classificação

**ACTIVE / SERVER-OWNED / FAIL-CLOSED.**

Não criar policy de browser para silenciar o lint. Não remover a tabela. A ausência de policies é compatível com o boundary atual: somente o gateway server-side acessa o log diretamente.

## 3. Impacto no Advisor

Após a retirada do cluster legado, `delivery_requests` deixou de aparecer no inventário `rls_enabled_no_policy`. `emergency_delivery_log` permanece como residual informativo esperado porque continua ativo e fechado ao browser.

## 4. Estado G5

Este corte avança os itens `tabelas legadas sem caller`, `órfãos` e `RLS e grants`, mas não fecha globalmente nenhum deles. Ainda existem outras relações fail-closed ativas, legados com dados preservados e residuals extension-owned que precisam de provenance própria.
