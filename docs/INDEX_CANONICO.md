# INDEX CANONICO DE DOCUMENTACAO

Data de referencia: 2026-05-06

## Leitura inicial obrigatoria
1. [README da documentacao](./README.md)
2. [Regras vigentes](./CURRENT_RULES.md)
3. [Arquitetura](./ARCHITECTURE.md)
4. [Status atual](./STATUS_ATUAL.md)
5. [Plano executavel da auditoria hiperlocal](./ACAO_EXECUTAVEL_AUDITORIA_HIPERLOCAL.md)
6. [Auditoria estrutural global](./AUDITORIA_ESTRUTURAL_GLOBAL.md)
7. [Auditoria estrutural de modulos](./AUDITORIA_ESTRUTURAL_MODULOS.md)

## Fontes ativas por tema
- Regras SSOT e governanca: [CURRENT_RULES.md](./CURRENT_RULES.md)
- Arquitetura global: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Taxonomia global oficial: [architecture/TAXONOMY_SSOT.md](./architecture/TAXONOMY_SSOT.md)
- SSOT da camada core: [architecture/CORE_LAYER_SSOT.md](./architecture/CORE_LAYER_SSOT.md)
- SSOT da consolidacao de gastronomia: [architecture/GASTRONOMY_CONSOLIDATION_SSOT.md](./architecture/GASTRONOMY_CONSOLIDATION_SSOT.md)
- Auditoria estrutural global: [AUDITORIA_ESTRUTURAL_GLOBAL.md](./AUDITORIA_ESTRUTURAL_GLOBAL.md)
- Taxonomia vertical oficial: `src/core/verticals/config.ts` e `src/core/verticals/README.md`
- Mapa de ownership por assunto: [CANONICAL_MAP.md](./CANONICAL_MAP.md)
- Estado operacional atual: [STATUS_ATUAL.md](./STATUS_ATUAL.md)
- Plano operacional atual: [ACAO_EXECUTAVEL_AUDITORIA_HIPERLOCAL.md](./ACAO_EXECUTAVEL_AUDITORIA_HIPERLOCAL.md)
- Auditoria estrutural e plano de correcao: [AUDITORIA_ESTRUTURAL_MODULOS.md](./AUDITORIA_ESTRUTURAL_MODULOS.md)
- Migracoes e banco: [MIGRATIONS.md](./MIGRATIONS.md)
- Seguranca: [SECURITY.md](./SECURITY.md)

## Auditorias ativas
- [audits/MASTER_REPORT.md](./audits/MASTER_REPORT.md)
- [audits/PROJECT_INVENTORY.md](./audits/PROJECT_INVENTORY.md)
- [audits/EXECUTION_CHECKLIST.md](./audits/EXECUTION_CHECKLIST.md)
- [audits/QUICK_WINS.md](./audits/QUICK_WINS.md)
- [audits/POST_READINESS_BACKLOG.md](./audits/POST_READINESS_BACKLOG.md)
- [tasks/SSOT_EXECUCAO_CONTINUIDADE_2026-04-20.md](./tasks/SSOT_EXECUCAO_CONTINUIDADE_2026-04-20.md)

Observacao:
- Auditorias podem citar caminhos legados por contexto historico; para decisao atual, prevalecem `CURRENT_RULES.md`, `STATUS_ATUAL.md` e `ACAO_EXECUTAVEL_AUDITORIA_HIPERLOCAL.md`.
- `STATUS.md` e documentos com `FINAL`, `100%`, `completo` ou `pronto para producao` no texto/nome sao historicos ate revalidacao explicita em `STATUS_ATUAL.md`.

## Historico e legado
- Historico consolidado: `docs/historico/`
- Arquivo de legado e sessoes: `docs/archive/`
- Lote movido da raiz em 2026-04-20: `docs/historico/root-markdown/`
- Lote movido da raiz em 2026-05-12 (analises/refatoracoes/sessoes/progresso): `docs/historico/root-markdown-2026-05-cleanup/`
- Lote pre-launch consolidado em 2026-04-20: `docs/historico/pre-launch/2026-04-20/`
- Lote gastronomia legado consolidado em 2026-04-22: `docs/archive/2026-04-22-gastronomy-legacy/`
- Ponte historica de pre-launch: `docs/pre-launch/README.md` e `docs/pre-launch/INDEX.md`

## Regras de atualizacao
1. Documento vivo global permanece em `docs/`.
2. Contrato tecnico de dominio deve ficar junto ao codigo dono em `src/<dominio>/README.md` ou `src/<dominio>/docs/`.
3. Documento datado de sessao, entrega ou comparativo entra em `docs/archive/` ou `docs/historico/`.
4. Este arquivo e o ponto de entrada canonico da documentacao vigente.
