# Achegue-se

Plataforma hiperlocal com arquitetura modular orientada a território.

> **MVP atual (2026-09-21):** **Business/Empresas** é o domínio de produto ativo.
>
> **Capabilities horizontais ativas:** Mapa, Perto de mim, Busca, Mensagens (provider Business), Auth, Perfis/Conta, Território, Localização, Notificações e Central.
>
> Community, Classificados, Serviços, Gastronomia, Eventos, Educação, Mobilidade e demais domínios permanecem pausados até certificação individual.

## Stack

- React 18 + TypeScript + Vite
- Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- Tailwind + Radix UI
- Vitest + Playwright

## Estrutura do código

```text
src/
  app/            shell da aplicação (rotas, providers e fluxos de aplicação)
  core/           contratos e capacidades transversais (SSOT)
  modules/        bounded contexts de produto
  shared/         UI e utilitários compartilhados
  integrations/   adaptadores externos
```

`src/features` é namespace legado e não recebe código novo. Resíduos ainda preservados devem ser consolidados no owner de domínio correspondente antes de qualquer reativação.

## Lifecycle de módulos

As autoridades executáveis são:

- `src/app/config/productModuleRegistry.ts` — domínios de produto;
- `src/app/config/platformCapabilityRegistry.ts` — capabilities horizontais;
- `src/app/config/lifecycleRegistry.ts` — avaliação cruzada.

Estado do MVP:

- domínio: `business: active`;
- capabilities: `map`, `nearby`, `search`, `messaging`, Auth, Perfis/Conta, Território, Localização, Notificações e Central ativas;
- `nearby` depende de Map + Location + Business;
- `messaging` registra somente Business Direct Messaging;
- demais domínios de produto: `paused`.

Domínio pausado pode continuar versionado para evolução pós-MVP, mas não participa de rota funcional, prefetch/warmup, provider de Busca/Mensagens ou layer do Mapa.

A política completa está em [docs/03-architecture/PRODUCT_MODULE_LIFECYCLE.md](./docs/03-architecture/PRODUCT_MODULE_LIFECYCLE.md).

## Setup rápido

```bash
npm install
npm run dev
```

## Validações principais

```bash
npm run security:validate
npm run validate:ssot
npm run validate:architecture:incremental -- --json
npm run validate:architecture:governance -- --json
npm run validate:taxonomy
npm run validate:docs-structure
npm run typecheck
npm run build
```

## Fontes de verdade

A documentação possui **uma porta de entrada canônica**:

- [docs/README.md](./docs/README.md) — índice e autoridade documental;
- [docs/03-architecture/CURRENT_RULES.md](./docs/03-architecture/CURRENT_RULES.md) — regras arquiteturais vigentes;
- [docs/03-architecture/PRODUCT_MODULE_LIFECYCLE.md](./docs/03-architecture/PRODUCT_MODULE_LIFECYCLE.md) — contrato de ativação/pausa/remoção/adição de módulos;
- [docs/08-roadmap/EXECUCAO_MAIN_ONLY.md](./docs/08-roadmap/EXECUCAO_MAIN_ONLY.md) — execução operacional corrente e critérios de MVP;
- [docs/08-roadmap/NEXT-STEPS.md](./docs/08-roadmap/NEXT-STEPS.md) — sequência curta do lançamento;
- [SECURITY.md](./SECURITY.md) — regras de segurança e gates de release.

Documentos em `docs/10-archive/` são históricos e **nunca** substituem uma fonte ativa. Checkpoints antigos também não representam o escopo atual sem revalidação.

## Política da `main`

- `main` é a linha canônica de integração.
- Não duplicar funcionalidades já implementadas em branches paralelas.
- Mudança persistente de schema precisa de migration versionada.
- Merge/commit não equivale a produção validada.
- Não reduzir gates para obter verde.
- Código, documentação, testes e runtime devem apontar para o mesmo owner/SSOT.
- Correções devem atacar a causa raiz; paliativos e redirects sem justificativa funcional não são aceitos.

## Política documental da raiz

A raiz mantém somente documentos de entrada e governança transversal:

- `README.md`;
- `SECURITY.md`;
- `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md` temporariamente como ponteiro de compatibilidade, sem autoridade própria.

Planos, arquitetura, status e histórico pertencem a `docs/` e devem estar referenciados pelo índice canônico.
