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
npm run validate:docs-live-links
npm run typecheck
npm run build
```

## Documentacao oficial

A porta de entrada unica e o SSOT documental do projeto e [docs/README.md](./docs/README.md).

- Status oficial: [docs/01-product/STATUS.md](./docs/01-product/STATUS.md)
- Regras vigentes: [docs/03-architecture/CURRENT_RULES.md](./docs/03-architecture/CURRENT_RULES.md)
- Arquitetura Community First: [docs/03-architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md](./docs/03-architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md)
- Seguranca: [docs/09-reference/SECURITY.md](./docs/09-reference/SECURITY.md)
- Auditoria de seguranca 2026-08: [docs/09-reference/SECURITY-AUDIT-2026-08.md](./docs/09-reference/SECURITY-AUDIT-2026-08.md)
- Plano de remediacao: [docs/08-roadmap/SECURITY-REMEDIATION-PLAN-2026-08.md](./docs/08-roadmap/SECURITY-REMEDIATION-PLAN-2026-08.md)
- Checklist de implementacao: [docs/08-roadmap/SECURITY-IMPLEMENTATION-CHECKLIST.md](./docs/08-roadmap/SECURITY-IMPLEMENTATION-CHECKLIST.md)

## Politica documental da raiz

Somente `README.md` e `SECURITY.md` ficam na raiz. Demais documentos ativos seguem a taxonomia definida em `docs/README.md`.
