# Posts e Feed SSOT

> AVISO DE SUBSTITUICAO DOCUMENTAL
>
> Status: SUBSTITUIDO.
> Documento canonico atual: `docs/feed/FEED-FREEZE.md`.
> Este arquivo fica preservado apenas como historico e nao deve ser usado como fonte normativa para a superficie publica do Feed.

Status: vigente
Data: 2026-07-17
Finding encerrado: CP-008

## Decisao

`src/core/posts` e o unico owner de `Post`, CRUD, leitura territorial e
paginacao. A tabela canonica e `public.posts`; o runtime publico e
`postService`.

`src/core/feed` nao possui CRUD nem um segundo contrato de Post. No estado
atual ele contem somente as chaves de cache da composicao comunitaria. Tipos
como `FeedItem`, `FeedSource` e ranking so devem ser introduzidos quando houver
uma superficie real que agregue mais de uma entidade canonica. Criar esses
tipos antecipadamente produziria uma abstracao sem consumidor.

## Contrato de leitura

- filtro territorial usa `location_id` ou um conjunto limitado de
  `location_ids`;
- cada pagina aceita de 1 a 50 itens e consulta `limit + 1`;
- a ordem e deterministica por `created_at DESC, id DESC`;
- o cursor novo e opaco e inclui timestamp e UUID para desempatar posts
  criados no mesmo instante;
- o cursor antigo contendo somente timestamp e aceito apenas durante a
  transicao;
- posts tecnicos de seed nao entram na resposta publica;
- `is_published`, `is_hidden` e `is_removed` sao aplicados na consulta como
  defesa em profundidade e tambem pela RLS.
- `images` persiste somente `MediaAssetRef` do preset `post_image`; leitura
  resolve a URL no read model e nunca consulta o campo legado `image_url`.

## Fronteiras

- Community resolve territorio, compoe a tela e controla cache; nao consulta
  `posts` diretamente.
- Comments, reactions, saves e shares mantem seus owners e lifecycles. Eles
  nao sao campos mutaveis do Feed.
- Event, Classified e Business permanecem entidades de seus dominios. Um
  futuro feed federado deve usar adapters read-only, nunca copiar seus dados
  mestres para `posts`.
- contextos `my_posts` e `saved` nao fazem parte de `getFeed`; consultas de
  autoria e salvos usam os contratos especificos de Posts/Engagement.

## Remocoes

- `core/feed/services/FeedService.ts`;
- `core/feed/types.ts`;
- alias `postService as feedService`;
- consulta territorial duplicada em `posts.queries.ts`;
- adapter `feedItems` sem consumidor no hook comunitario.
- writer e resolvedor do bucket legado `post_images`.

Nao foi mantido adapter deprecated porque o inventario confirmou zero
consumidores dos contratos removidos.

## Evidencias

- `tests/architecture/posts-feed-ssot.test.ts`;
- `src/core/posts/services/__tests__/postFeedCursor.spec.ts`;
- `tests/security/community-post-feed-security.test.ts`;
- `npm run validate:architecture:core-platform`.
