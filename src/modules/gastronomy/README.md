# Modulo de Gastronomia

![Status](https://img.shields.io/badge/Status-AAA%20Profissional-success?style=flat-square)
![SSOT](https://img.shields.io/badge/SSOT-100%25-brightgreen?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square)
![Duplicações](https://img.shields.io/badge/Duplica%C3%A7%C3%B5es-0-success?style=flat-square)

Vertical especializada de gastronomia, integrada ao SSOT territorial e ao SSOT operacional de delivery.

## Principios

- `business_data` continua sendo a identidade principal do negocio.
- `GastronomyBusiness` expoe `business_data_id` para menu, carrinho, checkout e origem do pedido.
- `gastronomy_profiles.business_id` referencia `business_data.id`.
- Pagina publica e detail page usam fallback mock somente em `development` quando nao houver dados operacionais reais.
- O territorio ativo da rota ou do seletor e a fonte de verdade para listagem publica.

## Fronteiras

- `src/modules/gastronomy` trata somente leitura/escrita de gastronomia.
- `src/modules/delivery` recebe o pedido operacional via adapter oficial.
- `src/modules/mobility` nao participa do modo atual `merchant_own_fleet`.

## Contratos principais

### GastronomyQueryService
- `getGastronomyProfile(businessId)`
- `getGastronomyBusiness(identifier)`
- `getGastronomyBusinessByTerritoryAndSlug({ state, city, district, slug })`
- `getGastronomyBusinesses(filters)`
- `getGastronomyBusinessesList(params)`
- `getAvailableCuisineTypes(territoryFilter)`

### MenuQueryService
- `getMenu(menuId)`
- `getMenusByBusiness(businessId)`
- `getMenuWithCategories(menuId)`
- `getMenuItem(itemId)`
- `getPublicFoodCatalog(params)`
- `getFeaturedItems(businessId)`
- `getActivePromotions(businessId)`
- `searchMenuItems(businessId, query)`

### Hooks publicos
- `useGastronomyList(filters)`
- `useGastronomyFoodCatalog(filters)`
- `useGastronomyDetail({ state, city, district, slug })`
- `useMenu(menuId)`
- `useMenusByBusiness(businessId)`
- `useMenuItem(itemId)`
- `useGastronomyCart(business)`
- `useGastronomyCheckout()`

## Regras de runtime publico

- Landing publica so mostra estabelecimentos e itens do territorio resolvido.
- Bairro fora do seletor pode abrir normalmente se a URL for navegavel.
- Detail page valida `territorio + slug`; slug valido em outro bairro nao abre.
- Sem itens reais publicados: a UI mostra estado vazio operacional, nunca itens de outro bairro.

## Mocks de desenvolvimento

- Os arquivos em `src/modules/gastronomy/__mocks__/` permanecem no projeto para desenvolvimento local.
- Os mocks estao alinhados ao SSOT atual (`business_data_id` e `geographic_path` canÃ´nico).
- Runtime de producao nao usa fallback mock (`import.meta.env.DEV` obrigatorio).
- Guardrail de teste cobre essa fronteira em gastronomyRuntimeBoundaries.spec.ts.
- Para desligar o fallback no desenvolvimento: VITE_ENABLE_GASTRONOMY_DEV_MOCKS=false.

## Integracao com delivery

Fluxo atual:
1. o cliente monta o carrinho local por `business_data_id`
2. o checkout gera `CreateOrderInput` via `GastronomyOrderOriginAdapter`
3. o pedido e criado em `modules/delivery`
4. o pedido opera em:
   - `payment_mode = direct_to_merchant`
   - `delivery_mode = merchant_own_fleet`

Limites intencionais da fase atual:
- o app nao cobra o cliente no checkout
- nao existe split, payout, wallet ou settlement real
- o motoboy e operacional da empresa, nao da plataforma

