# Delivery SSOT

## Objetivo

Este modulo e o SSOT vertical de `order + logistics` para o modo operacional atual:

- `payment_mode = direct_to_merchant`
- `delivery_mode = merchant_own_fleet`

Ele controla:

- criacao do pedido
- origem do pedido (`source_context`)
- itens transacionais (`order_items`)
- aceite
- preparo
- pronto para retirada
- retirada
- entrega
- cancelamento
- falha
- prova de entrega
- timeline/auditoria
- ocorrencias

## O Que Este Modulo Nao E

Este modulo nao substitui o fluxo de dispatch de `mobility`.

Diferenca arquitetural:

- `modules/delivery`: pedido do merchant, frota propria do merchant e controle operacional do estabelecimento. Preparado para `platform_checkout` e `platform_courier_network`, sem ativacao.
- `modules/mobility`: dispatch operacional da plataforma, oferta/aceite de motorista ou motoboy em rede e runtime de corrida/entrega sob regras de mobilidade.

## Regra De Boundary

Enquanto o produto estiver em `merchant_own_fleet`, o app nao deve reutilizar runtime de `mobility` como SSOT de pedidos.

Se no futuro o produto ativar `platform_courier_network`, a integracao correta e via adapter explicito ou bridge, sem acoplamento direto entre tabelas/hooks.

## Escrita

As mutacoes operacionais acontecem via RPC transacional:

- `delivery_create_order`
- `delivery_transition_logistics_status`
- `delivery_mark_picked_up`
- `delivery_attach_delivery_proof`
- `delivery_mark_delivered`
- `delivery_transition_financial_status`
- `delivery_update_order_notes`
- `delivery_report_occurrence`
- `delivery_resolve_occurrence`

Writes diretos nas tabelas `orders`, `order_items`, `order_timeline_events` e `delivery_occurrences` sao proibidos no fluxo da aplicacao.

## Origem Do Pedido

O agregado `orders` suporta origens:

- `manual`
- `business`
- `gastronomy`
- `service`

No runtime atual, o adapter oficial implementado e:

- [`GastronomyOrderOriginAdapter`](./order/adapters/GastronomyOrderOriginAdapter.ts)

Ele converte `Cart + GastronomyBusiness` em `CreateOrderInput`, preservando:

- `merchant_profile_id`
- `source_context`
- `items`
- `discount_total`
