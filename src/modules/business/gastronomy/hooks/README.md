# Hooks de Gastronomia

Este diretorio exporta apenas hooks usados pelo runtime atual de Gastronomia. Hooks sem consumidor real foram removidos para evitar API publica fantasma.

## Publico

- `useGastronomyList`: listagem publica de negocios gastronomicos.
- `useGastronomyFoodCatalog`: catalogo publico de pratos.
- `useGastronomyBusinessSort`: ordenacao e distancia para listas publicas.
- `useGastronomyDetail`: detalhe publico por slug/territorio.
- `useGastronomyOpeningStatus`: status operacional do negocio.
- `useGastronomyFavoritersCount`: contagem publica de favoritos.

## Cardapio

- `useMenu`: menu com categorias.
- `useMenusByBusiness`: menus de uma empresa.
- `useMenuCategories`: categorias de um menu.
- `useMenuItems`: itens de um menu.
- `useMenuItem`: item especifico, exportado por `useMenuItems.ts`.
- `useGastronomyMenuId`: resolve o menu canonico antes de consultar categorias/itens.
- `useFeaturedItems`: itens em destaque.
- `useActivePromotions`: promocoes ativas consumidas por superficies publicas existentes.

## Carrinho e Checkout

- `useGastronomyCart`: carrinho do comprador.
- `useGastronomyCheckout`: validacao e criacao de pedido.
- `useDeliveryDestination`: destino de entrega usado por landing, carrinho e checkout.

## Central do Lojista

- `useGastronomySetup`: criacao/edicao do perfil gastronomico.
- `useGastronomyProfile`: perfil gastronomico da empresa.
- `useBusinessHours`: horarios.
- `useBusinessStatus`: status aberto/fechado.
- `useBusinessExceptions`: excecoes de horario.
- `useOperationConfig`: configuracao operacional.
- `useDeliveryAreas`: areas de entrega.
- `useDeliveryNeighborhoods`: bairros por area.
- `useDeliverySummary`: resumo de areas de entrega.
- `useOrders`: fila de pedidos.
- `useOrderDetails`: detalhe de pedido.
- `useOrderStats`: indicadores de pedidos.
- `useOrderTracking`: acompanhamento de entrega quando houver elo no SSOT.

## Social e Confianca

- `useFavorites` exports: favoritos do usuario e da empresa.
- `useGastronomyReviews` exports: reviews e respostas da empresa.
- `useGastronomyActivity`: atividade social relacionada.

## Regras

- Componentes devem importar pelo barrel `@/modules/business/gastronomy/hooks` apenas quando o hook fizer parte desse contrato.
- Hooks novos so devem entrar no barrel quando houver consumidor de runtime e teste cobrindo o fluxo.
- Consultas de categoria/item devem receber `menuId`; use `useGastronomyMenuId` quando a tela tiver apenas `businessId`.
