# Business Module Validation

## Auditoria De 2026-07-04

### Corrigido Nesta Rodada

- Favoritos publicos de Empresas foram migrados para `user_favorite_businesses`.
- `BusinessFavoriteStore` tornou-se o unico owner de persistencia; Business e Gastronomia nao acessam a tabela/RPC diretamente.
- `useBusinessFavorite` e `useBusinessFavorites` foram removidos da API publica do modulo.
- A listagem publica real (`EmpresasLandingPage`) agora renderiza botao de favorito persistente no card.
- O fluxo E2E cobre lista territorial -> salvar empresa -> detalhe institucional -> recomendar -> remover ambos.
- A pagina duplicada `src/modules/business/pages/EmpresasPage.tsx` e seus componentes exclusivos foram removidos.
- Navegacao publica segue resolvendo contexto territorial por ID/slug quando necessario.
- Queries publicas de Gastronomia foram consolidadas no core; o modulo reexporta o contrato para preservar imports existentes.
- Copy operacional de entrega em Gastronomia foi neutralizada para frota propria/manual; telas v1 nao prometem rede de motoboys sem entrega SSOT vinculada.
- Rota publica de pedido foi protegida contra sombra das rotas territoriais dinamicas de Gastronomia.
- Dashboard, widget de plano e acoes rapidas de Gastronomia deixaram de expor CTAs/beneficios para Entregas avancadas, Analytics e Promocoes enquanto as rotas seguem pausadas.
- Configuracao operacional de Gastronomia agora persiste entrega como frota propria/manual e bloqueia `uses_platform_delivery` no v1.
- Checkout SSOT de Gastronomia valida carrinho vazio, metodo de pagamento aceito e bloqueio de `platform_courier` antes de tocar validacao de area/backend.
- Validacao de area de entrega foi removida do hook e centralizada no service de checkout, evitando chamada duplicada de Supabase.
- Rotas da Central de Gastronomia foram aninhadas em `CentralRoutes` para garantir que `/central/empresas/:businessId/gastronomia/pedidos/:orderId` renderize o detalhe operacional, e nao o dashboard base.
- A landing publica e o dashboard autenticado mobile de Gastronomia ganharam cobertura axe para violacoes serias/criticas; a varredura corrigiu botao de filtros sem nome acessivel, select mobile sem label, carrossel de atividade sem acesso por teclado/list semantics e contraste do CTA primario do hero.

### Validacao Executada

- `npm run typecheck:app`
- `npx eslint` nos arquivos alterados de Empresas.
- `npx eslint src/core/favorites/services/favorites.queries.ts src/core/favorites/services/favorites.mutations.ts src/core/favorites/services/favoritesBusinessContract.spec.ts`
- `npx vitest run src/core/favorites/services/favoritesBusinessContract.spec.ts --reporter=default`
- `npx vitest run src/modules/business/gastronomy/components/GastronomyCheckoutSheet.spec.tsx src/modules/business/gastronomy/__tests__/GastronomyCheckoutConsistencyAudit.spec.ts src/modules/business/gastronomy/__tests__/GastronomyMicrocopyEncodingAudit.spec.ts --reporter=default`
- `npx vitest run src/modules/business/gastronomy/__tests__/gastronomyRuntimeBoundaries.spec.ts src/modules/business/gastronomy/__tests__/GastronomyOperationalSSOT.test.ts src/modules/business/gastronomy/services/GastronomyCheckoutService.spec.ts --reporter=default`
- `npx vitest run src/modules/business/gastronomy/__tests__/GastronomyOrderDetailsAccessibilityAudit.spec.ts src/modules/business/gastronomy/components/orders/OrderOperationsPanel.spec.tsx src/modules/business/gastronomy/pages/OrderDetailsPage.spec.tsx --reporter=default`
- `npx vitest run src/modules/business/gastronomy/__tests__/GastronomyOrderDetailsAccessibilityAudit.spec.ts src/modules/business/gastronomy/pages/GastronomyDashboardPage.spec.tsx --reporter=default`
- `npx vitest run src/modules/business/gastronomy/__tests__/GastronomyOperationalSSOT.test.ts src/core/verticals/gastronomy/routes/__tests__/gastronomyPublicRoutes.spec.ts src/core/location/hooks/usePublicBrowsingCity.spec.ts --reporter=default`
- `npx vitest run src/modules/business/gastronomy/__tests__/GastronomyOperationalSSOT.test.ts src/modules/business/gastronomy/pages/GastronomyDashboardPage.spec.tsx --reporter=default`
- `npx vitest run src/modules/business/gastronomy/services/GastronomyCheckoutService.spec.ts src/modules/business/gastronomy/checkout/checkoutRules.spec.ts --reporter=default`
- `npx vitest run src/modules/business/gastronomy --reporter=default` (27 arquivos, 119 testes verdes; warnings conhecidos de teste/React Router).
- `npx playwright test tests/e2e/business-recommendation-operational.spec.ts --project=chromium --reporter=line`
- `npx playwright test tests/e2e/gastronomy-onboarding.spec.ts --project=chromium --reporter=line`
- `npx playwright test tests/e2e/gastronomy-operational.spec.ts --project=chromium --reporter=line`
- `npx playwright test tests/e2e/gastronomy-operational.spec.ts --project=chromium --reporter=line --grep "360px"`
- `npx playwright test tests/e2e/mobile-core-layout.spec.ts --project=chromium --reporter=line --grep "/gastronomia/ba/salvador"`
- `npx playwright test tests/e2e/mobile-core-layout.spec.ts --project=chromium --reporter=line --grep "axe"`
- `supabase migration list --linked` como inspecao read-only do historico remoto/local.

### Riscos Remanescentes

- O historico local/remoto estava sincronizado nesta rodada; toda migration futura deve repetir o gate de drift antes de `db push`.
- E2Es de onboarding e operacional de Gastronomia usam estado remoto compartilhado; nao rodar esses dois arquivos em paralelo. Em paralelo houve falso negativo de permissao na Central, mas o cenario de pedido e o arquivo operacional completo passaram quando reexecutados isoladamente.
