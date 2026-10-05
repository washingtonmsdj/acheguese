# Achegue-se

Plataforma hiperlocal, territory-first e modular, construída para conectar moradores às empresas e serviços do próprio território.

> **MVP atual — 2026-10-05**
>
> **Domínio de produto ativo:** Business / Empresas.
>
> **Capabilities horizontais ativas:** Mapa, Perto de mim, Busca, Mensagens, Notificações, Auth, Perfis/Conta, Território, Localização e Central.
>
> Mensagens e Notificações pertencem à plataforma Achegue-se. Verticais podem fornecer providers/eventos, mas pausar uma vertical não desativa essas capabilities.
>
> Community, Classificados, Serviços/Profissionais, Gastronomia, Eventos, Educação, Mobilidade, Billing e demais domínios permanecem pausados até certificação individual.

## Estado de entrega

O núcleo do MVP está funcional e o candidato vigente já comprovou os gates determinísticos de arquitetura, segurança, build, E2E público e smoke autenticado de produção. **Não há blocker externo ativo conhecido para o primeiro release.**

Os antigos blockers de infraestrutura foram encerrados com prova real: `#305` após sessão autenticada + Conta + Business no runtime certificado, e `#445` após validação da identidade de release pela política canônica `exact/equivalent`, sem forçar deployment artificial. Regressão de infraestrutura ou delta deployável reabre o gate correspondente; issue encerrada não vira permissão para ignorar falha futura.

A certificação vigente cobre Auth/Conta, Business lifecycle e Business Messaging no runtime aceito. Notificações permanecem capability horizontal ativa e com boundary live de RLS/RPC auditado; não se deve transformar ausência de um cenário específico no smoke agregado em afirmação de cobertura que o teste não executou.

O frontend ativo está em fase final de acabamento visual. Empresas, Central, Perto de mim e fluxos de criação/edição já receberam o acabamento do MVP; qualquer pendência visual restante deve preservar os contratos funcionais e o lifecycle vigente.

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
- `map`, `nearby`, `search`, `messaging` e `notifications` são capabilities horizontais ativas;
- Mensagens e Notificações não dependem de `business` nem de qualquer outro módulo de produto;
- Business é apenas o provider de domínio ativo em Mapa/Nearby/Busca/Mensagens quando aplicável;
- demais domínios de produto: `paused`.

Domínio pausado pode continuar versionado para evolução pós-MVP, mas não participa de rota funcional, prefetch/warmup, provider ativo, evento acionável, navegação, CTA nem layer do Mapa enquanto estiver `paused`. Pausar um domínio remove apenas suas contribuições; não desativa capabilities horizontais da plataforma.

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

Os workflows pesados adicionam contratos de Auth/session, regressão do MVP, boundaries territoriais e Playwright público. O build canônico também exige `npm audit --omit=dev`; o audit de produção do candidato vigente está limpo. Findings dev-only permanecem sob a autoridade de residuals e não devem ser “corrigidos” por upgrade major forçado.

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
- Durante a certificação final, mudanças operacionais seguem o fluxo protegido vigente e retornam à `main` imediatamente após os gates.
- Não duplicar funcionalidades já implementadas em branches paralelas.
- Mudança persistente de schema exige migration versionada.
- Commit/merge não equivale a produção validada.
- Não reduzir gates para obter verde.
- Código, documentação, testes e runtime devem apontar para o mesmo owner/SSOT.
- Correções devem atacar a causa raiz; paliativos e redirects de compatibilidade não são mecanismo de lifecycle.

## Higiene de repositório

A raiz mantém somente documentação de entrada/governança transversal. Planos concluídos, handoffs encerrados, auditorias históricas e especificações de módulos pausados não permanecem misturados com documentação viva.

A regra para manutenção é simples: **owner claro, uma autoridade por assunto, histórico no archive/Git e nenhuma documentação antiga apresentada como estado atual.**
