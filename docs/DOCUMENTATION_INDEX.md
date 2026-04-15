# Indice Mestre da Documentacao

## 1. Regras e arquitetura ativas
| Documento | Papel |
| --- | --- |
| [README.md](./README.md) | Porta de entrada e politica documental |
| [CURRENT_RULES.md](./CURRENT_RULES.md) | Regras vigentes de SSOT, fronteiras e organizacao |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitetura global e estrutura modular |
| [DATA_MODELING.md](./DATA_MODELING.md) | Contratos de dados e ownership |
| [SECURITY.md](./SECURITY.md) | Politicas de seguranca |
| [MIGRATIONS.md](./MIGRATIONS.md) | Guia de migracoes |
| [MAINTENANCE.md](./MAINTENANCE.md) | Rotina de higiene, gates e manutencao |
| [CANONICAL_MAP.md](./CANONICAL_MAP.md) | Fonte canonica por tema |
| [DOCUMENT_REPLACEMENTS.md](./DOCUMENT_REPLACEMENTS.md) | Mapa de documentos substituidos e oficiais |

## 2. Auditoria estrutural ativa
| Documento | Papel |
| --- | --- |
| [audits/PROJECT_INVENTORY.md](./audits/PROJECT_INVENTORY.md) | Inventario gerado do codigo, rotas, services, hooks, tabelas e docs |
| [audits/MASTER_REPORT.md](./audits/MASTER_REPORT.md) | Relatorio executivo completo da auditoria estrutural |
| [audits/EXECUTION_CHECKLIST.md](./audits/EXECUTION_CHECKLIST.md) | Checklist operacional por prioridade |
| [audits/QUICK_WINS.md](./audits/QUICK_WINS.md) | Ganhos de curto prazo sem abrir feature nova |
| [audits/POST_READINESS_BACKLOG.md](./audits/POST_READINESS_BACKLOG.md) | Itens para depois da prontidao do sistema |

## 3. Fontes canonicas por dominio
| Dominio | Fonte principal |
| --- | --- |
| core/routing/location/public-identity | `src/core/routing/README.md`, `src/core/location/docs/LOCATION_ARCHITECTURE.md`, `src/core/public-identity/README.md` |
| profile | `src/core/profiles/docs/CONTRACT_AUDIT_USERID_PROFILEID.md` |
| admin | `src/modules/admin/README.md`, `src/modules/admin/docs/SISTEMA_ESCALAVEL_ADMIN.md` |
| business | `src/core/business/README.md` |
| gastronomy | `src/modules/gastronomy/README.md` |
| professionals/services | `src/core/professional/README.md` |
| community/posts | `src/modules/community/README.md`, `docs/posts/` |
| community-alerts | ainda sem documento canonico unico; ver [audits/MASTER_REPORT.md](./audits/MASTER_REPORT.md) |
| map | `src/core/maps/README.md`, `src/core/geospatial/README.md`, `src/core/geocoding/README.md` |
| classifieds | `src/modules/classifieds/data/README.md` |
| mobility | `src/core/safety/README.md`, `src/core/tracking/README.md` |
| notifications | `src/modules/notifications/README.md` |

## 4. Historico e legado
- [ARCHIVE_INDEX.md](./ARCHIVE_INDEX.md)
- `docs/archive/`
- `docs/historico/`
- `docs/historico/architecture-fix/`

## 5. Convencao para novos documentos
1. Regra global viva: `docs/`.
2. Contrato de dominio: `src/<dominio>/README.md` ou `src/<dominio>/docs/`.
3. Relatorio datado, checkpoint ou fechamento: `docs/archive/`.
4. Material historico sem vigencia: `docs/historico/`.
