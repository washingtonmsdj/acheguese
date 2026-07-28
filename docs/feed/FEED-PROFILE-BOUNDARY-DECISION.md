# FEED.PROFILE.BOUNDARY Decision

Data: 2026-07-26

Status: decisao arquitetural sem implementacao

## Escopo

Esta sprint avaliou se a `ActivityTimeline` do Perfil pertence ao dominio Feed ou ao dominio Profile.

Regra aplicada:

- nao implementar codigo;
- nao alterar arquitetura;
- nao alterar `FEED-GOVERNANCE.md`;
- nao alterar `FEED-ROADMAP.md`;
- validar criticamente a conclusao da review `FEED-P0.D.1-REVIEW.md`.

## Base obrigatoria

- `docs/feed/FEED-GOVERNANCE.md`
- `docs/feed/FEED-P0.D.1-REVIEW.md`
- `docs/architecture/PROJECT-MILESTONE-1.md`

## Arquivos auditados

Profile:

- `src/modules/profile/pages/ContaHubPage.tsx`
- `src/modules/profile/pages/ContaHubLayout.tsx`
- `src/modules/profile/sections/DadosPessoaisSection.tsx`
- `src/modules/profile/components/ActivityTimeline.tsx`
- `src/modules/profile/hooks/useUserActivity.ts`
- `src/modules/profile/hooks/useActivityStats.ts`
- `src/core/profiles/pages/ProfilePublicPage.tsx`
- `src/core/profiles/hooks/useProfileHub.ts`

Feed:

- `src/core/feed/types.ts`
- `src/core/feed/services/FeedService.ts`
- `src/core/feed/repositories/FeedRepository.ts`
- `src/core/feed/hooks/useFeedComments.ts`
- `src/core/feed/hooks/useCreateFeedComment.ts`
- `src/core/feed/queryKeys.ts`

Community:

- `src/core/community/pages/ComunidadePage.tsx`
- `src/core/community/components/CommentsModal.tsx`
- `src/core/community/components/modals/PostDetailModal.tsx`
- `src/core/community/components/comments/PostCommentsPanel.tsx`
- `src/core/community/hooks/useModeration.ts`

Comments:

- `src/core/comments/services/CommentService.ts`
- `src/core/comments/services/comments.queries.ts`
- `src/core/comments/services/comments.mutations.ts`

## Evidencias principais

### Activity Timeline esta dentro da area privada de conta

Evidencias:

- `src/app/routes/sections/AppLayoutRoutes.tsx:519` monta `/conta`;
- `src/modules/profile/pages/ContaHubPage.tsx` redireciona para login quando nao ha `data.user`;
- `src/modules/profile/pages/ContaHubLayout.tsx` define a pagina como "Minha conta" e "area privada da conta";
- `src/modules/profile/sections/DadosPessoaisSection.tsx:210` renderiza `ActivityTimeline`;
- `src/modules/profile/components/ActivityTimeline.tsx:50` define props `userId` e `profileId`;
- `src/modules/profile/components/ActivityTimeline.tsx:194` chama `useUserActivity({ userId, profileId, filters })`;
- `src/modules/profile/components/ActivityTimeline.tsx:196` chama `useActivityStats({ userId, profileId })`.

Interpretacao:

`ActivityTimeline` e uma timeline pessoal de atividades do usuario/perfil ativo. Ela nao e uma timeline territorial publica, nao e descoberta social, nao e feed comunitario e nao nasce de uma rota territorial.

### Activity Timeline nao tem contexto territorial natural

Evidencias:

- `ActivityTimeline` nao recebe `ResolvedTerritory`;
- `ActivityTimeline` nao recebe `TerritoryFilter`;
- `ActivityTimeline` nao recebe Rollout;
- `ActivityTimeline` nao recebe `CommunityAccessPolicy`;
- `ActivityTimeline` nao recebe `FeedTarget`;
- `useUserActivity` usa query key `["user-activity", userId, profileId, filters, pageSize]`;
- `useActivityStats` usa query key `["activity-stats", userId, profileId]`.

Interpretacao:

Forcar `FeedContext` nessa tela criaria um acoplamento artificial: o historico pessoal pode conter atividades de varios territorios e nao deve depender do Territory ativo no momento.

### Comentarios no Perfil sao registros de atividade pessoal

Evidencias:

- `src/modules/profile/hooks/useUserActivity.ts:155` le `CommentService.getCommentsByAuthor(profileId, ...)`;
- `src/modules/profile/hooks/useActivityStats.ts:24` le `CommentService.getCommentCountByAuthor(profileId)`;
- `src/core/comments/services/comments.queries.ts:197` define contagem por autor;
- `src/core/comments/services/comments.queries.ts:219` define leitura por autor;
- `ActivityTimeline` renderiza o item como `comment_created`, nao como conversa de post.

Interpretacao:

O Perfil nao esta listando a conversa de um post, nem criando comentario, nem permitindo acao sobre um comentario em item territorial. Ele esta compondo um historico pessoal por autor.

### Feed e boundary publico territorial

Evidencias:

- `FEED-GOVERNANCE.md` define Feed como experiencia de fluxo social territorial;
- `Feed` existe sobre `ResolvedTerritory`;
- `FeedService.listComments()` e `FeedService.createComment()` validam item pai no Territory atual;
- `src/core/feed/services/FeedService.ts:166` implementa `listComments`;
- `src/core/feed/services/FeedService.ts:191` implementa `createComment`;
- `src/core/feed/services/FeedService.ts:253` valida `FeedContext`;
- `src/core/feed/services/FeedService.ts:272` valida o item pai via `getDetail`.

Interpretacao:

O Feed deve ser obrigatorio para superficies publicas territoriais de conversas em post. Essa regra nao deve transformar todo read model privado de atividade em dependencia do Feed.

## Analise critica da review anterior

`FEED-P0.D.1-REVIEW.md` identificou corretamente que existem chamadas diretas a `CommentService` em Profile.

Porem a classificacao como bloqueador de P0.D.1 mistura dois conceitos:

1. leitura publica de comentarios de item territorial;
2. historico pessoal privado de atividades do perfil.

A P0.D.1 deveria bloquear chamadas publicas de comentarios de Feed por `post_id`/`comment_id` sem contexto territorial. A `ActivityTimeline` nao e essa superficie. Ela e um read model pessoal, orientado a `userId`/`profileId`, dentro da area de conta.

Portanto, a review encontrou uma duvida real de boundary, nao um bug comprovado da implementacao de comentarios do Feed.

## Respostas obrigatorias

### 1. A Activity Timeline representa um historico pessoal do usuario ou uma superficie publica do Feed?

Representa um historico pessoal do usuario.

Motivos:

- esta em `/conta`, dentro do hub privado;
- depende de `userId` e `profileId`;
- agrega posts, comentarios, likes, saves e votos como atividade do perfil;
- nao recebe nem deriva `ResolvedTerritory`;
- nao compoe timeline territorial por bairro/cidade/grupo;
- nao permite ler conversa publica de post por target territorial.

### 2. Os comentarios exibidos no Perfil pertencem ao dominio Feed ou ao dominio Profile?

Pertencem ao dominio Profile enquanto registros de atividade pessoal.

Precisao de ownership:

- Comments continua dono atomico da persistencia de comentarios;
- Profile e dono da leitura agregada "comentarios feitos por este perfil";
- Feed e dono da conversa publica territorial em item de Feed.

Se o usuario clicar em um item para abrir o post/comentario como detalhe publico, essa navegacao deve fazer handoff para Feed/Routing e o alvo deve ser revalidado pelo Feed.

### 3. Migrar Perfil para o Feed aumenta ou reduz o acoplamento?

Aumenta o acoplamento.

Motivos:

- Profile passaria a depender de `ResolvedTerritory` para uma tela que e pessoal, nao territorial;
- atividades de varios territorios seriam artificialmente filtradas pelo Territory ativo;
- Rollout territorial poderia esconder historico pessoal legitimo;
- `CommunityAccessPolicy` de um bairro poderia bloquear leitura privada de atividade da conta;
- Feed passaria a acumular responsabilidades de dashboard pessoal, stats e historico, que pertencem a Profile.

### 4. A GOVERNANCE do Feed realmente pretendia incluir o Perfil?

Nao de forma explicita.

A governanca diz que todo acesso publico de Feed deve passar pelo Feed Service. Ela tambem usa linguagem ampla sobre comentarios, mas o contexto do documento e sempre "experiencia de fluxo social territorial", "timeline territorial", "detalhe", "criacao publica", "deep-link", "share", "notification" e "modulos externos".

O Perfil privado nao aparece como superficie governada pelo Feed no `PROJECT-MILESTONE-1.md`. O marco lista Profile/Profiles como dependencia e dominio proprio, enquanto Feed governa superficie social publica territorial.

Conclusao: a governanca precisa de uma clarificacao, nao de uma migracao automatica do Perfil.

### 5. A Activity Timeline deve continuar independente?

Sim.

Ela deve continuar independente do Feed como superficie de Profile.

Essa independencia e correta desde que:

- seja read-only para atividade pessoal;
- nao crie, edite, exclua, reaja, denuncie ou compartilhe item de Feed;
- nao liste conversa publica por `post_id`;
- nao seja usada como discovery global de posts/comentarios;
- links para abrir item social sejam entregues ao Feed/Routing para validacao territorial.

### 6. Existe alguma solucao melhor que preserve baixo acoplamento?

Sim.

Solucao recomendada:

1. Manter `ActivityTimeline` no dominio Profile.
2. Tratar `CommentService.getCommentsByAuthor` e `getCommentCountByAuthor` como colaboradores de read model pessoal, nao como operacoes publicas de Feed.
3. Criar no futuro, se necessario, um `ProfileActivityService` ou `ProfileActivityReadModel` como porta canonica de Profile para atividades pessoais.
4. Proibir Profile de executar mutations de Feed diretamente.
5. Exigir que qualquer abertura de post/comentario a partir do Perfil use URL canonica ou rota que acione `FeedService.getDetail()`.
6. Explicitar na governanca que Activity/Stats privados do Profile nao pertencem ao boundary publico de Feed.

Essa solucao preserva baixo acoplamento e evita que Feed vire owner de dashboards pessoais.

### 7. A review identificou um bug de implementacao ou uma duvida de boundary?

Identificou uma duvida de boundary.

A implementacao de `FeedService.listComments()` e `FeedService.createComment()` esta alinhada ao boundary publico territorial. O ponto de Perfil nao prova vazamento da superficie publica de comentarios do Feed; ele revela que a governanca nao distingue explicitamente "comentario como conversa publica territorial" de "comentario como atividade pessoal do autor".

## Decisao oficial desta sprint

O Perfil pertence ao dominio Profile.

`ActivityTimeline`, `useUserActivity` e `useActivityStats` nao devem ser migrados para Feed apenas porque consomem comentarios como fonte atomica.

O que pertence ao Feed:

- leitura de comentarios em item de Feed dentro de rota territorial;
- criacao de comentarios em item de Feed;
- replies quando forem implementadas como conversa publica;
- reactions em comentarios quando forem implementadas;
- denuncia/moderacao de comentario quando o alvo for um item de Feed;
- deep-link, share e abertura publica de alvo social.

O que pertence ao Profile:

- historico pessoal do usuario;
- estatisticas pessoais por `userId`/`profileId`;
- leitura de atividades feitas pelo perfil;
- agregacao privada de posts, comentarios, curtidas, saves e votos do usuario;
- widgets de conta e exportacao/privacidade de dados pessoais.

## Proposta de atualizacao futura da GOVERNANCE

Nao aplicada nesta sprint.

Adicionar uma secao de excecao/clarificacao em `FEED-GOVERNANCE.md`:

```text
Profile Activity Exception

O boundary publico do Feed nao inclui read models privados de Perfil,
como historico pessoal, estatisticas por autor, exportacao de dados e
atividade recente da conta.

Profile pode consumir read models atomicos de Posts, Comments e Engagement
para compor atividades pessoais read-only, desde que:

- a superficie seja Profile/Account, nao Feed/Community;
- a operacao nao crie, edite, exclua, reaja, denuncie ou compartilhe alvo de Feed;
- a operacao nao liste conversa de post por post_id como experiencia publica;
- a operacao nao substitua timeline territorial;
- qualquer abertura de item social seja entregue ao Feed/Routing para validacao
  territorial e visibilidade;
- superficies publicas de perfil tenham politica propria de privacidade e nao
  exponham conteudo removido, oculto ou sem permissao.
```

## Impacto na P0.D.1

A decisao reclassifica o finding D1-R1 da review anterior:

- de "bug de implementacao do Feed";
- para "boundary nao explicitado na governanca".

Com essa decisao, `useUserActivity` e `useActivityStats` nao bloqueiam a conclusao funcional da P0.D.1, desde que a governanca seja atualizada antes do Feed Freeze ou antes de usar auditoria estatica como criterio automatico.

A recomendacao D1-R2 sobre denuncia de comentario permanece valida como item futuro de Moderation/Feed, porque denuncia de comentario e uma acao publica sobre alvo social e deve ser tratada por sprint propria.

## Riscos residuais

- A Activity Timeline hoje exibe trecho de comentario por autor sem validar visibilidade do post pai pelo Feed. Em area privada isso e aceitavel como read model pessoal, mas deve ser reavaliado se virar superficie publica.
- O clique em atividade de post usa destino de comunidade e depende do Feed para falhar fechado quando o alvo nao pertencer ao Territory ativo. A URL canonica final ainda pertence a sprint futura de Feed URL/share.
- A governanca atual ainda pode gerar falsos positivos em buscas estaticas por `CommentService` se nao receber a excecao de Profile Activity.
- Se Profile passar a permitir acoes sobre comentarios, acoes devem entrar pelo Feed ou por uma governanca especifica aprovada.

## Conclusao

O Perfil pertence ao dominio Profile.

A Activity Timeline deve continuar independente como historico pessoal read-only. Feed deve continuar sendo o boundary publico para conversas territoriais em item de Feed e para acoes sobre alvos sociais.
