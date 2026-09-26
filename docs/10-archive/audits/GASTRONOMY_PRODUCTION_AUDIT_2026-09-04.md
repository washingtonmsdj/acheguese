# Gastronomia — auditoria de produção de 2026-09-04

**Status:** histórico / não normativo.

Este registro substitui o antigo `src/modules/business/gastronomy/PRODUCTION_AUDIT.md`, que era um snapshot longo de pré-certificação G6. O arquivo foi retirado do módulo operacional em 2026-09-26 para que documentação datada não seja confundida com estado atual do produto.

## Estado registrado na época

Em 2026-09-04, Gastronomia possuía fluxo v1 implementado para setup, cardápio, checkout, pedidos e operação inicial do lojista, com diversas correções de RLS/RPC, persistência, acessibilidade, copy, E2E e remoção de código legado. A própria auditoria registrava explicitamente que o módulo **não estava READY**, pois ainda dependia de prova operacional/hosted same-SHA.

Entre as evidências históricas documentadas estavam:

- setup e bootstrap idempotente de menu/categoria;
- carrinho e checkout para `delivery`, `takeout` e `dine_in`;
- hardening de autorização e RPCs de pedidos/delivery;
- E2E de onboarding e fluxo operacional;
- correções de timeline/timestamps de pedidos;
- remoção de páginas, hooks, facades e componentes sem consumidor real;
- consolidação de owners em `src/core/business` e UI/aplicação em `src/modules/business/gastronomy`;
- gates estruturais locais verdes naquele momento.

## Situação atual

Gastronomia permanece **paused** no lifecycle do MVP atual. Implementação preservada não equivale a ativação.

Autoridades vigentes:

- `src/app/config/productModuleRegistry.ts` — lifecycle do domínio;
- `src/modules/business/gastronomy/README.md` — contrato vivo do módulo preservado;
- `docs/FEATURE-MAP.md` — escopo funcional atual;
- `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md` — SSOT operacional do release.

O conteúdo detalhado da auditoria removida continua recuperável no histórico Git anterior a esta limpeza. Ele não deve ser usado como evidência atual de produção, segurança ou certificação.