# 🍕 Nicho Pizzaria

O nicho Pizzaria é uma especialização interna do módulo **Gastronomia**. Ele **não duplica** carrinho, checkout, pedidos, delivery ou pagamentos — usa o fluxo compartilhado do módulo Gastronomia.

## Conceitos

| Conceito | Descrição | Exemplo |
|----------|-----------|---------|
| **Tamanho** | Define o diâmetro, fatias e limite de sabores | Broto, Pequena, Média, Grande, Família |
| **Sabor** | Sabor independente com preço próprio | Calabresa, Portuguesa, Frango com Catupiry, Marguerita |
| **Borda** | Recheio opcional com preço adicional | Catupiry, Cheddar, Chocolate |
| **Massa** | Tipo de massa com ajuste de preço | Tradicional, Fina, Pan |
| **Adicional** | Extras comuns do cardápio compartilhado | Queijo extra, orégano |

> Não misturamos tamanho com sabor, sabor com borda, ou borda com observação. Cada conceito tem sua própria tabela.

## Tabelas

- `pizza_niche_configs` — regra de preço padrão e flags operacionais (half-half, 3 sabores, 4 sabores).
- `pizza_sizes` — tamanhos, preço base e limite de sabores (`max_flavors`).
- `pizza_flavors` — catálogo de sabores, disponibilidade, alérgenos e ingredientes.
- `pizza_edges` — bordas recheadas e preço.
- `pizza_doughs` — massas e ajuste de preço.
- `pizza_menu_items` — vínculo entre `menu_items` e pizzas montáveis.

## Regras de Preço

O `PizzaPricingService` suporta 4 regras:

| Regra | Descrição |
|-------|-----------|
| `highest_price` | Cobrar o preço do **sabor mais caro** (padrão MVP) |
| `average_price` | Cobrar a **média simples** dos preços dos sabores |
| `weighted_average` | Cobrar proporcionalmente pela **fração** de cada sabor |
| `fixed_base_plus_flavors` | Preço **base do tamanho** + composição dos sabores |

O cálculo considera: tamanho, sabores, fração, borda, massa, adicionais e quantidade.

## Limite de Sabores por Tamanho

Cada tamanho define `max_flavors`. O admin configura pelo painel:

| Tamanho | Sabores (exemplo) |
|---------|-------------------|
| Broto | 1 |
| Média | até 2 |
| Grande | até 3 |
| Família | até 4 |

## Carrinho

A pizza composta é adicionada como `CartItem` normal, mas com `structured_item.kind = "pizza"`.

Exemplo renderizado no checkout:

```txt
Pizza Grande — 3 sabores
33% Calabresa
33% Portuguesa
33% Frango com Catupiry
Borda: Catupiry
Massa: Tradicional
Quantidade: 1
Total: R$ 93,00
```

O `GastronomyCheckoutSheet` detecta `structured_item.kind === "pizza"` e renderiza automaticamente.

## Pedido Estruturado (Snapshot)

Ao finalizar o pedido, o snapshot é salvo em `order_items.item_snapshot.structured_item` com **todos os dados necessários para a cozinha/admin visualizar sem depender de texto livre**:

- item e tamanho;
- sabores escolhidos com fração;
- preço de cada sabor no momento da compra;
- regra de preço usada;
- borda e massa;
- adicionais;
- quantidade;
- total calculado.

## UI do Cliente (PizzaBuilder)

O componente `PizzaBuilder` aparece automaticamente no `MenuItemDetailDrawer` quando o perfil gastronômico é `niche_key = "pizza"` ou `cuisine_type = "pizzaria"`.

O cliente pode:
- escolher o tamanho;
- escolher 1, 2, 3 ou 4 sabores conforme limite do tamanho;
- escolher borda e massa;
- ver o preço atualizado em tempo real;
- adicionar ao carrinho.

Validações bloqueiam:
- pizza sem sabor;
- sabor indisponível;
- mais sabores que o limite do tamanho;
- frações que não somam 1.

## UI do Admin (PizzaAdminPanel)

O `MenuManagementPage` mostra a aba **Pizzaria** quando o perfil gastronômico é `pizza`/`pizzaria`.

O painel admin exibe:
- regra de preço padrão;
- limites de sabores ativos;
- tamanhos cadastrados com limite e preço;
- sabores cadastrados com status de disponibilidade;
- bordas cadastradas com preço;
- massas cadastradas com ajuste de preço.

O `PizzaAdminService` permite CRUD via Supabase:
- `upsertConfig` — atualizar regra de preço e limites;
- `upsertSize` — criar/editar tamanho;
- `upsertFlavor` — criar/editar sabor;
- `upsertEdge` — criar/editar borda;
- `upsertDough` — criar/editar massa;
- `setAvailability` — marcar disponível/indisponível.

## Compatibilidade

Pizzaria funciona como especialização interna. **Não quebra**:
- itens simples;
- hambúrguer, lanches, cafés, marmita;
- cardápios existentes;
- pedidos existentes;
- checkout e delivery atual.

## Testes

11 testes unitários cobrem:

- pizza 1 sabor;
- pizza meio a meio (highest_price);
- pizza 3 sabores;
- pizza 4 sabores;
- average_price, weighted_average, fixed_base_plus_flavors;
- limite de sabores por tamanho;
- sabor indisponível;
- carrinho com snapshot estruturado;
- checkout com snapshot estruturado.

## Status: Completo ✅

- [x] Tipos canônicos (`types.ts`).
- [x] Migration SQL com tabelas nativas.
- [x] Cálculo centralizado (`PizzaPricingService`).
- [x] Validação centralizada (`PizzaValidationService`).
- [x] Carrinho com snapshot (`PizzaCartItemBuilder`).
- [x] Checkout preservando snapshot (`GastronomyCheckoutService`).
- [x] Admin lê configurações (`PizzaAdminService`, `PizzaAdminPanel`).
- [x] Preset Pizzaria como `full_enabled` (`registry.ts`).
- [x] PizzaBuilder integrado no cardápio (`MenuItemDetailDrawer`).
- [x] PizzaAdminPanel integrado no admin (`MenuManagementPage`).
- [x] Renderização de pizza no checkout (`GastronomyCheckoutSheet`).
- [x] Testes passando (11/11).

## Futuro (não bloqueante para MVP)

- Formulários completos de CRUD inline no painel admin (atualmente é visualização + serviço de backend).
- Regras promocionais específicas por tamanho/dia.
