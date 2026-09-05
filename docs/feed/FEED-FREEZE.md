# FEED-FREEZE.md

Data: 2026-07-28

Status: SNAPSHOT HISTORICO DO FREEZE

> Nota de implementação 2026-09-05: as invariantes deste documento continuam relevantes (território explícito, visibilidade pública e falha fechada), mas a implementação `FeedService`/`FeedRepository` descrita abaixo foi posteriormente consolidada e removida por CP-008. O contrato executável atual está em `src/core/posts`, `src/core/community-feed`, owners de Comments/Engagement e `docs/07-modules/POSTS_FEED_SSOT.md`. Não recriar paths removidos para satisfazer este snapshot.

Decisao oficial: o dominio Feed entra oficialmente em Freeze.

## 1. Objetivo do Freeze

Formalizar que o dominio Feed possui governanca, SSOT, boundaries, contratos publicos e integracoes oficiais suficientes para entrar em modo de manutencao evolutiva controlada.

O Freeze nao significa que nenhuma feature futura possa existir. Significa que qualquer evolucao futura deve preservar a arquitetura consolidada do Feed ou passar por uma ADR/DECISION especifica antes de alterar boundaries, contratos ou responsabilidades.

## 2. Escopo congelado

O Freeze cobre as superficies publicas do Feed:

- timeline territorial;
- detalhe territorial;
- deep link territorial;
- criacao de item;
- edicao de item;
- exclusao de item;
- voto em enquete;
- comentarios;
- reacoes;
- saves;
- compartilhamento;
- denuncias;
- URL canonica territorial;
- Search de posts;
- leitura social de `ride_share`;
- cache publico do Feed;
- query keys territoriais;
- validacao de Territory, Rollout e CommunityAccessPolicy.

Fica congelado que nenhuma dessas superficies pode operar em modo global implicito, sem `FeedContext` valido ou sem validacao territorial.

## 3. Boundaries oficiais

O Feed e a porta publica obrigatoria para usar posts e interacoes sociais como experiencia territorial.

Boundary oficial:

```text
Pages
  -> Hooks publicos do Feed
  -> FeedService
  -> FeedRepository
  -> Posts / Comments / Engagement / Search / Moderation como colaboradores internos
```

Nenhuma UI publica, hook publico ou modulo satelite pode acessar diretamente Posts, Comments, Engagement, Share, Reports ou Search de posts quando a operacao pertencer ao boundary publico do Feed.

## 4. Responsabilidades congeladas do Feed

O Feed e responsavel por:

- resolver a experiencia publica de timeline social dentro de um Territory;
- validar que cada item pertence ao Territory resolvido;
- validar rollout antes de leitura ou escrita publica;
- validar CommunityAccessPolicy antes de leitura ou escrita publica;
- preservar URLs territoriais em detalhe, Search, share e deep links;
- falhar fechado quando contexto, target, rollout ou access policy nao estiverem prontos;
- impedir cache visivel quando `FeedContext` ou `FeedTarget` ficarem invalidos;
- orquestrar colaboradores internos sem expor esses colaboradores como portas publicas.

O Feed nao e responsavel por:

- hierarquia geografica, boundary, slug, URL base territorial ou `TerritoryFilter` primario;
- membership e regras brutas de Community;
- schema atomico de Posts;
- schema atomico de Comments;
- deduplicacao atomica de Engagement;
- ranking federado geral de Search;
- workflow final de Moderation;
- delivery de Notifications;
- regras operacionais de Mobility fora da camada social `ride_share`.

## 5. Contratos publicos congelados

Os contratos publicos do Feed sao:

- `FeedService`;
- `FeedRepository`, como colaborador interno da camada de aplicacao;
- `FeedContext`;
- `FeedTarget`;
- `FeedQueryKeys`;
- `CanonicalFeedUrl`;
- `useFeedContext`;
- `useFeedTimeline`;
- `useFeedItemDetail`;
- `useCreateFeedItem`;
- `useUpdateFeedItem`;
- `useDeleteFeedItem`;
- `useFeedComments`;
- `useCreateFeedComment`;
- `useFeedReactions`;
- `useReactToFeedItem`;
- `useSaveFeedItem`;
- `useShareFeedItem`;
- `useReportFeedItem`;
- provider de Search de posts via Feed.

Todo contrato publico deve preservar:

- `ResolvedTerritory`;
- `TerritoryFilter`;
- Rollout;
- CommunityAccessPolicy;
- `FeedTarget` quando a operacao tiver alvo;
- falha fechada;
- ausencia de fallback global ou territorial silencioso.

## 6. Excecoes aprovadas

### 6.1 FeedRepository como adapter interno

`FeedRepository` pode consumir `postService`, `CommentService`, `PostEngagementService`, `searchPublicPosts` e `communityReportService` como colaboradores internos, desde que a operacao publica tenha passado pelo `FeedService`.

Essa excecao nao autoriza UI, hooks publicos ou modulos satelites a consumirem esses servicos diretamente para operacoes do Feed.

### 6.2 Profile Activity Exception

`ActivityTimeline`, `useUserActivity` e `useActivityStats` pertencem ao dominio Profile e podem consumir read models atomicos de Posts, Comments e Engagement para compor historico pessoal read-only.

Essa excecao nao autoriza Profile a criar, editar, excluir, reagir, denunciar, compartilhar ou abrir alvo social publico sem passar pelo Feed/Routing territorial.

### 6.3 Dominios nao-Feed

Admin, Metrics, Landing, Classifieds, Lost Found, Business, Services, Events, Mobility operacional, Notifications e Messaging podem manter seus SSOTs proprios quando a operacao nao pertencer ao boundary publico do Feed.

Quando qualquer um desses dominios usar posts/interacoes como experiencia social territorial publica, deve passar pelo Feed.

## 7. Integracoes autorizadas

Integracoes autorizadas do Feed:

- Territory: fonte de `ResolvedTerritory`, `TerritoryFilter`, URL territorial e escopo geografico;
- Community: fonte de CommunityAccessPolicy;
- Rollout: fonte de disponibilidade operacional por Territory;
- Posts: persistencia atomica de item social, apenas via `FeedRepository`;
- Comments: persistencia atomica de comentarios, apenas via `FeedRepository`;
- Engagement: persistencia atomica de reacoes/saves/votes, apenas via `FeedRepository`;
- Search: busca federada consumindo posts exclusivamente via Feed;
- Moderation/Reports: destino de denuncia validada pelo Feed;
- Mobility: `ride_share` publico/social via Feed;
- Notifications/Messaging: consumidores futuros de eventos/links territoriais do Feed, sem decidir visibilidade.

## 8. Criterios para futuras alteracoes

Qualquer alteracao futura no dominio Feed devera preservar:

- GOVERNANCE;
- SSOT;
- boundaries;
- contratos publicos;
- falha fechada;
- validacao territorial;
- rollout;
- CommunityAccessPolicy;
- query keys territoriais;
- URL canonica territorial;
- ausencia de fallback global;
- ausencia de acesso publico direto a servicos internos.

Alteracoes que nao preservem esses pontos devem passar por ADR/DECISION especifica antes de implementacao.

Exigem ADR/DECISION:

- novo tipo publico de `FeedTarget`;
- novo caller publico fora dos hooks do Feed;
- nova integracao que leia ou escreva posts/interacoes sociais;
- mudanca em `FeedContext`;
- mudanca na politica de fallback;
- mudanca em URL canonica ou deep links;
- autorizacao para operar Feed fora de Territory resolvido;
- excecao nova para leitura direta de Posts, Comments ou Engagement.

## 9. Regra de manutencao

A partir deste Freeze:

1. Nenhuma nova tela publica pode operar Feed fora do `FeedService`.
2. Nenhum novo hook publico pode operar por ID puro sem `FeedContext` e `FeedTarget`.
3. Nenhum modulo satelite pode fabricar AccessPolicy permissiva.
4. Nenhum modulo satelite pode usar slug manual como substituto de `ResolvedTerritory`.
5. Nenhuma URL de post pode ser global, nominal ou derivada de fallback silencioso.
6. Nenhum cache pode reapresentar conteudo quando o contexto territorial ficar invalido.
7. Qualquer excecao deve estar documentada antes do merge.

## 10. Declaracao oficial

O dominio Feed entra oficialmente em Freeze.

Qualquer alteracao futura devera preservar GOVERNANCE, SSOT, boundaries e contratos publicos ou passar por ADR/DECISION especifica.
