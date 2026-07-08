# Modulo de Gastronomia

Status: v1 operacional em auditoria de producao. O fluxo principal cobre cadastro gastronomico, cardapio, carrinho, checkout, pedido e operacao inicial do lojista.

## Escopo v1

- Setup de perfil gastronomico por empresa.
- Bootstrap idempotente de menu e categoria inicial.
- Gestao de cardapio, categorias, itens, disponibilidade e estoque.
- Vitrine publica transacional.
- Carrinho com `delivery`, `takeout` e `dine_in`.
- Checkout com validacao de endereco para delivery.
- Pedidos publicos para cliente e operacao de pedidos na Central do lojista.
- Entrega propria da loja (`merchant_own_fleet`) no checkout oficial.
- Nicho de pizzaria integrado ao fluxo real.

## Fora do v1

- Analytics gastronomico dedicado.
- Promocoes dedicadas de Gastronomia.
- Gestao avancada de entregas/motoboy dentro do modulo.
- UI generica de nichos e hooks de versionamento sem consumidor real.

Essas superficies permanecem fora do pacote operacional ate terem contrato, flags e testes de ponta a ponta.

## Estrutura

```text
src/modules/business/gastronomy/
  cart/          # Carrinho e store persistida
  components/    # Componentes usados pelo runtime v1
  constants/     # Constantes de culinaria, filtros e landing
  hooks/         # Hooks consumidos por paginas/componentes atuais
  niches/        # Registry, presets, servicos e pizzaria
  pages/         # Paginas publicas e Central ativadas
  services/      # Facades e integracoes de dominio do modulo
  types/         # Tipos TypeScript
  utils/         # Formatacao, destino, proximidade e helpers
```

## Fonte de Verdade

- `MenuService` e `menu.queries.ts` concentram cardapio.
- Leituras de negocios gastronomicos vivem em `src/core/business/services/gastronomy.queries.ts`; o arquivo homonimo do modulo e apenas compatibilidade de import.
- `GastronomyCheckoutService` e `useGastronomyCheckout` concentram criacao de pedido.
- `OrderDeliverySSOTService` e `ride_requests` concentram o elo pedido/entrega quando houver integracao operacional explicita; o checkout oficial de Gastronomia nao despacha `platform_courier` no v1.
- `useGastronomyMenuId` resolve o menu antes de consultar categorias ou itens.

## Auditoria

O estado atual de lancamento, pendencias e decisoes de limpeza esta em `PRODUCTION_AUDIT.md`.
