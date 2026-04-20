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
- Indice canonico: [docs/INDEX_CANONICO.md](./docs/INDEX_CANONICO.md)
- Status oficial: [docs/STATUS.md](./docs/STATUS.md)
- Auditoria estrutural: [docs/AUDITORIA_ESTRUTURAL_MODULOS.md](./docs/AUDITORIA_ESTRUTURAL_MODULOS.md)
- Regras SSOT: [docs/CURRENT_RULES.md](./docs/CURRENT_RULES.md)
- Seguranca: [SECURITY.md](./SECURITY.md)

## Politica documental da raiz
Somente `README.md` e `SECURITY.md` ficam na raiz. Demais documentos ficam em `docs/`.

