# FEED-FREEZE-CHANGELOG.md

Data do Freeze: 2026-07-28

Status: FROZEN

## 1. Marco

O dominio Feed foi oficialmente congelado apos a conclusao das sprints de consolidacao P0/P1 e a auditoria `FEED-FREEZE-AUDIT-2.md`.

## 2. Sprints incluidas

- FEED.AUDIT.1
- FEED.GOVERNANCE.1
- FEED.ROADMAP.1
- FEED.EXECUTION.PLAN.1
- FEED.P0.A
- FEED.P0.A.FINALIZE
- FEED.P0.B
- FEED.P0.C
- FEED.P0.C.HARDENING
- FEED.P0.C.AUTHORITY
- FEED.P0.E
- FEED.P0.E.HARDENING
- FEED.MILESTONE.1
- FEED.MILESTONE.1.HARDENING
- FEED.P0.D.1
- FEED.GOVERNANCE.CLARIFICATION
- FEED.P0.D.2
- FEED.P0.D.2.HARDENING
- FEED.P0.D.3
- FEED.P0.D.3.HARDENING
- FEED.FREEZE.AUDIT
- FEED.P1.A
- FEED.P1.A.HARDENING
- FEED.P1.C
- FEED.P1.B
- FEED.P1.B.HARDENING
- FEED.FREEZE.AUDIT.2
- FEED.FREEZE

## 3. Blockers eliminados

| Blocker | Estado no Freeze | Sprint responsavel |
| --- | --- | --- |
| FRZ-B1 - Update/delete fora do Feed | Eliminado | P1.A |
| FRZ-B2 - Reports/moderation fora do Feed | Eliminado para alvos Feed | P1.C |
| FRZ-B3 - Voto em enquete fora do Feed | Eliminado | P1.A |
| FRZ-B4 - Search/URL canonica fora do Feed | Eliminado | P1.B |
| FRZ-B5 - Enriquecimento de detalhe fora do Feed | Eliminado | P1.A |

## 4. Escopo congelado

Entraram no Freeze:

- timeline;
- detalhe;
- criacao;
- edicao;
- exclusao;
- voto em enquete;
- comentarios;
- reacoes;
- saves;
- compartilhamento;
- denuncias;
- URL canonica territorial;
- Search de posts;
- leitura social de `ride_share`;
- cache territorial;
- Feed query keys;
- validacao de Territory, Rollout e CommunityAccessPolicy;
- excecao oficial de Profile Activity.

## 5. Recomendacoes futuras

As recomendacoes abaixo nao bloqueiam o Freeze, mas devem ser respeitadas em proximas sprints:

| ID | Recomendacao | Origem |
| --- | --- | --- |
| FRZ2-R1 | Restringir `CommunityReportContentDialog` para impedir uso futuro com `post` ou `comment` fora de `FeedService.reportTarget()`. | `FEED-FREEZE-AUDIT-2.md` |
| FRZ2-R2 | Alinhar Profile para abrir posts salvos/historico por URL canonica auditavel quando houver territorio do item. | `FEED-FREEZE-AUDIT-2.md` |
| FRZ2-R3 | Deprecar ou migrar widgets/hooks antigos de Community que leem `postService.getTopPosts()` e `postService.getPopularTags()` diretamente. | `FEED-FREEZE-AUDIT-2.md` |

## 6. Melhorias futuras

| ID | Melhoria | Origem |
| --- | --- | --- |
| FRZ2-F1 | Atualizar comentarios internos obsoletos sobre migracoes antigas de PostService. | `FEED-FREEZE-AUDIT-2.md` |
| FRZ2-F2 | Auditar Realtime e Notifications quando suas sprints entrarem no escopo de Freeze. | `FEED-FREEZE-AUDIT-2.md` |
| FRZ2-F3 | Criar regra estatica futura para impedir imports publicos indevidos de servicos internos fora das excecoes aprovadas. | `FEED-FREEZE-AUDIT-2.md` |

## 7. Regra de evolucao pos-Freeze

Qualquer alteracao futura no dominio Feed devera preservar:

- GOVERNANCE;
- SSOT;
- boundaries;
- contratos publicos;
- FeedContext;
- FeedTarget;
- validacao territorial;
- rollout;
- CommunityAccessPolicy;
- falha fechada;
- URL canonica territorial;
- query keys territoriais;
- ausencia de fallback global.

Qualquer alteracao que nao preserve esses pontos exige ADR/DECISION especifica antes de implementacao.

## 8. Decisao

O dominio Feed foi oficialmente congelado.
