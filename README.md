# Achegue-se

Plataforma hiperlocal e community-first para comunidade, empresas, classificados, profissionais, mobilidade e educação.

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

`src/features` é namespace legado e não recebe código novo. O único resíduo atual é Eventos e sua consolidação deve ocorrer no owner `src/modules/community-events` sem criar facade concorrente.

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
- [docs/08-roadmap/EXECUCAO_MAIN_ONLY.md](./docs/08-roadmap/EXECUCAO_MAIN_ONLY.md) — execução operacional corrente e critérios de MVP;
- [SECURITY.md](./SECURITY.md) — regras de segurança e gates de release.

Documentos em `docs/10-archive/` são históricos e **nunca** substituem uma fonte ativa. Checkpoints antigos de auditoria também não devem ser tratados como estado atual sem revalidação.

## Política da `main`

- `main` é a única linha ativa de desenvolvimento.
- Não criar branch nova para continuar a estabilização atual.
- Mudança persistente de schema precisa de migration versionada.
- Merge/commit não equivale a produção validada.
- Não reduzir gates para obter verde.
- Código, documentação, testes e runtime devem apontar para o mesmo owner/SSOT.

## Política documental da raiz

A raiz mantém somente os documentos de entrada e governança transversal:

- `README.md`;
- `SECURITY.md`;
- `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md` **temporariamente como ponteiro de compatibilidade**, sem autoridade própria.

Novos planos/status/checkpoints pertencem a `docs/`. O ponteiro URGENTE deve ser removido quando os callers ativos forem migrados.

Planos, arquitetura, status e histórico pertencem a `docs/` e devem estar referenciados pelo índice canônico.