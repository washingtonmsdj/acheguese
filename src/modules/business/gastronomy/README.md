# Modulo de Gastronomia

**Status:** HARDENING — V1 OPERACIONAL AINDA NÃO MVP CERTIFICADO  
**Owner de UI/aplicação:** `src/modules/business/gastronomy`  
**Owner de contracts, persistence e integrações:** `src/core/business`

O fluxo implementado cobre cadastro gastronômico, cardápio, carrinho, checkout, pedido e operação inicial do lojista. Implementação funcional e ownership arquitetural correto não equivalem, isoladamente, a certificação de produção.

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

- Contracts compartilhados de Gastronomy pertencem a `src/core/business/types/gastronomy.ts`.
- Contracts persistentes/read-model de cardápio pertencem a `src/core/business/types/gastronomyMenu.ts`; `types/menu.ts` no módulo mantém apenas estado de carrinho/checkout e reexports de compatibilidade.
- `GastronomyStatus` deriva de `src/core/business/constants/gastronomyProfileStatus.ts`.
- Leituras de negócios, activity, reviews, favoritos, runtime e menu pertencem a services em `src/core/business`.
- `GastronomyProfileService` é o writer/facade canônico de perfil. `gastronomy.mutations.ts` preserva a API histórica com ownership explícito, mas delega a persistência ao serviço canônico.
- `MenuService`, áreas de entrega e resolução de identificador gastronômico pertencem a `src/core/business/services`.
- Contratos e persistence de versionamento de nichos pertencem a `src/core/business/niches`.
- Contratos admin e persistence da pizzaria pertencem a `src/core/business/niches/pizzaria`.
- Os antigos paths correspondentes no módulo são bridges one-way para os owners canônicos.
- `GastronomyCheckoutService`, carrinho, páginas, hooks e componentes permanecem no módulo como camada de aplicação/UI.

## Dívida de integração do módulo

O baseline runtime de acesso direto a `@/integrations/*` dentro de `src/modules/business/gastronomy` é **zero**.

`tools/architecture/validate-gastronomy-module-boundaries.ts` mantém a allowlist vazia e impede a reintrodução de acesso runtime direto à infraestrutura. Imports estritamente `type` de contratos gerados não são considerados persistence runtime.

Zero dívida de integração no módulo **não significa MVP certificado**. A certificação depende também de banco, autorização, testes, build e deploy do mesmo SHA.

## Fora do v1 / não certificado

- Analytics gastronômico dedicado.
- Promoções dedicadas de Gastronomia.
- Gestão avançada de entregas/motoboy dentro do módulo.
- UI genérica de nichos sem consumidor operacional comprovado.
- Qualquer superfície sem evidência real de contrato/runtime/E2E.

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
