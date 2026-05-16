# Reorganizacao Estrutural Fase 1 (2026-05-16)

## Escopo aplicado
- Limpeza controlada da raiz.
- Realocacao de documentacao operacional para `docs/`.
- Realocacao de scripts manuais para `scripts/`.
- Preservacao de comportamento funcional (sem mudanca em regras, rotas publicas ou UI).

## Mapa da arquitetura apos fase 1

### Raiz (enxuta)
- Mantidos na raiz apenas artefatos de execucao/projeto: `package.json`, configs (`tsconfig*`, `vite.config.ts`, `eslint.config.js`, etc), `README.md`, `SECURITY.md`.
- Documentacao operacional movida para `docs/*`.
- Scripts utilitarios e SQL manual movidos para `scripts/*`.

### Documentacao
- `docs/communication-territorial/*`
- `docs/typecheck/*`
- `docs/validation/*`
- `docs/archive/artifacts/root-temp-2026-05/*`

### Scripts
- `scripts/maintenance/clear-cache.ps1`
- `scripts/manual/seed/*`
- `scripts/manual/python/*`
- `scripts/manual/sql/*`

### Modulos (`src/modules`)
Padrao alvo por modulo: `components`, `hooks`, `services`, `types`, `pages`, `validations`, `api`, `store`.

Estado observado (resumo):
- Mais aderentes: `business`, `classifieds`, `community`, `guide`, `mobility`.
- Parciais: `admin`, `professionals`, `profile`, `central`, `communication-territorial`.
- Minimos/verticais especializados: `community-*`, `ai`.

## Proxima etapa incremental sugerida
- Fase 2: padronizar apenas `src/modules/communication-territorial` sem alterar contratos publicos.
- Fase 3: reduzir arquivos >700 linhas por prioridade de risco (servicos e paginas com maior acoplamento).
