# FEED.FREEZE.AUDIT.2

Data: 2026-07-28

Status: Freeze Candidate aprovado.

## 1. Escopo

Esta auditoria reavaliou o dominio Feed apos as sprints:

- P1.A: update, delete, poll vote e enriquecimento de detalhe.
- P1.B: URL canonica territorial, deep links territoriais e Search.
- P1.C: denuncias e integracao com Moderation.

O objetivo foi verificar se os bloqueadores FRZ-B1 ate FRZ-B5 do `FEED-FREEZE-AUDIT.md` foram eliminados e se o dominio Feed pode entrar em Freeze.

Nao foram realizadas alteracoes de codigo, runtime, arquitetura, GOVERNANCE ou ROADMAP.

## 2. Base documental

- `docs/feed/FEED-GOVERNANCE.md`
- `docs/feed/FEED-GOVERNANCE-CHANGELOG.md`
- `docs/feed/FEED-ROADMAP.md`
- `docs/feed/FEED-EXECUTION-PLAN.md`
- `docs/feed/FEED-MILESTONE-1.md`
- `docs/architecture/PROJECT-MILESTONE-1.md`
- `docs/feed/FEED-FREEZE-AUDIT.md`
- `docs/feed/FEED-P1.A-REPORT.md`
- `docs/feed/FEED-P1.A-REVIEW.md`
- `docs/feed/FEED-P1.A-HARDENING-REPORT.md`
- `docs/feed/FEED-P1.B-REPORT.md`
- `docs/feed/FEED-P1.B-REVIEW.md`
- `docs/feed/FEED-P1.B-HARDENING-REPORT.md`
- `docs/feed/FEED-P1.C-REPORT.md`
- `docs/feed/FEED-P1.C-REVIEW.md`

## 3. Resultado executivo

Todos os bloqueadores originais FRZ-B1 ate FRZ-B5 foram eliminados nos fluxos publicos do Feed.

O dominio Feed agora concentra as operacoes publicas de:

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
- leitura publica de `ride_share`.

As chamadas a servicos internos ainda existentes aparecem como colaboradores internos do `FeedRepository` ou como excecoes documentadas fora da superficie publica do Feed. Nao foi identificado bypass ativo que permita operar post, comentario, engagement, share, report, Search ou poll vote sem `FeedContext`, `FeedTarget`, `ResolvedTerritory`, `TerritoryFilter`, Rollout e CommunityAccessPolicy quando aplicavel.

## 4. Matriz dos bloqueadores originais

| Bloqueador | Estado | Conclusao |
| --- | --- | --- |
| FRZ-B1 - Update/delete fora do Feed | Eliminado | `postService.updatePost()`, `postService.deletePost()` e `postService.deletePostByAuthor()` aparecem apenas dentro de `FeedRepository`, apos validacao por `FeedService.updateItem()` e `FeedService.deleteItem()`. |
| FRZ-B2 - Reports/moderation fora do Feed | Eliminado para alvos Feed | Denuncias publicas de post/comentario passam por `FeedService.reportTarget()` e `FeedRepository.reportTarget()`. O dialog generico de Community permanece para alvos nao-Feed e esta registrado como recomendacao preventiva. |
| FRZ-B3 - Voto em enquete fora do Feed | Eliminado | Voto publico passa por `FeedService.votePoll()`; chamadas a `postService.getPollByPostId()` e `postService.votePoll()` ficaram internas ao `FeedRepository`. |
| FRZ-B4 - Search/URL canonica fora do Feed | Eliminado | Search de posts exige `FeedContext` e chama `FeedService.searchItems()`. URL canonica territorial passa por `FeedService.resolveCanonicalUrl()` e rejeita bases globais/nominais invalidas. |
| FRZ-B5 - Enriquecimento de detalhe fora do Feed | Eliminado | Detalhe publico utiliza `useFeedItemDetail()` e `FeedService.getDetail()`. Enriquecimento de autor, interacoes e enquete ficou concentrado no `FeedRepository`. |

## 5. Auditoria por area obrigatoria

| Area | Estado | Evidencia |
| --- | --- | --- |
| FeedService | Pronto | Centraliza validacoes e operacoes publicas: timeline, detail, create, update, delete, comments, reactions, saves, share, reports, poll vote, canonical URL e search. |
| FeedRepository | Pronto | E o unico ponto onde colaboradores internos como `postService`, `CommentService`, `PostEngagementService`, `searchPublicPosts` e `communityReportService` sao chamados para operacoes do Feed. |
| FeedContext | Pronto | `validateFeedContext()` exige territorio resolvido, filtro territorial, rollout ativo e AccessPolicy pronta. Estados ausentes/pendentes falham fechado. |
| FeedTarget | Pronto | `isFeedTargetReady()` e validadores especificos bloqueiam alvo vazio, tipo invalido, item indisponivel, item oculto/removido e mismatch territorial. |
| Timeline | Pronto | `useFeedTimeline()` retorna `posts = []` e `total = 0` quando o contexto deixa de ser valido, ignorando cache antigo. |
| Detail | Pronto | `useFeedItemDetail()` retorna `unavailableDetail` quando `FeedContext` ou `FeedTarget` nao estao prontos. |
| Create | Pronto | Criacao publica passa por `FeedService.createItem()` e valida `canCreateItem`, territorio, rollout e AccessPolicy. |
| Update | Pronto | Edicao publica passa por `FeedService.updateItem()` e valida alvo, territorio, visibilidade, actor policy, rollout e AccessPolicy. |
| Delete | Pronto | Exclusao publica passa por `FeedService.deleteItem()` e valida autor/moderacao/admin antes do `FeedRepository`. |
| Poll Vote | Pronto | Voto passa por `FeedService.votePoll()` e valida contexto, alvo, usuario, pollId e pertencimento da enquete ao item. |
| Comments | Pronto | Leitura e criacao passam por `FeedService.listComments()` e `FeedService.createComment()`, com target do item pai validado. |
| Reactions | Pronto | Reacoes passam por `FeedService.listReactions()` e `FeedService.react()`, com falha fechada antes do repository. |
| Saves | Pronto | Saves passam por `FeedService.saveItem()`, com validacao de target e AccessPolicy. |
| Share | Pronto | `useShareFeedItem()` e `FeedService.shareItem()` rejeitam base territorial invalida e nao geram URL global. |
| Reports | Pronto | Report de post/comentario passa por `FeedService.reportTarget()` e valida item pai, comentario na arvore, reporter e `canReport`. |
| Canonical URL | Pronto | `normalizeCanonicalFeedBasePath()` exige rota `comunidade` com pelo menos UF e cidade, impedindo `/comunidade` e `/comunidade/ba`. |
| Search | Pronto | Provider de posts retorna vazio sem `filters.feedContext` e usa `FeedService.searchItems()` com URL canonica territorial. |
| Cache | Pronto | Hooks publicos do Feed retornam estados vazios/unavailable quando contexto ou target deixam de ser validos. Query keys incluem filtro territorial. |
| Deep Links | Pronto | Deep link publico de post e resolvido pelo contexto territorial da rota e validado pelo Feed antes de abrir detalhe. |
| Query Keys | Pronto | Chaves de timeline, ride share, detail, comments, reactions, share, canonical URL, search e report carregam escopo territorial/target quando aplicavel. |
| Rollout | Pronto | Operacoes publicas dependem de rollout pronto/ativo; estados ausentes ou bloqueados falham fechado. |
| CommunityAccessPolicy | Pronto | AccessPolicy continua canonicamente derivada de Community e consumida pelo Feed. Callers nao-React usam adaptador operacional, sem `canCreateItem: true` fabricado. |
| Territory Integration | Pronto | `ResolvedTerritory` e `TerritoryFilter` sao obrigatorios e mismatch territorial bloqueia leitura/escrita. |

## 6. Respostas obrigatorias

### 6.1 Todos os bloqueadores FRZ-B1 ate FRZ-B5 foram eliminados?

Sim.

FRZ-B1, FRZ-B3 e FRZ-B5 foram eliminados pela P1.A e completados pela hardening de cobertura. FRZ-B4 foi eliminado pela P1.B e sua hardening. FRZ-B2 foi eliminado pela P1.C para alvos publicos do Feed.

### 6.2 Existe algum bypass restante ao Feed?

Nao foi identificado bypass ativo nos fluxos publicos do Feed.

As chamadas remanescentes a servicos internos aparecem em tres categorias:

- colaboradores internos do `FeedRepository`;
- read models privados do dominio Profile, cobertos pela `Profile Activity Exception`;
- componentes/hooks legados ou nao utilizados no caminho publico principal, registrados como recomendacao.

### 6.3 Existe algum acesso direto a servicos internos?

Sim, mas nao como bypass publico do Feed.

O acesso direto a `postService`, `CommentService`, `PostEngagementService`, `searchPublicPosts` e `communityReportService` dentro de `FeedRepository` e esperado pela arquitetura oficial.

Fora do `FeedRepository`, existem acessos diretos em dominios nao-Feed ou excecoes documentadas:

- Profile usa read models atomicos para historico pessoal;
- Admin/Metrics/Landing usam agregacoes ou superficies proprias;
- Classifieds/Lost Found possuem dominios proprios;
- Tourist Points usa posts com imagem como fonte auxiliar do guia;
- Community possui widgets antigos de tags/top posts e um dialog generico de report, sem evidenciar bypass ativo de post/comentario publico do Feed.

### 6.4 Existe algum fallback territorial ou global?

Nao foi identificado fallback global ativo para URL canonica, Search, Share ou abertura publica de post.

`LAUNCH_URLS.community` ainda aparece em navegacao geral, landing e fallbacks de modulo, mas nao como URL canonica de post nem como fallback para Search/Share do Feed. Bases invalidas como `/comunidade` e `/comunidade/ba` sao rejeitadas pelo normalizador canonico.

### 6.5 Existe alguma violacao da GOVERNANCE?

Nao foi identificada violacao bloqueadora nos fluxos publicos do Feed.

Os residuos encontrados devem ser tratados como hardening preventivo antes de auditorias automaticas mais estritas, mas nao reabrem os bloqueadores FRZ-B1 ate FRZ-B5.

### 6.6 Existe alguma violacao da arquitetura?

Nao foi identificada violacao arquitetural ativa no boundary publico do Feed.

O fluxo oficial `Pages -> Hooks -> FeedService -> FeedRepository -> Supabase/servicos internos` esta preservado para as operacoes do Feed auditadas.

### 6.7 Existe duplicacao relevante?

Nao existe duplicacao relevante que bloqueie o Freeze.

Persistem residuos de read models e widgets antigos que duplicam leitura estatistica ou composicao de cards, mas eles nao substituem a timeline, detalhe, mutations, Search, reports ou Share do Feed.

### 6.8 O dominio Feed pode ser considerado Freeze Candidate?

Sim.

O dominio Feed pode ser considerado Freeze Candidate porque os bloqueadores originais foram eliminados e nao ha bypass publico ativo que permita operar o Feed sem contexto territorial, rollout e AccessPolicy.

## 7. Findings

### Bloqueadores

Nenhum.

### Recomendacoes

| ID | Descricao | Impacto | Risco | Dependencia |
| --- | --- | --- | --- | --- |
| FRZ2-R1 | Restringir `CommunityReportContentDialog` para impedir uso futuro com `post` ou `comment` sem `FeedService.reportTarget()`. Hoje os callers ativos sao alvos nao-Feed, mas o componente ainda e generico. | Medio | Medio | P1.C / Moderation |
| FRZ2-R2 | Alinhar a experiencia de Profile para que aberturas de post salvo/historico usem URL canonica auditavel quando houver territorio do item, evitando depender da rota ativa do usuario. | Medio | Baixo | Profile / Feed canonical URL |
| FRZ2-R3 | Deprecar ou migrar widgets/hooks antigos de Community que leem `postService.getTopPosts()` e `postService.getPopularTags()` diretamente, especialmente antes de reativar sidebars legadas. | Baixo | Medio | Community |

### Melhorias futuras

| ID | Descricao | Impacto | Risco | Dependencia |
| --- | --- | --- | --- | --- |
| FRZ2-F1 | Atualizar comentarios internos obsoletos que ainda citam migracoes antigas para PostService em hooks que ja usam Feed. | Baixo | Baixo | Documentacao tecnica interna |
| FRZ2-F2 | Auditar Realtime e Notifications quando suas sprints entrarem no escopo de Freeze, garantindo links territoriais e invalidacao por `FeedQueryKeys`. | Medio | Medio | Sprints futuras |
| FRZ2-F3 | Criar regra estatica futura para impedir novos imports publicos de `postService`, `CommentService`, `PostEngagementService` e `communityReportService` fora das excecoes aprovadas. | Medio | Baixo | Tooling / lint customizado |

## 8. Decisao

O dominio Feed esta pronto para Freeze.
