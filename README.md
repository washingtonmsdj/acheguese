# Achegue-se

Plataforma hiperlocal, territory-first e modular, construída para conectar moradores às empresas e serviços do próprio território.

> **MVP atual — 2026-09-26**
>
> **Domínio de produto ativo:** Business / Empresas.
>
> **Capabilities horizontais ativas:** Mapa, Perto de mim, Busca, Mensagens com provider Business, Auth, Perfis/Conta, Território, Localização, Notificações e Central.
>
> Community, Classificados, Serviços/Profissionais, Gastronomia, Eventos, Educação, Mobilidade, Billing e demais domínios permanecem pausados até certificação individual.

## Estado de entrega

O núcleo público do MVP está funcional e passa pelos gates determinísticos de arquitetura, segurança e E2E público. O bloqueio externo conhecido para a certificação final autenticada é o data plane/Auth do Supabase, acompanhado pelo issue `#305`.

Não há workaround no frontend para mascarar indisponibilidade de infraestrutura. O MVP só recebe `READY` quando o mesmo SHA comprovar Auth/Conta/Business/Mensagens reais, deploy e smoke autenticado.

O frontend ativo está em fase final de convergência visual. Empresas, Central, Perto de mim e fluxos de criação/edição já receberam o acabamento do MVP; qualquer pendência visual restante deve preservar os contratos funcionais e o lifecycle vigente.

## Stack

- React 18 + TypeScript + Vite
- Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- Tailwind + Radix UI
- Vitest + Playwright

## Estrutura do código

```text
src/
  app/            shell da aplicação, rotas, providers e lifecycle
  core/           contratos e capacidades transversais (SSOT)
  modules/        bounded contexts de produto
  shared/         UI, design system e utilitários compartilhados
  integrations/   adaptadores externos
```

`src/features` foi aposentado e não deve ser recriado. Código novo entra diretamente no owner canônico em `app`, `core`, `modules`, `shared` ou `integrations`.

## Lifecycle

As autoridades executáveis são:

- `src/app/config/productModuleRegistry.ts` — domínios de produto;
- `src/app/config/platformCapabilityRegistry.ts` — capabilities horizontais;
- `src/app/config/lifecycleRegistry.ts` — avaliação cruzada.

Estado do MVP:

- `business: active`;
- `map`, `nearby`, `search` e `messaging` são capabilities horizontais ativas;
- Business é o provider de domínio ativo em Mapa/Nearby/Busca/Mensagens conforme seus scopes;
- demais domínios de produto: `paused`.

Domínio pausado pode continuar versionado para evolução pós-MVP, mas não participa de rota funcional, prefetch/warmup, provider ativo, evento acionável de Notificações nem layer do Mapa.

Contrato completo: [`docs/03-architecture/PRODUCT_MODULE_LIFECYCLE.md`](./docs/03-architecture/PRODUCT_MODULE_LIFECYCLE.md).

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

Os workflows pesados adicionam contratos de Auth/session, regressão do MVP, boundaries territoriais e Playwright público.

## Leitura para inspeção

A documentação possui uma única porta de entrada canônica:

- [`docs/README.md`](./docs/README.md) — índice, precedência e trilha de inspeção;
- [`docs/FEATURE-MAP.md`](./docs/FEATURE-MAP.md) — escopo funcional vigente;
- [`docs/SCREEN-MAP.md`](./docs/SCREEN-MAP.md) — rotas e superfícies;
- [`docs/03-architecture/CURRENT_RULES.md`](./docs/03-architecture/CURRENT_RULES.md) — regras arquiteturais;
- [`docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`](./docs/08-roadmap/EXECUCAO_MAIN_ONLY.md) — execução corrente e Definition of Done;
- [`SECURITY.md`](./SECURITY.md) — segurança e gates.

`docs/10-archive/` contém somente histórico, checkpoints e material supersedido. Nada no archive substitui uma fonte viva.

## Política da `main`

- `main` é a linha canônica de integração.
- Durante a certificação final, mudanças operacionais são aplicadas diretamente em `main`.
- Não duplicar funcionalidades já implementadas em branches paralelas.
- Mudança persistente de schema exige migration versionada.
- Commit/merge não equivale a produção validada.
- Não reduzir gates para obter verde.
- Código, documentação, testes e runtime devem apontar para o mesmo owner/SSOT.
- Correções devem atacar a causa raiz; paliativos e redirects de compatibilidade não são mecanismo de lifecycle.

## Higiene de repositório

A raiz mantém somente documentação de entrada/governança transversal. Planos concluídos, handoffs encerrados, auditorias históricas e especificações de módulos pausados não permanecem misturados com documentação viva.

A regra para manutenção é simples: **owner claro, uma autoridade por assunto, histórico no archive/Git e nenhuma documentação antiga apresentada como estado atual.**
