# Relatorio de Remocoes e Movimentacoes - Fase 1 (2026-05-16)

## Movidos da raiz para docs
- `AGENT_PAGE_V2_DOCUMENTATION.md` -> `docs/communication-territorial/AGENT_PAGE_V2_DOCUMENTATION.md`
- `COMMUNICATION_AGENT_V2_SUMMARY.md` -> `docs/communication-territorial/COMMUNICATION_AGENT_V2_SUMMARY.md`
- `COMUNICACAO_*.md` (pacote v2 e status) -> `docs/communication-territorial/`
- `DOCS_INDEX.md` -> `docs/typecheck/INDEX.md`
- `README_TYPECHECK_FIX.md`, `QUICK_START_TYPECHECK.md`, `COMANDOS_RAPIDOS.md`, `PERFORMANCE_GUIDE.md`, `TYPECHECK_README.md`, `TYPECHECK_SOLUTION.md` -> `docs/typecheck/`
- `VALIDACAO_SSOT_RESIDENCE_MANAGER.md` -> `docs/validation/`
- `PAGINA_DETALHES_EMPRESA_CRIADA.md` -> `docs/architecture/`

## Movidos da raiz para scripts
- `clear-cache.ps1` -> `scripts/maintenance/clear-cache.ps1`
- `executar_seed.ps1`, `executar_seed.sh` -> `scripts/manual/seed/`
- `fix_encoding.py`, `fix-migrations-idempotent.py` -> `scripts/manual/python/`
- SQL manuais (`APLICAR_*`, `DIAGNOSTICO_*`, `EXECUTAR_*`, `LIMPAR_DADOS_MOCK.sql`, `RECARREGAR_SCHEMA_CACHE.sql`, `VERIFICAR_*.sql`) -> `scripts/manual/sql/`

## Artefatos temporarios realocados
- `.tmp*` e `tmp-vite-*.log` -> `docs/archive/artifacts/root-temp-2026-05/`
- `build.log`, `vite-browser-check.log`, `TYPECHECK_FIXED.txt` -> `docs/archive/artifacts/root-temp-2026-05/`

## Ajustes complementares
- Atualizacao de referencias em:
  - `src/modules/communication-territorial/INDEX.md`
  - `src/modules/communication-territorial/v2/README.md`
  - `src/modules/communication-territorial/v2/IMPLEMENTATION_STATUS.md`
  - `src/modules/communication-territorial/v2/EXAMPLES.md`
- Scripts de seed e limpeza atualizados para resolver `repoRoot` automaticamente.
- `.gitignore` reforcado para evitar nova poluicao da raiz com artefatos temporarios.
