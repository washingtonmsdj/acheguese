# Modulo de Gastronomia

**Status:** HARDENING — V1 OPERACIONAL AINDA NÃO MVP CERTIFICADO  
**Owner de UI/aplicação:** `src/modules/business/gastronomy`  
**Owner de contracts/read-write compartilhados:** `src/core/business`

O fluxo existente cobre cadastro gastronômico, cardápio, carrinho, checkout, pedido e operação inicial do lojista. Essa cobertura de implementação **não equivale a certificação de produção**: algumas superfícies seguem pausadas e ainda existe dívida de acesso runtime direto à infraestrutura dentro do módulo.

## Escopo v1 implementado

- Setup de perfil gastronômico por empresa.
- Bootstrap idempotente de menu e categoria inicial.
- Gestão de cardápio, categorias, itens, disponibilidade e estoque.
- Vitrine pública transacional.
- Carrinho com `delivery`, `takeout` e `dine_in`.
- Checkout com validação de endereço para delivery.
- Pedidos públicos para cliente e operação de pedidos na Central do lojista.
- Entrega própria da loja (`merchant_own_fleet`) no checkout oficial.
- Nicho de pizzaria integrado ao fluxo real.

## Fonte de verdade e fronteiras

- Contracts compartilhados de Gastronomy pertencem a `src/core/business/types/gastronomy.ts`; `types/gastronomy/index.ts` no módulo é superfície de compatibilidade e só mantém `CuisineType` como taxonomia local.
- `GastronomyStatus` deriva do SSOT `src/core/business/constants/gastronomyProfileStatus.ts`; não há segunda union local.
- Leituras compartilhadas de negócios pertencem a `src/core/business/services/gastronomy.queries.ts`.
- Activity, reviews, favoritos e runtime reads pertencem aos services `gastronomy.activity.queries.ts`, `gastronomy.review.queries.ts`, `gastronomy.favorites.queries.ts` e `gastronomy-runtime.queries.ts` em `core`.
- Áreas de entrega pertencem a `src/core/business/services/GastronomyDeliveryAreaService.ts`.
- Resolução de identificador gastronômico pertence a `src/core/business/services/resolveGastronomyBusinessId.ts`.
- Os antigos paths correspondentes no módulo são bridges one-way.
- Writes compartilhados de perfil gastronômico já possuem owner em `src/core/business/services/gastronomy.mutations.ts`.
- `MenuService` e `menu.queries.ts` ainda concentram cardápio no módulo durante a consolidação.
- `GastronomyCheckoutService` e `useGastronomyCheckout` concentram criação de pedido.

## Dívida arquitetural congelada

O baseline atual possui **5 arquivos runtime** em `src/modules/business/gastronomy` que ainda importam `@/integrations/*` diretamente. `scripts/validate-gastronomy-module-boundaries.ts` congela exatamente esse conjunto:

- `niches/pizzaria/PizzaAdminService.ts`
- `niches/versioning/NicheVersioningService.ts`
- `services/GastronomyProfileService.ts`
- `services/MenuService.ts`
- `services/menu.queries.ts`

Imports estritamente `type` de contratos gerados não são contados como acesso runtime. Testes também não compõem o baseline runtime.

A allowlist é um **ratchet temporário**, não uma permissão permanente: cada arquivo migrado para um owner `core` deve ser removido da allowlist no mesmo commit. Adicionar um 6º arquivo runtime é regressão arquitetural.

## Fora do v1 / não certificado

- Analytics gastronômico dedicado.
- Promoções dedicadas de Gastronomia.
- Gestão avançada de entregas/motoboy dentro do módulo.
- UI genérica de nichos e hooks de versionamento sem consumidor real.
- Qualquer superfície ainda `launch-paused` até contrato/runtime/E2E serem comprovados.

## Critério para certificação MVP

Gastronomy só pode ser marcado como certificado quando houver evidência no mesmo SHA para:

1. owners/read-write models sem SSOT concorrente;
2. schema/RPC/migrations reconciliados com o ambiente alvo;
3. RLS/grants e autorização positiva/negativa validados;
4. setup → cardápio → checkout → pedido funcionando com dados reais;
5. estados loading/empty/error/auth corretos;
6. E2E que não aceite placeholder/paused como sucesso;
7. smoke mobile/responsivo;
8. security/lint/typecheck/test/build executando de verdade;
9. deployment do mesmo SHA comprovado no provider.

O estado detalhado de lançamento e decisões históricas permanece em `PRODUCTION_AUDIT.md`. O SSOT operacional global do MVP está em `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`.
