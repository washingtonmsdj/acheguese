# INDEX CANONICO DE DOCUMENTACAO

Data de referencia: 2026-07-09

## Leitura inicial obrigatoria
1. [README da documentacao](./README.md)
2. [Regras vigentes](./CURRENT_RULES.md)
3. [Arquitetura](./ARCHITECTURE.md)
4. [Status atual](./STATUS_ATUAL.md)
5. [Plano executavel da auditoria hiperlocal](./ACAO_EXECUTAVEL_AUDITORIA_HIPERLOCAL.md)
6. [Auditoria estrutural global](./AUDITORIA_ESTRUTURAL_GLOBAL.md)
7. Arquitetura-base Community First: `docs/architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md`

## Fontes ativas por tema
- Regras SSOT e governanca: [CURRENT_RULES.md](./CURRENT_RULES.md)
- Arquitetura global: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Taxonomia global oficial: [architecture/TAXONOMY_SSOT.md](./architecture/TAXONOMY_SSOT.md)
- SSOT da camada core: [architecture/CORE_LAYER_SSOT.md](./architecture/CORE_LAYER_SSOT.md)
- Arquitetura-base Community First:
  [architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md](./architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md)
- Plano executavel Community First:
  `plans/COMMUNITY_FIRST_ARCHITECTURE_PLAN.md`
- Arquitetura de Comunicacao Territorial: [COMUNICACAO_TERRITORIAL_ARCHITECTURE.md](./COMUNICACAO_TERRITORIAL_ARCHITECTURE.md)
- Plano de distribuicao territorial da Comunicacao: [COMUNICACAO_DISTRIBUICAO_TERRITORIAL_PLANO.md](./COMUNICACAO_DISTRIBUICAO_TERRITORIAL_PLANO.md)
- SSOT da consolidacao de gastronomia: [architecture/GASTRONOMY_CONSOLIDATION_SSOT.md](./architecture/GASTRONOMY_CONSOLIDATION_SSOT.md)
- SSOT alvo de Comunidade vs Entidades Publicas: [architecture/COMMUNITY_PORTAL_PUBLIC_ENTITY_SSOT.md](./architecture/COMMUNITY_PORTAL_PUBLIC_ENTITY_SSOT.md)
- Task executavel de limpeza de rotas Comunidade/Publico: [tasks/TASK_COMMUNITY_PORTAL_ROUTING_CLEANUP.md](./tasks/TASK_COMMUNITY_PORTAL_ROUTING_CLEANUP.md)
- Regras atuais de roteamento publico/comunitario:
  [CURRENT_RULES.md](./CURRENT_RULES.md)
- Auditoria estrutural global: [AUDITORIA_ESTRUTURAL_GLOBAL.md](./AUDITORIA_ESTRUTURAL_GLOBAL.md)
- Taxonomia vertical oficial: `src/core/verticals/config.ts` e `src/core/verticals/README.md`
- Mapa de ownership por assunto: [CANONICAL_MAP.md](./CANONICAL_MAP.md)
- Estado operacional atual: [STATUS_ATUAL.md](./STATUS_ATUAL.md)
- Plano operacional atual: [ACAO_EXECUTAVEL_AUDITORIA_HIPERLOCAL.md](./ACAO_EXECUTAVEL_AUDITORIA_HIPERLOCAL.md)
- Migracoes e banco: [MIGRATIONS.md](./MIGRATIONS.md)
- Supabase remoto e segredos: [SUPABASE_SECRETS.md](./SUPABASE_SECRETS.md)
- Seguranca: [SECURITY.md](./SECURITY.md)
- Governance Authorities: [governance/AUTHORITIES.md](./governance/AUTHORITIES.md)
- Security Authority: [governance/security/SECURITY_AUTHORITY.md](./governance/security/SECURITY_AUTHORITY.md)

## Auditorias ativas
- [audits/MASTER_REPORT.md](./audits/MASTER_REPORT.md)
- [audits/PROJECT_INVENTORY.md](./audits/PROJECT_INVENTORY.md)
- [audits/SUPABASE_REMOTE_SECURITY_ADVISOR_2026-07-06.md](./audits/SUPABASE_REMOTE_SECURITY_ADVISOR_2026-07-06.md)
- [audits/EXECUTION_CHECKLIST.md](./audits/EXECUTION_CHECKLIST.md)
- [audits/QUICK_WINS.md](./audits/QUICK_WINS.md)
- [audits/POST_READINESS_BACKLOG.md](./audits/POST_READINESS_BACKLOG.md)

Observacao:
- Para novas funcionalidades hiperlocais, prevalece a arquitetura-base
  Community First. O SSOT de Comunidade vs Entidades Publicas continua vigente
  como contrato especifico de roteamento, canonical e acesso entre site publico
  e portal comunitario.
- Auditorias podem citar caminhos legados por contexto historico; para decisao atual, prevalecem `CURRENT_RULES.md`, `STATUS_ATUAL.md` e `ACAO_EXECUTAVEL_AUDITORIA_HIPERLOCAL.md`.
- Snapshots de auditoria antigos ficam em `docs/audits/historical/` e nao
  substituem contratos vivos.
- `STATUS.md` e documentos com `FINAL`, `100%`, `completo` ou `pronto para producao` no texto/nome sao historicos ate revalidacao explicita em `STATUS_ATUAL.md`.

## Regras de atualizacao
1. Documento vivo global permanece em `docs/`.
2. Contrato tecnico de dominio deve ficar junto ao codigo dono em `src/<dominio>/README.md` ou `src/<dominio>/docs/`.
3. Documento datado de sessao, entrega ou comparativo nao deve permanecer no repositorio principal.
4. Este arquivo e o ponto de entrada canonico da documentacao vigente.
