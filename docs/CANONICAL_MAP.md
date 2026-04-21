# Mapa Canonico de Documentacao

## Uso
Se houver conflito entre documentos, vence a ordem abaixo:
1. `docs/CURRENT_RULES.md`
2. `docs/ARCHITECTURE.md`
3. `docs/DATA_MODELING.md`
4. `docs/audits/MASTER_REPORT.md`
5. Contrato do dominio dono em `src/...`

## Fontes canonicas por tema
| Tema | Fonte oficial atual |
| --- | --- |
| Regras vigentes e fronteiras | `docs/CURRENT_RULES.md` |
| Arquitetura global | `docs/ARCHITECTURE.md` |
| Modelagem e ownership | `docs/DATA_MODELING.md` |
| Inventario estrutural | `docs/audits/PROJECT_INVENTORY.md` |
| Relatorio executivo de organizacao e blindagem | `docs/audits/MASTER_REPORT.md` |
| Checklist de execucao | `docs/audits/EXECUTION_CHECKLIST.md` |
| Seguranca | `docs/SECURITY.md` |
| Migracoes | `docs/MIGRATIONS.md` |
| Manutencao e gates | `docs/MAINTENANCE.md` |
| Mapa de substituicoes documentais | `docs/DOCUMENT_REPLACEMENTS.md` |

## Fontes canonicas por dominio
| Dominio | Fonte oficial atual |
| --- | --- |
| core/routing/location/public-identity | `src/core/routing/README.md`, `src/core/location/docs/LOCATION_ARCHITECTURE.md`, `src/core/public-identity/README.md` |
| profile | `src/core/profiles/docs/CONTRACT_AUDIT_USERID_PROFILEID.md` |
| admin | `src/modules/admin/README.md`, `src/core/admin/services/admin.queries.ts`, `src/core/admin-identidade/pages/AdminIdentidadePage.tsx`, `src/core/admin-motoristas/pages/AdminMotoristasPage.tsx` |
| business | `src/core/business/README.md` |
| gastronomy | `src/modules/gastronomy/README.md`, `src/core/gastronomy/index.ts` |
| professionals/services | `src/core/professional/README.md` |
| community/posts | `src/modules/community/README.md`, `src/core/community/index.ts`, `src/core/community-alerts/README.md` |
| map | `src/core/maps/README.md` |
| classifieds | `src/modules/classifieds/data/README.md`, `src/core/classifieds/services/ClassifiedUrlService.ts` |
| mobility | `src/core/mobility/services/MobilityService.ts`, `src/core/safety/README.md`, `src/core/tracking/README.md` |
| promotions | `src/core/promotions/index.ts` |
| notifications | `src/core/notifications/README.md`, `src/core/notifications/types.ts` |
| verification | `src/core/verification/README.md`, `src/core/verification/services/VerificationService.ts` |

## Nao canonico
- `docs/archive/**`
- `docs/historico/**`
- `docs/historico/architecture-fix/**`
- relatorios de sessao, fases, entregas, snapshots e comparativos antigos
