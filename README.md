# Achegue-se

Plataforma modular de servicos locais com foco em gastronomia, mobilidade, classificados, comunidade e negocios.

## Stack

- React 18 + TypeScript + Vite
- Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- Tailwind + Radix UI
- Vitest + Playwright

## Estrutura do codigo

```text
src/
  app/            shell da aplicacao (rotas, providers, paginas)
  core/           contratos e capacidades transversais (SSOT)
  modules/        dominios de produto
  shared/         UI e utilitarios compartilhados
  integrations/   adaptadores externos
```

## Setup rapido

```bash
npm install
npm run dev
```

## Validacoes principais

```bash
npm run validate:ssot
npm run validate:architecture:incremental -- --json
npm run validate:architecture:governance -- --json
npm run validate:docs-structure
npm run typecheck
npm run build
```

## Documentacao oficial

- Auditoria tecnica e plano operacional ativo: [AUDITORIA_E_PLANO_IMPLEMENTACAO.md](./AUDITORIA_E_PLANO_IMPLEMENTACAO.md)
- Indice canonico: [docs/INDEX_CANONICO.md](./docs/INDEX_CANONICO.md)
- Status oficial: [docs/architecture/PROJECT-MILESTONE-1.md](./docs/architecture/PROJECT-MILESTONE-1.md)
- Arquitetura Community First: [docs/03-architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md](./docs/03-architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md)
- Regras SSOT: [docs/CURRENT_RULES.md](./docs/CURRENT_RULES.md)
- Seguranca: [SECURITY.md](./SECURITY.md)

## Prioridades operacionais atuais

A auditoria transversal de 19/08/2026 identificou como prioridades principais:

1. proteger a branch `main` e tornar os gates de CI obrigatorios;
2. reconciliar migrations e Edge Functions do Supabase de producao com o GitHub;
3. criar deteccao automatica de drift/provenance entre GitHub, Supabase e releases;
4. concluir os itens de hardening de Auth, RPCs privilegiados, grants e performance descritos no plano canonico.

O estado, checklist, criterios de aceite e ordem de implementacao ficam exclusivamente em [AUDITORIA_E_PLANO_IMPLEMENTACAO.md](./AUDITORIA_E_PLANO_IMPLEMENTACAO.md).

## Politica documental da raiz

A raiz contem somente documentos de entrada e governanca transversal:

- `README.md` — entrada do projeto;
- `SECURITY.md` — politica de seguranca e gates obrigatorios;
- `AUDITORIA_E_PLANO_IMPLEMENTACAO.md` — auditoria transversal ativa e plano canonico de correcao/hardening.

Demais documentos de dominio, arquitetura, referencia e historico permanecem em `docs/`.
