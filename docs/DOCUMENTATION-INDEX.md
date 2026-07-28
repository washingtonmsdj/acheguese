# DOCUMENTATION-INDEX.md

Data: 2026-07-28

Status: CANONICO

Objetivo: ser o indice oficial de documentacao do projeto apos os marcos Territory e Feed STATUS: FROZEN.

Regra: qualquer documento fora deste indice nao deve ser tratado como fonte normativa sem verificar seu status aqui.

## 1. Status oficiais

| Status | Significado |
| --- | --- |
| CANONICO | Documento ativo para decisao, governanca, mapa, SSOT ou referencia operacional atual. |
| HISTORICO | Evidencia de sprint, auditoria, decisao ou contexto passado. Pode ser citado, mas nao reabre decisao atual. |
| SUBSTITUIDO | Documento cuja autoridade foi substituida por outro documento explicito. Nao usar como fonte viva. |
| RASCUNHO | Plano, checklist, temp file, backlog ou material ainda nao aprovado como padrao oficial. |
| ARQUIVADO | Arquivo dentro de `docs/10-archive/**`. Nao usar como fonte ativa. |

## 2. Documentos canonicos principais

| Area | Documento canonico |
| --- | --- |
| Indice oficial | `docs/DOCUMENTATION-INDEX.md` |
| Auditoria desta consolidacao | `docs/PROJECT-DOCUMENTATION-AUDIT.md` |
| Estado arquitetural do projeto | `docs/architecture/PROJECT-MILESTONE-1.md` |
| Funcionalidades | `docs/FEATURE-MAP.md` |
| Telas e rotas | `docs/SCREEN-MAP.md` |
| Registry tecnico de SSOT | `docs/architecture/SSOT_REGISTRY.md` |
| Territory | `docs/domain/TERRITORY-GOVERNANCE.md` |
| Territory roadmap | `docs/domain/TERRITORY-ROADMAP.md` |
| Territory data quality | `docs/domain/TERRITORY-DATA-QUALITY-V2.md` |
| Feed governance | `docs/feed/FEED-GOVERNANCE.md` |
| Feed freeze | `docs/feed/FEED-FREEZE.md` |
| Feed freeze changelog | `docs/feed/FEED-FREEZE-CHANGELOG.md` |

## 3. Inventario oficial

| Nome | Dominio | Status | Owner | Documento substituto | Observacoes |
| --- | --- | --- | --- | --- | --- |
| docs/DOCUMENTATION-INDEX.md | Documentation | CANONICO | Architecture | - | Criado nesta sprint como indice oficial. |
| docs/PROJECT-DOCUMENTATION-AUDIT.md | Documentation | CANONICO | Architecture | - | Criado nesta sprint como auditoria oficial. |
| docs/PROJECT-DOCUMENTATION-HARDENING.md | Documentation | CANONICO | Architecture | - | Hardening oficial dos conflitos documentais registrados. |
| docs/README.md | Documentation | CANONICO | Architecture | docs/DOCUMENTATION-INDEX.md | Entrada geral; o indice oficial passa a ser este documento. |
| docs/FEATURE-MAP.md | Project | CANONICO | Architecture | - | Mapa ativo de funcionalidades; Feed marcado como STATUS: FROZEN. |
| docs/SCREEN-MAP.md | Project | CANONICO | Architecture | - | Mapa ativo de rotas/telas; Feed marcado como STATUS: FROZEN. |
| docs/architecture/PROJECT-MILESTONE-1.md | Project | CANONICO | Architecture | - | Marco atual apos Territory e Feed Freeze. |
| docs/architecture/SSOT_REGISTRY.md | Project | CANONICO | Architecture | - | Registry tecnico ativo; possui conflitos registrados na auditoria. |
| docs/DECISIONS.md | Project | HISTORICO | Architecture | docs/DOCUMENTATION-INDEX.md | Registro legado de decisoes; usar ADR/DECISION especifica para nova decisao. |
| docs/SSOT_LOCATION_CONTRACT.md | Project | HISTORICO | Architecture | docs/domain/TERRITORY-GOVERNANCE.md | Contrato legado de location; Territory atual governa o dominio. |
| docs/SSOT_LOCATION_WAVE0_CHECKLIST.md | Project | HISTORICO | Architecture | docs/domain/TERRITORY-GOVERNANCE.md | Checklist historico de location. |
| docs/SSOT_PATTERNS.md | Project | HISTORICO | Architecture | docs/DOCUMENTATION-INDEX.md | Padroes antigos; validar antes de usar como regra. |
| docs/PLANO_MESTRE_EXECUCAO_INTEGRAL_SSOT.md | Roadmap/Tasks | RASCUNHO | Product/Architecture | docs/PROJECT-DOCUMENTATION-AUDIT.md | Plano/backlog nao congelado. |
| docs/01-product/DEMO-READY.md | Product | HISTORICO | Product | docs/FEATURE-MAP.md | Relatorio de demo preservado como historico. |
| docs/01-product/PROJECT-HEALTH-REPORT.md | Product | HISTORICO | Product | docs/FEATURE-MAP.md | Relatorio de saude preservado como historico. |
| docs/01-product/PROJECT-SCORE.md | Product | HISTORICO | Product | docs/FEATURE-MAP.md | Score preservado como historico. |
| docs/01-product/STATUS.md | Product | SUBSTITUIDO | Product | docs/architecture/PROJECT-MILESTONE-1.md | Status extenso/antigo; usar Milestone, Feature Map e Screen Map para estado oficial. |
| docs/02-domain/DATA_MODELING.md | Domain | HISTORICO | Architecture | docs/domain/TERRITORY-GOVERNANCE.md | Fundacao historica de dominio. |
| docs/02-domain/DOMAIN-MAPPING.md | Domain | HISTORICO | Architecture | docs/domain/TERRITORY-GOVERNANCE.md | Fundacao historica de dominio. |
| docs/02-domain/GEOGRAPHIC_FOUNDATION.md | Domain | HISTORICO | Architecture | docs/domain/TERRITORY-GOVERNANCE.md | Fundacao historica de dominio. |
| docs/02-domain/TAXONOMY_SSOT.md | Domain | HISTORICO | Architecture | docs/domain/TERRITORY-GOVERNANCE.md | Fundacao historica de dominio. |
| docs/02-domain/TERRITORY-DOMAIN.md | Domain | HISTORICO | Architecture | docs/domain/TERRITORY-GOVERNANCE.md | Fundacao historica de dominio. |
| docs/03-architecture/ARCHITECTURE.md | Architecture | CANONICO | Architecture | docs/architecture/PROJECT-MILESTONE-1.md | Arquitetura ativa, subordinada ao Project Milestone. |
| docs/03-architecture/CANONICAL_MAP.md | Architecture | SUBSTITUIDO | Architecture | docs/DOCUMENTATION-INDEX.md | Mapa canonico antigo substituido por este indice. |
| docs/03-architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md | Architecture | CANONICO | Architecture | docs/architecture/PROJECT-MILESTONE-1.md | SSOT arquitetural ativo de Community First. |
| docs/03-architecture/COMMUNITY_PORTAL_PUBLIC_ENTITY_SSOT.md | Architecture | CANONICO | Architecture | docs/architecture/PROJECT-MILESTONE-1.md | SSOT arquitetural ativo de Community Portal. |
| docs/03-architecture/CORE_LAYER_SSOT.md | Architecture | CANONICO | Architecture | docs/architecture/PROJECT-MILESTONE-1.md | SSOT ativo de Core Layer. |
| docs/03-architecture/CORE_PLATFORM_ARCHITECTURE_SSOT.md | Architecture | CANONICO | Architecture | docs/architecture/PROJECT-MILESTONE-1.md | SSOT ativo de Core Platform. |
| docs/03-architecture/CURRENT_RULES.md | Architecture | CANONICO | Architecture | docs/architecture/PROJECT-MILESTONE-1.md | Regras arquiteturais ativas, subordinadas ao Milestone. |
| docs/03-architecture/MAINTENANCE.md | Architecture | CANONICO | Architecture | docs/architecture/PROJECT-MILESTONE-1.md | Guia ativo de manutencao. |
| docs/04-design/DESIGN-DECISIONS.md | UX/Design/Navigation | CANONICO | Design/Product | docs/FEATURE-MAP.md | Decisoes de design ativas. |
| docs/04-design/DESIGN-TOKENS.md | UX/Design/Navigation | CANONICO | Design/Product | docs/FEATURE-MAP.md | Tokens de design ativos. |
| docs/04-design/UI-CONCEPT.md | UX/Design/Navigation | CANONICO | Design/Product | docs/FEATURE-MAP.md | Conceito UI ativo. |
| docs/05-ux/FEED-CONTENT.md | UX/Design/Navigation | CANONICO | Design/Product | docs/FEATURE-MAP.md | Conteudo UX ativo, subordinado ao Feed Freeze. |
| docs/05-ux/FEED-REVIEW.md | UX/Design/Navigation | CANONICO | Design/Product | docs/FEATURE-MAP.md | Review UX ativa como referencia visual, nao governanca. |
| docs/05-ux/FRICTION-MAP.md | UX/Design/Navigation | CANONICO | Design/Product | docs/FEATURE-MAP.md | Mapa de friccao ativo. |
| docs/05-ux/HOME-CONTENT.md | UX/Design/Navigation | CANONICO | Design/Product | docs/FEATURE-MAP.md | Conteudo ativo de Home. |
| docs/05-ux/HOME-INVENTORY.md | UX/Design/Navigation | CANONICO | Design/Product | docs/FEATURE-MAP.md | Inventario ativo de Home. |
| docs/05-ux/HOME-REVIEW.md | UX/Design/Navigation | CANONICO | Design/Product | docs/FEATURE-MAP.md | Review ativa de Home. |
| docs/05-ux/HOME-SPEC.md | UX/Design/Navigation | CANONICO | Design/Product | docs/FEATURE-MAP.md | Spec ativa de Home. |
| docs/05-ux/HOME-UI-REVIEW.md | UX/Design/Navigation | CANONICO | Design/Product | docs/FEATURE-MAP.md | Review visual ativa. |
| docs/05-ux/POST-CONTENT.md | UX/Design/Navigation | CANONICO | Design/Product | docs/FEATURE-MAP.md | Conteudo UX ativo de post, subordinado ao Feed Freeze. |
| docs/05-ux/POST-REVIEW.md | UX/Design/Navigation | CANONICO | Design/Product | docs/FEATURE-MAP.md | Review UX ativa de post. |
| docs/05-ux/USER-JOURNEY-REVIEW.md | UX/Design/Navigation | CANONICO | Design/Product | docs/FEATURE-MAP.md | Jornada ativa. |
| docs/05-ux/UX-AUDIT.md | UX/Design/Navigation | CANONICO | Design/Product | docs/FEATURE-MAP.md | Auditoria UX ativa. |
| docs/05-ux/UX-IMPROVEMENTS.md | UX/Design/Navigation | CANONICO | Design/Product | docs/FEATURE-MAP.md | Melhorias UX ativas. |
| docs/06-navigation/INFORMATION-ARCHITECTURE.md | UX/Design/Navigation | CANONICO | Design/Product | docs/SCREEN-MAP.md | Arquitetura de informacao ativa. |
| docs/06-navigation/NAVIGATION-MAPPING.md | UX/Design/Navigation | CANONICO | Design/Product | docs/SCREEN-MAP.md | Mapeamento ativo de navegacao. |
| docs/06-navigation/NAVIGATION-SYSTEM.md | UX/Design/Navigation | CANONICO | Design/Product | docs/SCREEN-MAP.md | Sistema ativo de navegacao. |
| docs/07-modules/ARQUITETURA_POSTS_SSOT.md | Feed/Posts | SUBSTITUIDO | Feed | docs/feed/FEED-FREEZE.md | Superficie publica de Feed substituida pelo Freeze. |
| docs/07-modules/POSTS_FEED_SSOT.md | Feed/Posts | SUBSTITUIDO | Feed | docs/feed/FEED-FREEZE.md | Superficie publica de Feed substituida pelo Freeze. |
| docs/07-modules/AUDIT_MODERATION_SSOT.md | Modules | CANONICO | Domain owner | docs/architecture/PROJECT-MILESTONE-1.md | SSOT modular ativo. |
| docs/07-modules/BUSINESS_FAVORITES_SSOT.md | Modules | CANONICO | Domain owner | docs/architecture/PROJECT-MILESTONE-1.md | SSOT modular ativo. |
| docs/07-modules/CLASSIFIED_MESSAGING_SSOT.md | Modules | CANONICO | Domain owner | docs/architecture/PROJECT-MILESTONE-1.md | SSOT modular ativo. |
| docs/07-modules/COMMUNITY_DIRECT_MESSAGING_SSOT.md | Modules | CANONICO | Domain owner | docs/architecture/PROJECT-MILESTONE-1.md | SSOT modular ativo. |
| docs/07-modules/COVERAGE_SSOT.md | Modules | CANONICO | Domain owner | docs/architecture/PROJECT-MILESTONE-1.md | SSOT modular ativo. |
| docs/07-modules/ENTITY_PRIVATE_DATA_SSOT.md | Modules | CANONICO | Domain owner | docs/architecture/PROJECT-MILESTONE-1.md | SSOT modular ativo; path diverge do registry atual. |
| docs/07-modules/GASTRONOMY_CONSOLIDATION_SSOT.md | Modules | CANONICO | Domain owner | docs/architecture/PROJECT-MILESTONE-1.md | SSOT modular ativo. |
| docs/07-modules/MEDIA_ASSET_SSOT.md | Modules | CANONICO | Domain owner | docs/architecture/PROJECT-MILESTONE-1.md | SSOT modular ativo. |
| docs/07-modules/MOBILITY_MOTOBOY.md | Modules | CANONICO | Domain owner | docs/architecture/PROJECT-MILESTONE-1.md | SSOT modular ativo. |
| docs/07-modules/NOTIFICATION_PREFERENCES_SSOT.md | Modules | CANONICO | Domain owner | docs/architecture/PROJECT-MILESTONE-1.md | SSOT modular ativo. |
| docs/07-modules/PROFILE_VERIFICATION_SSOT.md | Modules | CANONICO | Domain owner | docs/architecture/PROJECT-MILESTONE-1.md | SSOT modular ativo. |
| docs/07-modules/REALTIME_SSOT.md | Modules | CANONICO | Domain owner | docs/architecture/PROJECT-MILESTONE-1.md | SSOT modular ativo. |
| docs/07-modules/REVIEWS_SSOT.md | Modules | CANONICO | Domain owner | docs/architecture/PROJECT-MILESTONE-1.md | SSOT modular ativo. |
| docs/07-modules/SEARCH_SSOT.md | Modules | CANONICO | Domain owner | docs/architecture/PROJECT-MILESTONE-1.md | SSOT modular ativo. |
| docs/07-modules/SOCIAL_ENGAGEMENT_SSOT.md | Modules | CANONICO | Domain owner | docs/architecture/PROJECT-MILESTONE-1.md | SSOT modular ativo para Engagement atomico; Feed publico esta congelado. |
| docs/08-roadmap/MONOREPO_MIGRATION_PLAN.md | Roadmap/Tasks | RASCUNHO | Product/Architecture | docs/PROJECT-DOCUMENTATION-AUDIT.md | Plano nao congelado. |
| docs/08-roadmap/NEXT-STEPS.md | Roadmap/Tasks | RASCUNHO | Product/Architecture | docs/PROJECT-DOCUMENTATION-AUDIT.md | Plano nao congelado. |
| docs/08-roadmap/RECOVERY-ROADMAP.md | Roadmap/Tasks | RASCUNHO | Product/Architecture | docs/PROJECT-DOCUMENTATION-AUDIT.md | Plano nao congelado. |
| docs/09-reference/adr/ADR-001-ssot-motoboy-ride-requests.md | ADR | HISTORICO | Architecture | docs/DOCUMENTATION-INDEX.md | ADR preservada; verificar incorporacao antes de reabrir decisao. |
| docs/09-reference/EDGE_FUNCTION_SECRETS.md | Security | CANONICO | Security | - | Referencia operacional de secrets. |
| docs/09-reference/governance/AUTHORITIES.md | Security | CANONICO | Security | - | Autoridades operacionais ativas. |
| docs/09-reference/governance/security/AI_AGENT_RULES.md | Security | CANONICO | Security | - | Regras ativas para agente AI. |
| docs/09-reference/governance/security/EDGE_FUNCTION_AUTH_POLICY.json | Security | CANONICO | Security | - | Politica ativa de edge functions. |
| docs/09-reference/governance/security/EXCEPTIONS.md | Security | CANONICO | Security | - | Excecoes de seguranca ativas. |
| docs/09-reference/governance/security/RISK_LEVELS.md | Security | CANONICO | Security | - | Taxonomia ativa de risco. |
| docs/09-reference/governance/security/SECURITY_AUTHORITY.md | Security | CANONICO | Security | - | Autoridade de seguranca ativa. |
| docs/09-reference/governance/security/SERVICE_ROLE_BOUNDARY_POLICY.json | Security | CANONICO | Security | - | Politica ativa de service role. |
| docs/09-reference/governance/security/SUPABASE_ADVISOR_RESIDUALS.json | Security | CANONICO | Security | - | Registro ativo de residuos do advisor. |
| docs/09-reference/governance/security/SUPABASE_SECURITY_MODEL.md | Security | CANONICO | Security | - | Modelo ativo de seguranca Supabase. |
| docs/09-reference/SECURITY.md | Security | CANONICO | Security | - | Referencia de seguranca ativa. |
| docs/09-reference/SUPABASE_SECRETS.md | Security | CANONICO | Security | - | Referencia ativa de secrets Supabase. |
| docs/09-reference/HUSKY_HOOKS.md | Reference | HISTORICO | Architecture | docs/DOCUMENTATION-INDEX.md | Referencia operacional; validar antes de uso normativo. |
| docs/09-reference/MIGRATIONS.md | Reference | HISTORICO | Architecture | docs/DOCUMENTATION-INDEX.md | Referencia operacional; validar antes de uso normativo. |
| docs/09-reference/migrations-pending/20260720120000_create_community_interest_registrations.sql | Database | RASCUNHO | Database | - | Migration pendente; nao e arquitetura congelada. |
| docs/09-reference/migrations-pending/20260720130000_create_community_post_drafts.sql | Database | RASCUNHO | Database | - | Migration pendente; nao e arquitetura congelada. |
| docs/09-reference/migrations-pending/README.md | Database | RASCUNHO | Database | - | Indice de migrations pendentes. |
| docs/architecture/PROJECT-MILESTONE-1.md | Project | CANONICO | Architecture | - | Marco oficial atual. |
| docs/architecture/SSOT_REGISTRY.md | Project | CANONICO | Architecture | - | Registry ativo; requer alinhamento futuro com Feed Freeze e paths atuais. |
| docs/audits/_tmp_core_to_app.txt | Audit | RASCUNHO | Architecture | - | Temporario de auditoria; candidato a remocao. |
| docs/audits/_tmp_cross_module_imports.txt | Audit | RASCUNHO | Architecture | - | Temporario de auditoria; candidato a remocao. |
| docs/audits/_tmp_modules_to_integrations.txt | Audit | RASCUNHO | Architecture | - | Temporario de auditoria; candidato a remocao. |
| docs/audits/_tmp_shared_domain_hits.txt | Audit | RASCUNHO | Architecture | - | Temporario de auditoria; candidato a remocao. |
| docs/audits/_tmp_shared_to_domain.txt | Audit | RASCUNHO | Architecture | - | Temporario de auditoria; candidato a remocao. |
| docs/audits/_tmp_validate_deps_output.txt | Audit | RASCUNHO | Architecture | - | Temporario de auditoria; candidato a remocao. |
| docs/audits/EXEMPLO_MIGRACAO_BILLING_PLANS.md | Audit | HISTORICO | Architecture | docs/PROJECT-DOCUMENTATION-AUDIT.md | Auditoria antiga preservada como evidencia. |
| docs/audits/PLANO_CORRECAO_IMEDIATA.md | Audit | HISTORICO | Architecture | docs/PROJECT-DOCUMENTATION-AUDIT.md | Plano historico. |
| docs/audits/PLANO_MIGRACAO_HARDCODES.md | Audit | HISTORICO | Architecture | docs/PROJECT-DOCUMENTATION-AUDIT.md | Plano historico. |
| docs/audits/RELATORIO_HARDCODES_ENCONTRADOS.md | Audit | HISTORICO | Architecture | docs/PROJECT-DOCUMENTATION-AUDIT.md | Auditoria historica. |
| docs/audits/RESUMO_EXECUTIVO_AUDITORIA.md | Audit | HISTORICO | Architecture | docs/PROJECT-DOCUMENTATION-AUDIT.md | Auditoria historica. |
| docs/domain/P0-B-REPORT.md | Territory | HISTORICO | Territory | docs/domain/TERRITORY-GOVERNANCE.md | Evidencia de sprint P0. |
| docs/domain/P0-C-REPORT.md | Territory | HISTORICO | Territory | docs/domain/TERRITORY-GOVERNANCE.md | Evidencia de sprint P0. |
| docs/domain/P0-D-REPORT.md | Territory | HISTORICO | Territory | docs/domain/TERRITORY-GOVERNANCE.md | Evidencia de sprint P0. |
| docs/domain/SALVADOR.READINESS.2.md | Territory | HISTORICO | Territory | docs/domain/TERRITORY-GOVERNANCE.md | Evidencia de readiness Salvador. |
| docs/domain/SALVADOR-IMPLEMENTATION-1-REPORT.md | Territory | HISTORICO | Territory | docs/domain/TERRITORY-GOVERNANCE.md | Evidencia de implementacao Salvador. |
| docs/domain/SALVADOR-READINESS-REPORT.md | Territory | HISTORICO | Territory | docs/domain/TERRITORY-GOVERNANCE.md | Evidencia de readiness Salvador. |
| docs/domain/TERRITORY-DATA-QUALITY.md | Territory | SUBSTITUIDO | Territory | docs/domain/TERRITORY-DATA-QUALITY-V2.md | Substituido pela V2. |
| docs/domain/TERRITORY-DATA-QUALITY-REVIEW.md | Territory | SUBSTITUIDO | Territory | docs/domain/TERRITORY-DATA-QUALITY-V2.md | Review incorporada na V2. |
| docs/domain/TERRITORY-DATA-QUALITY-V2.md | Territory | CANONICO | Territory | - | Modelo atual de qualidade territorial. |
| docs/domain/TERRITORY-ENTERPRISE-AUDIT.md | Territory | HISTORICO | Territory | docs/domain/TERRITORY-GOVERNANCE.md | Auditoria historica. |
| docs/domain/TERRITORY-FREEZE-AUDIT.md | Territory | HISTORICO | Territory | docs/domain/TERRITORY-GOVERNANCE.md | Auditoria historica; Territory nao esta em Freeze completo. |
| docs/domain/TERRITORY-GOVERNANCE.md | Territory | CANONICO | Territory | - | Constituicao oficial do dominio Territory. |
| docs/domain/TERRITORY-P0-EXECUTION-PLAN.md | Territory | HISTORICO | Territory | docs/domain/TERRITORY-GOVERNANCE.md | Plano de execucao historico. |
| docs/domain/TERRITORY-ROADMAP.md | Territory | CANONICO | Territory | - | Roadmap oficial vigente do Territory. |
| docs/feed/FEED-AUDIT.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Evidencia historica de auditoria. |
| docs/feed/FEED-AUTHORITY-AUDIT.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Evidencia historica de autoridade. |
| docs/feed/FEED-EXECUTION-PLAN.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Plano concluido; nao e autoridade pos-Freeze. |
| docs/feed/FEED-FREEZE.md | Feed | CANONICO | Feed | - | Documento oficial do Feed STATUS: FROZEN. |
| docs/feed/FEED-FREEZE-AUDIT.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Auditoria original preservada. |
| docs/feed/FEED-FREEZE-AUDIT-2.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Evidencia da aprovacao do Freeze. |
| docs/feed/FEED-FREEZE-CHANGELOG.md | Feed | CANONICO | Feed | - | Changelog oficial do Freeze. |
| docs/feed/FEED-GOVERNANCE.md | Feed | CANONICO | Feed | - | Constituicao oficial do Feed congelado. |
| docs/feed/FEED-GOVERNANCE-CHANGELOG.md | Feed | CANONICO | Feed | - | Changelog oficial de governance do Feed. |
| docs/feed/FEED-MILESTONE-1.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Marco intermediario incorporado ao Freeze. |
| docs/feed/FEED-MILESTONE-1-AUDIT.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Auditoria intermediaria. |
| docs/feed/FEED-MILESTONE-1-HARDENING.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Hardening intermediario. |
| docs/feed/FEED-P0.A-FINAL-REPORT.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Relatorio de sprint. |
| docs/feed/FEED-P0.A-REPORT.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Relatorio de sprint. |
| docs/feed/FEED-P0.A-REVIEW.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Review de sprint. |
| docs/feed/FEED-P0.B-REPORT.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Relatorio de sprint. |
| docs/feed/FEED-P0.B-REVIEW.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Review de sprint. |
| docs/feed/FEED-P0.C-AUTHORITY-REPORT.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Relatorio de autoridade incorporado ao Freeze. |
| docs/feed/FEED-P0.C-FINAL-REVIEW.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Review final. |
| docs/feed/FEED-P0.C-HARDENING-REPORT.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Hardening de sprint. |
| docs/feed/FEED-P0.C-REPORT.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Relatorio de sprint. |
| docs/feed/FEED-P0.C-REVIEW.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Review de sprint. |
| docs/feed/FEED-P0.D.1-REPORT.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Relatorio de comentarios. |
| docs/feed/FEED-P0.D.1-REVIEW.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Review de comentarios. |
| docs/feed/FEED-P0.D.2-HARDENING-REPORT.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Hardening de reacoes/saves. |
| docs/feed/FEED-P0.D.2-REPORT.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Relatorio de reacoes/saves. |
| docs/feed/FEED-P0.D.2-REVIEW.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Review de reacoes/saves. |
| docs/feed/FEED-P0.D.3-HARDENING-REPORT.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Hardening de share. |
| docs/feed/FEED-P0.D.3-REPORT.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Relatorio de share. |
| docs/feed/FEED-P0.D.3-REVIEW.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Review de share. |
| docs/feed/FEED-P0.E-HARDENING-REPORT.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Hardening de ride_share. |
| docs/feed/FEED-P0.E-REPORT.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Relatorio de ride_share. |
| docs/feed/FEED-P0.E-REVIEW.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Review de ride_share. |
| docs/feed/FEED-P0-REBASE.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Rebase historico de roadmap. |
| docs/feed/FEED-P1.A-HARDENING-REPORT.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Hardening de P1.A. |
| docs/feed/FEED-P1.A-REPORT.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Relatorio de P1.A. |
| docs/feed/FEED-P1.A-REVIEW.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Review de P1.A. |
| docs/feed/FEED-P1.B-HARDENING-REPORT.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Hardening de P1.B. |
| docs/feed/FEED-P1.B-REPORT.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Relatorio de P1.B. |
| docs/feed/FEED-P1.B-REVIEW.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Review de P1.B. |
| docs/feed/FEED-P1.C-REPORT.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Relatorio de P1.C. |
| docs/feed/FEED-P1.C-REVIEW.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Review de P1.C. |
| docs/feed/FEED-PROFILE-BOUNDARY-DECISION.md | Feed | HISTORICO | Feed | docs/feed/FEED-GOVERNANCE.md | Decisao incorporada ao changelog de governance. |
| docs/feed/FEED-ROADMAP.md | Feed | HISTORICO | Feed | docs/feed/FEED-FREEZE.md | Roadmap concluido para o Freeze. |
| docs/mobility/motoboy/STATUS_OPERACIONAL.md | Mobility | CANONICO | Mobility | docs/architecture/PROJECT-MILESTONE-1.md | Status operacional de subdominio Mobility. |
| docs/tasks/PLANO_AAA_MONETIZACAO_MULTI_VERTICAL_SSOT.md | Roadmap/Tasks | RASCUNHO | Product/Architecture | docs/PROJECT-DOCUMENTATION-AUDIT.md | Plano nao congelado. |
| docs/tasks/SSOT_EXECUCAO_CONTINUIDADE_2026-04-20.md | Roadmap/Tasks | RASCUNHO | Product/Architecture | docs/PROJECT-DOCUMENTATION-AUDIT.md | Plano nao congelado. |

## 4. Arquivo morto

Todos os documentos sob `docs/10-archive/**` possuem a seguinte classificacao herdada:

| Campo | Valor |
| --- | --- |
| Dominio | Archive |
| Status | ARQUIVADO |
| Owner | Docs |
| Documento substituto | docs/DOCUMENTATION-INDEX.md |
| Observacoes | Nao usar como fonte ativa. Pode ser consultado apenas como evidencia historica. |

| Prefixo | Quantidade | Status |
| --- | ---: | --- |
| docs/10-archive/architecture-legacy/** | 24 | ARQUIVADO |
| docs/10-archive/audits/** | 49 | ARQUIVADO |
| docs/10-archive/communication-territorial/** | 11 | ARQUIVADO |
| docs/10-archive/education/** | 18 | ARQUIVADO |
| docs/10-archive/fixes/** | 5 | ARQUIVADO |
| docs/10-archive/misc/** | 6 | ARQUIVADO |
| docs/10-archive/mobility/** | 8 | ARQUIVADO |
| docs/10-archive/root-legacy/** | 16 | ARQUIVADO |
| docs/10-archive/typecheck/** | 7 | ARQUIVADO |

Total em `docs/10-archive/**`: 144 documentos.

## 5. Resumo por status

| Status | Quantidade |
| --- | ---: |
| CANONICO | 69 |
| HISTORICO | 69 |
| SUBSTITUIDO | 6 |
| RASCUNHO | 15 |
| ARQUIVADO | 144 |

Total classificado: 303 entradas, incluindo os 300 documentos existentes em `docs/` e os 3 documentos criados nas sprints de consolidacao/hardening.
