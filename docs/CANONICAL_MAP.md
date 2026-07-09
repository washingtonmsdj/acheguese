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
| Taxonomia global oficial | `docs/architecture/TAXONOMY_SSOT.md` |
| Modelagem e ownership | `docs/DATA_MODELING.md` |
| Auditoria estrutural global vigente | `docs/AUDITORIA_ESTRUTURAL_GLOBAL.md` |
| Inventario estrutural | `docs/audits/PROJECT_INVENTORY.md` |
| Relatorio executivo de organizacao e blindagem | `docs/audits/MASTER_REPORT.md` |
| Checklist de execucao | `docs/audits/EXECUTION_CHECKLIST.md` |
| Seguranca | `docs/SECURITY.md` |
| Migracoes | `docs/MIGRATIONS.md` |
| Manutencao e gates | `docs/MAINTENANCE.md` |

## Fontes canonicas por dominio
| Dominio | Fonte oficial atual |
| --- | --- |
| core/routing/location/public-identity | `src/core/routing/README.md`, `src/core/location/docs/LOCATION_ARCHITECTURE.md`, `src/core/public-identity/README.md` |
| profile | `src/core/profiles/docs/CONTRACT_AUDIT_USERID_PROFILEID.md` |
| admin | `src/modules/admin/README.md`, `src/modules/admin/identity/*`, `src/modules/admin/drivers/*`, `src/modules/admin/analytics/*`, `src/core/admin/services/admin.queries.ts` |
| business | `src/core/business/README.md` (dominio base horizontal; nao e vertical) |
| comunicacao-territorial | `docs/COMUNICACAO_TERRITORIAL_ARCHITECTURE.md`, `docs/COMUNICACAO_DISTRIBUICAO_TERRITORIAL_PLANO.md`, `src/core/communication-territorial/README.md` |
| verticals | `src/core/verticals/config.ts`, `src/core/verticals/README.md` |
| gastronomy | `src/modules/business/gastronomy/README.md`, `src/modules/business/gastronomy/index.ts` |
| professionals/services | `src/modules/professionals/README.md`, `src/modules/professionals/services/*`, `src/core/professional/README.md` |
| community/posts | `src/modules/community/README.md`, `src/modules/community-alerts/README.md`, `src/modules/community-issues/README.md`, `src/core/community/index.ts`, `src/core/community/alerts/*`, `src/core/community/issues/*` |
| map | `src/core/maps/README.md` |
| classifieds | `src/modules/classifieds/data/README.md`, `src/modules/classifieds/jobs/*`, `src/core/classifieds/services/ClassifiedUrlService.ts` |
| mobility | `src/modules/mobility/README.md`, `src/modules/mobility/delivery/*`, `src/core/mobility/services/MobilityService.ts`, `src/core/safety/README.md`, `src/core/tracking/README.md` |
| promotions | `src/core/promotions/index.ts` |
| notifications | `src/core/notifications/README.md`, `src/core/notifications/types.ts` |
| verification | `src/core/verification/README.md`, `src/core/verification/services/VerificationService.ts` |

## Nao canonico
- relatorios de sessao, fases, entregas, snapshots e comparativos antigos


