# Nicho Pizzaria

Pizzaria e uma especializacao interna do modulo Gastronomia. Ela usa o mesmo carrinho, checkout, pedido, pagamento e entrega do fluxo compartilhado.

## Runtime Atual

- `PizzaBuilder` aparece no `MenuItemDetailDrawer` para negocio `pizza`/`pizzaria`.
- `PizzaAdminPanel` aparece em `MenuManagementPage` para configuracao de tamanhos, sabores, bordas e massas.
- `PizzaCartItemBuilder` grava `structured_item.kind = "pizza"` no carrinho.
- `GastronomyCheckoutService` preserva o snapshot estruturado em `order_items.item_snapshot`.

## Servicos

- `PizzaPricingService`: calcula preco por regra de composicao.
- `PizzaValidationService`: valida tamanho, sabores, fracoes, borda, massa e disponibilidade.
- `PizzaAdminService`: le e grava configuracoes de pizzaria no Supabase.

## Regras De Preco

- `highest_price`: cobra o sabor mais caro.
- `average_price`: cobra media simples dos sabores.
- `weighted_average`: cobra proporcionalmente pela fracao de cada sabor.
- `fixed_base_plus_flavors`: soma preco base do tamanho e composicao dos sabores.

## Snapshot Do Pedido

Pedidos devem salvar dados suficientes para cozinha e lojista sem depender do catalogo atual:

- item e tamanho;
- sabores escolhidos e fracoes;
- preco de cada sabor no momento da compra;
- regra de preco aplicada;
- borda, massa e adicionais;
- quantidade e total calculado.

## Limites Conhecidos

- Promocoes especificas por tamanho/dia ainda nao fazem parte do v1.
- Fluxos avancados de delivery/motoboy continuam fora do nicho; usam o SSOT geral de pedidos/entrega quando habilitados.
