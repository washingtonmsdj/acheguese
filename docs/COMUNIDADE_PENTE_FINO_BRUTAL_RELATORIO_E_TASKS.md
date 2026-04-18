# COMUNIDADE - PENTE FINO BRUTAL (RELATORIO + TASKS)

Data: 2026-04-17
Status deste documento: ANALISE + PLANO (sem implementacao de codigo neste passo)
Escopo: pagina/modulo comunidade + admin + profile + paginas relacionadas + lacunas do projeto para fechar lancamento

---

## 1) Objetivo

Executar um pente fino brutal no modulo Comunidade para:
- eliminar fluxos quebrados ou incompletos
- restaurar SSOT real (frontend, services, banco e admin)
- fechar governanca de permissoes e moderacao
- mapear backlog por fases, com ordem de execucao e DoD
- listar o que falta no projeto como um todo para ficar pronto para lancamento limpo

---

## 2) Escopo analisado

Incluido neste pente fino:
- rotas e navegacao da Comunidade
- feed principal (posts), composer, comentarios, notificacoes, widgets
- submodulos de alertas e problemas urbanos
- moderacao/admin da comunidade (geral, alertas, issues)
- integracao com profile/workspace
- estado de migracoes Supabase e aderencia de testes ao schema atual
- riscos de SSOT, seguranca, performance e qualidade

Nao incluido neste passo:
- implementacao de codigo
- execucao de testes automatizados

---

## 3) Diagnostico executivo (estado real)

### 3.1 Sinal verde (base que existe)

1. Rota canonica territorial de comunidade existe:
- `/comunidade/:state/:city/:groupSlugOrDistrict` e `/comunidade/:state/:city` em:
  - `src/app/routes/AppRoutes.tsx:284-288`

2. Pagina principal de comunidade existe e integra criacao de post/alerta/issue via modais:
- `src/modules/community/pages/ComunidadePage.tsx`

3. Services dedicados de `community-alerts` e `community-issues` existem e seguem intencao SSOT por modulo:
- `src/modules/community-alerts/services/CommunityAlertService.ts`
- `src/modules/community-issues/services/CommunityIssueService.ts`

4. Admin layout possui guard de acesso admin no nivel de shell:
- `src/modules/admin/pages/AdminLayout.tsx:349-401`

### 3.2 Bloqueadores criticos de lancamento

1. Acoes essenciais de feed ainda em stub/no-op:
- `handleSave`, `handleShare`, `handleReport`, `handleUpvoteReport` vazios
- `handleLike` sem efeito
- `civicReports={[]}` hardcoded
- arquivo:
  - `src/modules/community/components/feed/CommunityFeed.tsx:66-88,143`

2. Acoes da pagina em "em desenvolvimento" (sem persistencia real):
- denunciar post, editar post, deletar (apenas toast/confirm local)
- `data: any` em estado modal
- arquivo:
  - `src/modules/community/hooks/page/useComunidadePage.ts:22,86-101`

3. Modais de detalhe/comentario com dados mock/parciais:
- `comments={[]}` e upvote com log apenas
- arquivo:
  - `src/modules/community/components/page/CommunityModals.tsx:77,93,98`

4. Moderacao admin quebrada por contrato inexistente:
- `AdminModeracaoComunidade` chama `ModerationService.moderatePost(...)`
- metodo `moderatePost` nao existe em `ModerationService`
- arquivos:
  - `src/modules/admin/pages/AdminModeracaoComunidade.tsx:136`
  - `src/core/moderation/services/ModerationService.ts` (sem definicao)

5. Moderacao admin acoplada a tabelas de mobilidade, nao ao dominio canonico de posts:
- `AdminCommunityService` delega para `MobilityAdminQueryService`
- consulta `community_ride_posts` e `community_post_flags`
- arquivos:
  - `src/core/admin/services/AdminCommunityService.ts:59,94`
  - `src/modules/mobility/services/MobilityAdminQueryService.ts:73,93`

6. RPC/tabelas esperadas pela moderacao nao aparecem em migracoes ativas:
- nao encontrado em `supabase/migrations`: `get_moderation_stats`, `community_ride_posts`, `community_post_flags`, `post_reports/comment_reports/profile_reports`

7. `AdminCommunityAlertsService` usa `supabase` sem importar `supabase` (risco de runtime error):
- uso em multiplos pontos sem import no topo
- arquivo:
  - `src/core/admin/services/AdminCommunityAlertsService.ts:89,171,288,382...`

8. Drift grave de migracoes: comunidade concentrada em `migrations_old`, nao em `migrations` ativas:
- exemplos ausentes em ativo e presentes em old:
  - `20260405000031_migrate_polls_to_posts.sql`
  - `20260405000033_rename_community_posts_to_community_questions.sql`
  - `20260405000034_create_comment_likes.sql`

9. Testes referenciam migracoes que nao existem no path ativo:
- `tests/sprint-qa-regression.test.ts` le arquivos em `supabase/migrations/...` que hoje estao fora de ativo
- exemplo:
  - `tests/sprint-qa-regression.test.ts:60,164`

10. Contrato de notificacoes inconsistente:
- hook retorna apenas estrutura minima e actions no-op
- dropdown espera `stats`, `isLoading`, `isRefreshing` etc
- arquivos:
  - `src/modules/community/hooks/useNotifications.ts:16-31`
  - `src/modules/community/components/NotificationDropdown.tsx:70-75`

11. Header mobile referencia import inexistente:
- lazy import para `@/components/community/NotificationDropdown` nao existe
- arquivo:
  - `src/modules/community/components/page/MobileHeader.tsx:12`

12. Feed de issues com filtro territorial efetivamente incompleto:
- componente envia `city/neighborhood`
- service declara remocao temporaria desses filtros e filtra na pratica por `location_id` explicito
- arquivos:
  - `src/modules/community-issues/components/IssueFeedSection.tsx:26`
  - `src/modules/community-issues/services/CommunityIssueService.ts:46-50`

13. Rotas legadas de alertas/problemas redirecionam para comunidade principal, paginas dedicadas ficam sem rota ativa:
- redirects:
  - `src/app/routes/AppRoutes.tsx:135-137`
- paginas existem, mas sem uso efetivo por rota:
  - `src/modules/community/pages/AlertasPage.tsx`
  - `src/modules/community-issues/pages/ProblemasPage.tsx`

---

## 4) Achados por area

## A) Feed/Postagens (core da comunidade)

Status: CRITICO

Principais gaps:
1. Acoes de interacao incompletas no feed (like/save/share/report/upvote).
2. Comentarios/detalhes com placeholders e dados vazios em parte dos modais.
3. Stubs de report/edit/delete no hook de pagina.
4. SSOT parcial: existe `PostService`, mas parte da tela ainda nao chama fluxos reais.

Impacto:
- funcionalidade principal da comunidade fica parcialmente inoperante
- experiencia de usuario inconsistente
- risco de "funciona visualmente, nao funciona de verdade"

## B) Alertas e Problemas Urbanos

Status: ALTO

Principais gaps:
1. Alertas tem modulo dedicado, mas feed principal nao exibe `AlertFeedSection`.
2. Problemas sao exibidos no feed, mas com filtragem territorial em transicao e comportamento potencialmente amplo demais.
3. Rotas dedicadas (`AlertasPage`, `ProblemasPage`) estao praticamente desativadas por redirect.

Impacto:
- cobertura funcional fragmentada
- descobribilidade ruim
- risco de conteudo territorial fora de contexto local

## C) Comentarios

Status: ALTO

Principais gaps:
1. Hook legado deprecated ainda em uso:
- `src/modules/community/hooks/useCommentActions.ts:2`
2. `CommentsModal` passa `activeProfile.id` como `userId` para hook que chama `getProfileContext(userId)` (risco semantico)
- `src/modules/community/components/CommentsModal.tsx:39-43`
3. TODO de edicao inline em aberto
- `src/modules/community/components/CommentItem.tsx:112`
4. Query base de comentarios ainda flat (`select *`) sem montagem canonica de arvore no service core.

Impacto:
- risco de bugs de ownership/permissao
- experiencia de comentario incompleta

## D) Moderacao/Admin

Status: CRITICO

Principais gaps:
1. metodo inexistente chamado por pagina (`moderatePost`).
2. admin de moderacao geral devolve dados temporarios (filas vazias, stats zerados hardcoded):
- `usePendingPosts`: retorno vazio temporario
- `usePendingComments`: retorno vazio temporario
- `useModerationStats`: zero hardcoded
- arquivos:
  - `src/core/moderation/hooks/usePendingPosts.ts`
  - `src/core/moderation/hooks/usePendingComments.ts`
  - `src/core/moderation/hooks/useModerationStats.ts`
3. servico de moderacao mistura tabelas antigas/inexistentes (`community_reports`, `community_comments`) e esta em `@ts-nocheck`.
4. `AdminCommunityService` usa query service de mobilidade para moderar comunidade.
5. `AdminCommunityAlertsService` com referencia de `supabase` sem import (erro grave).

Impacto:
- governanca admin incompleta
- risco de erro em runtime
- operacao de moderacao sem confiabilidade

## E) Profile / Workspace

Status: ALTO

Principais gaps:
1. existe query legado em profile stats usando `community_posts`:
- `src/core/profiles/services/profile.queries.ts:312`
2. coexistencia de caminhos de profile stats (um mais novo via `PostService`, outro legado) aumenta risco de numero divergente.
3. integracao de conteudo de comunidade no workspace e majoritariamente por contagem, faltando visao operacional mais rica (historico consolidado de posts/acoes de moderacao no proprio perfil).

Impacto:
- dados de perfil possivelmente divergentes
- UX de confianca reduzida

## F) SSOT e consistencia tecnica

Status: CRITICO

Principais gaps:
1. duplicidade de fontes e contratos quebrados (feed/actions/notificacoes/moderacao).
2. mismatch de contratos entre hooks e UIs.
3. alto volume de `@ts-nocheck` em cadeia critica de comunidade/posts/comentarios/moderacao.
4. migracoes ativas nao refletem integralmente o dominio em uso no frontend.

Impacto:
- regressao facil
- baixa previsibilidade em ambiente novo
- manutencao cara

## G) Qualidade e Testes

Status: ALTO

Principais gaps:
1. testes de comunidade insuficientes para fluxo ponta-a-ponta.
2. ausencia de testes em `community-alerts` e `community-issues`.
3. teste de regressao referencia migracoes fora da pasta ativa.

Impacto:
- risco alto de quebrar em release
- pouca confianca para deploy

---

## 5) Matriz minima de permissoes (alvo)

## 5.1 Postagens/comentarios

1. Criar post:
- usuario autenticado
- perfil ativo
- `location_id` valido/ativo
- limite/rate limit por perfil

2. Editar/deletar post:
- autor do post
- ou admin/moderador com trilha de auditoria

3. Comentar:
- usuario autenticado + perfil ativo
- regras anti-spam

4. Denunciar:
- usuario autenticado
- deduplicacao por alvo+perfil

## 5.2 Moderacao admin

1. Acoes permitidas:
- aprovar/rejeitar/remover/ocultar/alertar/suspender
2. Tudo com:
- policy backend + log/auditoria + motivo obrigatorio

## 5.3 Alertas/issues

1. Criacao via RPC (ja direcao correta)
2. update/remocao com policy e ownership claros
3. filtros territoriais obrigatorios por `location_id` canonico

---

## 6) Backlog de implementacao por fases

## FASE 0 - Saneamento de base (obrigatorio antes de features)

T0.1 Consolidar migracoes de comunidade de `migrations_old` para `supabase/migrations` ativa (com ordem canonica).
T0.2 Garantir existencia de tabelas/RPC esperadas pelo codigo atual ou refatorar codigo para tabelas reais.
T0.3 Corrigir `AdminCommunityAlertsService` (import `supabase` + smoke check de metodos).
T0.4 Corrigir contrato de moderacao (`moderatePost`) com um unico service oficial.
T0.5 Remover referencias a tabelas legadas/inexistentes no core de moderacao.

DoD Fase 0:
- schema alinhado com codigo
- sem chamadas para objetos inexistentes
- admin de comunidade sem erro de runtime imediato

## FASE 1 - Feed Comunidade funcional (core)

T1.1 Implementar handlers reais em `CommunityFeed` (like/save/share/report/upvote).
T1.2 Substituir stubs de `useComunidadePage` por chamadas de service reais.
T1.3 Integrar `useCivicReports` no feed (sem `civicReports={[]}`).
T1.4 Fechar fluxo de detalhe/comentarios em `CommunityModals` sem arrays hardcoded.
T1.5 Padronizar contratos de interacao de post e invalidacoes de cache.

DoD Fase 1:
- interacoes do feed persistem no banco
- nao ha no-op em acoes principais
- feed nao depende de mock para operacao principal

## FASE 2 - Comentarios e notificacoes

T2.1 Remover uso de hook deprecated (`useCommentActions`) e migrar para hooks canonicos.
T2.2 Corrigir semantica `userId/profileId` no pipeline de comentario.
T2.3 Implementar edicao inline de comentario (TODO aberto).
T2.4 Unificar contrato `useNotifications` x `NotificationDropdown`.
T2.5 Corrigir import invalido de `MobileHeader` e remover codigo morto.

DoD Fase 2:
- comentarios completos (criar/editar/excluir/reply)
- notificacoes com contrato coerente e sem no-op

## FASE 3 - Alertas e Issues no produto (nao so no modulo)

T3.1 Decidir UX oficial: feed integrado unico vs paginas dedicadas.
T3.2 Se manter paginas dedicadas, reativar rotas canonicas sem redirect cego.
T3.3 Integrar `AlertFeedSection` na experiencia principal (se objetivo for feed unificado).
T3.4 Corrigir filtro territorial de issues para usar `location_id` resolvido de forma canonica.
T3.5 Remover codigo morto de paginas sem rota (ou reintroduzir com contrato claro).

DoD Fase 3:
- alertas/issues acessiveis por rota oficial
- filtro territorial correto e verificavel

## FASE 4 - Moderacao/Admin completa

T4.1 Unificar admin de moderacao em um unico dominio (sem dependencia de tabelas de mobilidade para comunidade).
T4.2 Implementar filas pendentes reais (posts/comments/reports).
T4.3 Implementar dashboard de stats reais (sem zeros fixos).
T4.4 Implementar trilha de auditoria e historico operacional.
T4.5 Garantir guard de permissao em nivel de rota + service + RLS.

DoD Fase 4:
- admin consegue moderar ponta-a-ponta com dados reais
- sem placeholders de "em desenvolvimento" nas telas criticas

## FASE 5 - Profile e consistencia SSOT

T5.1 Eliminar query legado de `community_posts` em profile stats.
T5.2 Consolidar uma unica fonte para metricas de comunidade no perfil.
T5.3 Expor historico comunitario no workspace do perfil (posts, alertas, issues, moderacoes do proprio usuario).
T5.4 Revisar permissoes `canPost` e limites anti-abuso por perfil.

DoD Fase 5:
- numeros de perfil consistentes em todas as telas
- sem duplicidade de fonte para estatisticas comunitarias

## FASE 6 - Hardening tecnico (antes de teste final)

T6.1 Reduzir `@ts-nocheck` no caminho critico: posts, comments, moderation, community services.
T6.2 Criar contrato tipado de API interna (service inputs/outputs) com testes de contrato.
T6.3 Revisar logs de console para remover warnings evitaveis e reduzir ruido.
T6.4 Revisar Web Vitals da comunidade (LCP/FCP/TTFB) e reduzir blocos de carga.

DoD Fase 6:
- caminho critico sem `@ts-nocheck`
- erros de contrato capturados em build/test

## FASE 7 - Testes (por ultimo, conforme solicitado)

T7.1 Unit/integration:
- feed actions
- comentarios
- notificacoes
- services de alertas/issues/moderacao

T7.2 E2E (web + app):
- criar post/comentar/editar/deletar
- denunciar e moderar no admin
- criar alerta/issue e visualizar no contexto territorial
- fluxo de perfil (historico e contagens)

T7.3 Testes de migracao:
- validar que migrations ativas contem schema esperado
- remover dependencia de caminho `migrations_old` nos testes principais

Gate final:
- sem erro 500
- sem fallback falso-positivo
- sem tela vazia nos fluxos principais

---

## 7) O que falta no projeto para ficar completo (alem da comunidade)

## 7.1 Engenharia e processo

1. Pipeline CI obrigatorio com gates:
- typecheck, lint, unit, integration, e2e smoke
2. Gate de migracao:
- validar schema esperado vs codigo antes de deploy
3. Politica de deprecacao:
- bloquear merge com uso de tabelas/servicos legados sem ADR
4. Catalogo de contratos:
- documentar contracts de services criticos (posts/moderation/location/profile)

## 7.2 Observabilidade e operacao

1. Sentry/erro em producao com DSN ativo e ambiente separado.
2. Dashboard de saude por modulo (community, vagas, mobilidade).
3. Alertas operacionais para erro de RPC/tabela ausente.
4. Tracing basico de latencia para rotas criticas.

## 7.3 Seguranca e governanca

1. Revisao completa de RLS para posts/comments/alerts/issues/moderation.
2. Trilhas de auditoria para acoes admin sensiveis.
3. Rate-limit e anti-abuso em criacao/denuncia/comentario.
4. Matriz de papeis formal (admin/moderador/usuario/empresa).

## 7.4 Produto e operacao de comunidade

1. Politica de moderacao oficial (SOP) com SLA de resposta.
2. Tabela de motivos de moderacao padronizada.
3. Fluxo de apelacao/contestacao para conteudo removido.
4. Guia publico de regras da comunidade e penalidades.

## 7.5 Qualidade de frontend

1. Limpeza de codigo morto (paginas sem rota, imports quebrados).
2. Padronizacao de estados vazios/erro/loading por modulo.
3. Performance budget por pagina (LCP/FCP alvo por rota).
4. Regressao visual para mobile (especialmente comunidade e admin mobile).

---

## 8) Riscos de lancamento (nao lancar se)

Nao lancar se qualquer item abaixo permanecer:
1. acoes principais do feed em stub/no-op
2. moderacao admin sem fluxo real de aprovar/rejeitar/remover
3. schema ativo divergente do codigo (migrations quebradas/ausentes)
4. filtros territoriais de alertas/issues sem comportamento canonico
5. perfil com metricas divergentes entre telas
6. erros de runtime no admin de comunidade (ex.: `supabase` indefinido)

---

## 9) Ordem recomendada de execucao

1. Fase 0 (base/migracoes/contratos)
2. Fase 1 (feed core)
3. Fase 2 (comentarios/notificacoes)
4. Fase 3 (alertas/issues + rotas)
5. Fase 4 (admin moderacao)
6. Fase 5 (profile/SSOT)
7. Fase 6 (hardening tecnico)
8. Fase 7 (testes finais)

Sem essa ordem, ha alto risco de retrabalho e regressao.

---

## 10) Resposta objetiva sobre cobertura deste pente fino

Sim. Esta analise cobriu:
- frontend da comunidade (feed, modais, comentarios, alertas/issues, rotas relacionadas)
- admin relacionado (moderacao geral + community alerts/issues)
- integracao com profile
- migracoes/supabase
- lacunas de projeto para fechamento (ferramentas, recursos, operacao, seguranca e qualidade)

Pendencia proposital:
- implementacao ficou para a etapa seguinte, conforme solicitado.
