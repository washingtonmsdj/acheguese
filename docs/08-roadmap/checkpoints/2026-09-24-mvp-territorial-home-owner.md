# Checkpoint — Home territorial canônica do MVP (2026-09-24)

A árvore ativa do MVP agora possui um único owner para a Home territorial: `src/app/pages/TerritoryHomePage.tsx`.

## Decisão

- `AppLayoutRoutes` monta `TerritoryHomePage` diretamente para cidade e bairro/grupo.
- `TerritorialIndexPage` foi removida: era apenas uma facade entre a rota e a Home.
- `TerritorialLandingPage` foi removida: era um fallback sem caller runtime no grafo ativo.
- `useLandingFeatured` e `createLandingFeaturedService` foram removidos porque só sustentavam esse fallback e ainda decidiam lifecycle de Serviços, Gastronomia e Classificados dentro de `core/*`.
- `LandingFeaturedService` permanece preservado porque ainda pertence ao código versionado de Community e outros domínios pausados; reativação futura deve ocorrer pelos owners de lifecycle, não pela restauração da landing antiga.

## Invariante

Business/Empresas continua sendo o domínio de produto ativo. Mapa, Perto de mim, Busca, Mensagens e Notificações permanecem capabilities horizontais. Verticais pausadas não podem reaparecer na Home territorial por fallback, facade, query ou CTA escondido.

O teste `tests/architecture/mvp-territorial-home-owner.test.ts` impede a reintrodução dos arquivos aposentados e exige que a rota monte a Home canônica diretamente.
