# FEED.P0.D.1 Review

Data: 2026-07-26

Status da review: a sprint ainda nao atende integralmente aos criterios da governanca.

## Base comparada

- `docs/feed/FEED-GOVERNANCE.md`
- `docs/feed/FEED-ROADMAP.md`
- `docs/feed/FEED-EXECUTION-PLAN.md`
- `docs/feed/FEED-MILESTONE-1.md`
- `docs/feed/FEED-P0.D.1-REPORT.md`

## Resultado executivo

A implementacao criou corretamente o boundary principal de comentarios do Feed para leitura e criacao em item de Feed:

- `FeedService.listComments()`;
- `FeedService.createComment()`;
- metodos correspondentes em `FeedRepository`;
- hooks `useFeedComments()` e `useCreateFeedComment()`;
- query key territorial de comentarios;
- validacao de parent item via `FeedService.getDetail()`;
- falha fechada no hook quando `FeedContext` ou `FeedTarget` deixam de estar prontos.

Porem a auditoria encontrou leitura direta de comentarios em UI de Perfil, fora do Feed e sem `FeedContext`. Pela regra ampla da sprint e da `FEED-GOVERNANCE.md`, isso impede o encerramento oficial da P0.D.1.

## Findings

### Bloqueador - D1-R1 - Perfil ainda le comentarios diretamente via CommentService

Evidencias:

- `src/modules/profile/hooks/useUserActivity.ts:2` importa `CommentService`;
- `src/modules/profile/hooks/useUserActivity.ts:155` chama `CommentService.getCommentsByAuthor(profileId, ...)`;
- `src/modules/profile/hooks/useActivityStats.ts:2` importa `CommentService`;
- `src/modules/profile/hooks/useActivityStats.ts:24` chama `CommentService.getCommentCountByAuthor(profileId)`;
- `src/modules/profile/components/ActivityTimeline.tsx:194` usa `useUserActivity(...)`;
- `src/modules/profile/components/ActivityTimeline.tsx:196` usa `useActivityStats(...)`;
- `src/modules/profile/sections/DadosPessoaisSection.tsx:210` renderiza `ActivityTimeline`.

Impacto:

- existe leitura de comentario em hook de UI sem `FeedContext`;
- nao ha validacao de `ResolvedTerritory`;
- nao ha `TerritoryFilter`;
- nao ha Rollout;
- nao ha AccessPolicy de Feed;
- nao ha `FeedTarget`;
- a query key de perfil nao e territorial;
- o conteudo de comentarios por autor pode ser exibido fora da validacao territorial do item pai.

Regra violada:

- `FEED-GOVERNANCE.md` define que Comments e o dominio atomico, mas Feed e a unica porta publica para comentario em item territorial;
- `FEED-GOVERNANCE.md` proibe hooks publicos de executarem operacoes de comentarios por ID ou sem contexto validado;
- a missao da sprint diz que toda leitura e criacao de comentarios deve passar pelo Feed.

Classificacao: Bloqueador.

Motivo: mesmo que o painel principal de comentarios esteja correto, ainda existe leitura direta de comentarios em superficie de UI. A sprint nao consegue provar "Toda leitura de comentarios passa pelo Feed".

### Recomendacao - D1-R2 - Denuncia de comentario continua fora do Feed

Evidencias:

- `src/core/community/components/comments/PostCommentsPanel.tsx:4` importa `useModeration`;
- `src/core/community/components/comments/PostCommentsPanel.tsx:119` obtem `reportCommentAsync`;
- `src/core/community/components/comments/PostCommentsPanel.tsx:163` chama `reportCommentAsync(...)`;
- `src/core/community/components/comments/PostCommentsPanel.tsx:186` passa `onReport={setReportCommentId}`;
- `src/core/community/hooks/useModeration.ts:44` define `reportCommentMutation`;
- `src/core/community/hooks/useModeration.ts:52` chama `communityReportService.report(...)`;
- `src/core/community/hooks/useModeration.ts:53` envia `targetType: "comment"`;
- `src/core/community/hooks/useModeration.ts:54` envia `targetId: commentId`.

Impacto:

- denuncia de comentario ainda opera por `commentId`;
- nao ha `FeedService.reportTarget()`;
- nao ha target territorial validado pelo Feed;
- a invalidacao usa chave legada de comentarios, nao query key territorial de Feed.

Classificacao: Recomendacao.

Motivo: moderacao e denuncia foram explicitamente proibidas nesta sprint e pertencem a P1.C. A implementacao nao deveria antecipar isso. Ainda assim, a acao permanece visivel no painel migrado e deve ser tratada antes do Feed Freeze ou na sprint de moderacao territorial.

### Recomendacao - D1-R3 - Roadmap ainda usa a palavra "respostas"

Evidencias:

- `FEED-ROADMAP.md` descreve P0.D.1 como "Comentarios e respostas territorializados";
- a instrucao executiva da sprint proibiu `replies`;
- o report declara corretamente que replies nao foram implementados.

Impacto:

- existe diferenca documental entre o roadmap historico e a instrucao executiva da sprint;
- a implementacao nao criou replies, o que esta correto pelo comando desta sprint;
- antes do Freeze, o roadmap deve deixar claro se replies pertencem a P0.D.1, P1 ou outra sprint.

Classificacao: Recomendacao.

Motivo: nao e bug de runtime, mas pode gerar review contraditoria nas proximas sprints.

## Respostas obrigatorias

### 1. Todo o escopo da P0.D.1 foi implementado?

Parcialmente.

O boundary principal de comentarios do Feed foi implementado para leitura e criacao em `PostCommentsPanel`, modal de detalhe, modal de comentarios e Mobility.

Porem o criterio amplo "toda leitura de comentarios passa pelo Feed" nao foi atendido, porque Perfil ainda consulta comentarios diretamente por autor usando `CommentService`.

### 2. Existe algo implementado que pertence a P0.D.2 ou superior?

Nao foi implementada funcionalidade nova de P0.D.2.

Likes, reactions, saves, contadores e share nao foram migrados como novas funcionalidades. `CommentItem` ainda renderiza contadores retornados pelo dado existente, mas nao implementa nova acao de reaction pelo Feed.

Existe uma acao residual de denuncia de comentario, que pertence a P1.C. Ela nao foi criada nesta sprint, mas continua ativa no painel migrado.

### 3. Existe alguma violacao da GOVERNANCE?

Sim.

Violacao bloqueadora:

- hooks de Perfil leem comentarios diretamente via `CommentService` sem `FeedContext`, `ResolvedTerritory`, `TerritoryFilter`, Rollout, AccessPolicy ou `FeedTarget`.

Violacao residual nao bloqueadora desta sprint, mas obrigatoria antes do Freeze/P1.C:

- denuncia de comentario continua operando por `commentId` via `useModeration`, sem target territorial validado pelo Feed.

### 4. Ainda existe algum caminho publico acessando CommentService diretamente?

Sim.

Foram encontrados acessos diretos em Perfil:

- `useUserActivity()` -> `CommentService.getCommentsByAuthor(...)`;
- `useActivityStats()` -> `CommentService.getCommentCountByAuthor(...)`.

Nos caminhos de Feed/Community/Mobility migrados nesta sprint, `CommentService` ficou restrito ao `FeedRepository` e aos testes do repository.

### 5. Existe algum bypass ao FeedService para leitura ou criacao de comentarios?

Sim para leitura agregada/de atividade em Perfil.

Nao foi encontrado bypass para:

- leitura do painel/modal de comentarios;
- criacao no painel/modal de comentarios;
- criacao de comentario em Mobility.

### 6. FeedContext, Territory, Rollout, AccessPolicy e FeedTarget sao sempre validados antes da operacao?

Dentro do boundary novo de `FeedService.listComments()` e `FeedService.createComment()`, sim.

Evidencias:

- `src/core/feed/services/FeedService.ts:166` inicia `listComments(...)`;
- `src/core/feed/services/FeedService.ts:167` chama `validateCommentTarget(...)`;
- `src/core/feed/services/FeedService.ts:191` inicia `createComment(...)`;
- `src/core/feed/services/FeedService.ts:194` chama `validateCommentTarget(...)`;
- `src/core/feed/services/FeedService.ts:204` valida `canCreateComment`;
- `src/core/feed/services/FeedService.ts:253` valida `FeedContext`;
- `src/core/feed/services/FeedService.ts:263` valida `FeedTarget`;
- `src/core/feed/services/FeedService.ts:272` valida o item pai via `getDetail(...)`.

Fora desse boundary, nao. Perfil ainda le comentarios sem essas validacoes.

### 7. Existe algum cenario onde comentarios antigos possam reaparecer por cache?

No hook novo de Feed, nao foi encontrado cenario de reapresentacao de cache antigo quando o contexto fica invalido.

Evidencias:

- `useFeedComments()` desabilita a query quando o contexto ou target nao estao prontos;
- `useFeedComments()` retorna `comments = []` e `total = 0` quando `contextValidation.isReady` e falso;
- os testes cobrem cache pre-existente com contexto ausente, target invalido, rollout perdido, AccessPolicy perdida e mismatch territorial.

Risco residual:

- as queries de Perfil nao usam cache territorial de Feed e continuam fora do boundary. Esse e o mesmo bloqueador D1-R1.

### 8. Os testes realmente cobrem os cenarios criticos?

Para o boundary novo do Feed, sim.

Cobertura encontrada:

- `FeedContext` invalido: `FeedService.spec.ts:653`, `useFeedComments.spec.tsx:137`;
- Territory invalido/mismatch: `FeedService.spec.ts:733`, `useFeedComments.spec.tsx:227`;
- Rollout bloqueado: `FeedService.spec.ts:674`, `useFeedComments.spec.tsx:174`;
- AccessPolicy bloqueada: `FeedService.spec.ts:698`, `FeedService.spec.ts:783`, `useFeedComments.spec.tsx:199`;
- FeedTarget invalido: `FeedService.spec.ts:719`, `useFeedComments.spec.tsx:153`;
- cache antigo: `useFeedComments.spec.tsx:137`, `useFeedComments.spec.tsx:153`, `useFeedComments.spec.tsx:174`, `useFeedComments.spec.tsx:199`, `useFeedComments.spec.tsx:227`;
- post pai indisponivel/nao visivel: `FeedService.spec.ts:818`;
- mismatch territorial do item pai: `FeedService.spec.ts:733`.

Lacuna:

- os testes nao cobrem a existencia dos caminhos de Perfil que ainda bypassam o Feed.

### 9. Existe algum risco de compatibilidade com P0.A, P0.B, P0.C ou P0.E?

Risco baixo nos fluxos migrados:

- P0.A: query keys de Feed foram estendidas sem alterar timeline;
- P0.B: comentarios validam o post pai via `FeedService.getDetail()`;
- P0.C: criacao de post nao foi reaberta;
- P0.E: Mobility comenta via `FeedService.createComment()` quando possui `FeedContext`.

Risco residual:

- ActivityTimeline de Perfil pode mostrar conteudo de comentario sem passar pelo detalhe territorial de P0.B;
- denuncia de comentario ainda bypassa o futuro boundary de moderacao territorial.

### 10. Existe algum motivo tecnico para impedir o encerramento oficial da Sprint P0.D.1?

Sim.

O motivo tecnico e a existencia de leitura direta de comentarios por UI de Perfil usando `CommentService`, sem o boundary do Feed e sem validacao territorial. Enquanto esse caminho existir, a sprint nao consegue satisfazer a regra "Toda leitura de comentarios deve obrigatoriamente passar pelo Feed".

## Decisao da review

A Sprint FEED.P0.D.1 ainda nao pode ser considerada oficialmente concluida.

Para encerrar a sprint, e necessario resolver o bloqueador D1-R1 por uma destas alternativas:

1. Migrar a leitura de comentarios de Perfil para um caminho governado pelo Feed, com contexto territorial e target validado.
2. Formalizar uma excecao explicita de governanca dizendo que atividade privada de Perfil nao pertence ao boundary publico de comentarios do Feed, com limites e riscos auditaveis.

Enquanto nenhuma dessas alternativas existir, a governanca nao esta totalmente atendida.
