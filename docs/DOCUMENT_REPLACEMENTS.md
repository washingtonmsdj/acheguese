# Documentos Substituidos e Fontes Oficiais

| Classe de documento substituido | Local legado | Fonte oficial atual | Observacao |
| --- | --- | --- | --- |
| Relatorios de sessao, gate, etapa, entrega e status | `docs/archive/root-legacy/`, `docs/archive/status/`, `docs/historico/` | `docs/audits/MASTER_REPORT.md` | Historico continua arquivado; nao e fonte de regra atual. |
| Inventarios estruturais pontuais e auditorias antigas | `docs/archive/root-legacy/auditoria/`, `docs/archive/root-legacy/inventario/` | `docs/audits/PROJECT_INVENTORY.md` | O inventario agora e regeneravel por script. |
| Pacote antigo de correcao arquitetural | `docs/historico/architecture-fix/` | `docs/audits/MASTER_REPORT.md` + `docs/CURRENT_RULES.md` | Material mantido como historico e nao como contrato vivo. |
| Mapas canonicos e indices sobrepostos | versoes antigas de `README.md`, `DOCUMENTATION_INDEX.md` e `CANONICAL_MAP.md` | `docs/DOCUMENTATION_INDEX.md` + `docs/CANONICAL_MAP.md` | `README.md` voltou a ser apenas a porta de entrada. |
| Guias ativos espalhados por raiz e snapshots antigos | `docs/archive/**`, `docs/historico/**` | `docs/README.md` + contratos do dominio em `src/...` | Documento vivo deve ter dono claro e local unico. |

## Regra de classificacao
- Documento ativo global: `docs/`
- Documento ativo de dominio: `src/<dominio>/README.md` ou `src/<dominio>/docs/`
- Auditoria executiva e inventario regeneravel: `docs/audits/`
- Historico e legado: `docs/archive/` e `docs/historico/`
