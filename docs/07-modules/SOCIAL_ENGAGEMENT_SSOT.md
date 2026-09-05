# Social Engagement SSOT

Status: canonico
Data: 2026-07-14
Escopo: comentarios, reacoes, itens salvos e compartilhamentos sociais.

## 1. Decisao

Engagement e uma capacidade compartilhada, mas nao e uma tabela universal nem
um service que conhece todos os dominios. Cada agregado conserva seu owner,
lifecycle, RLS e persistencia:

| Capacidade | Owner de escrita | Persistencia |
| --- | --- | --- |
| Like e save de Post | `PostEngagementService` | `post_likes_new`, `saved_posts_new` |
| Comentario e like de Comment | `core/comments` | `comments`, `comment_likes` |
| Share autenticado de Post | `core/posts` | `post_share_events`; Web Share/clipboard permanece efeito de UI |
| Membership/interacao de Grupo | `SocialGroupInteractionsService` | tabelas `group_*` |
| Favoritos de Empresa | `BusinessFavoriteStore` | `user_favorite_businesses` |
| Saves de Classificado, Evento, Ponto e Vaga | adapter do dominio sobre infraestrutura interna allowlisted | tabela propria do dominio |

`core/interaction`, `InteractionService` e `SocialInteractionsService` foram
removidos. Eles nao possuam regra propria e criavam dois caminhos publicos para
as mesmas escritas.

## 2. Identidade e autorizacao

- APIs publicas nao recebem `author_profile_id`, `liker_profile_id`,
  `saver_profile_id` ou `sharer_profile_id` do consumidor.
- O owner deriva o Profile ativo por `ProfileService`.
- Dados enviados pelo browser continuam nao confiaveis. RLS valida que o JWT
  possui o Profile ativo e que o Post/Comment alvo esta visivel.
- Constraints unicas tornam likes, saves e shares idempotentes.
- Triggers privados atualizam contadores; o browser nao escreve contadores.
- O rate limit transacional usa advisory lock e audit interno sem copiar texto
  ou midia do conteudo.

## 3. Itens salvos entre dominios

`ProfileSavedEntityService` e infraestrutura interna. Ele aceita somente o
union discriminado `classified | event | tourist_point | vaga`; tabela e coluna
vem de registry fechado no codigo e nunca da UI. Cada dominio expoe seu adapter
nomeado e conserva sua tabela, RLS, retencao e regra de elegibilidade.

Adicionar um novo tipo exige:

1. adapter pertencente ao dominio;
2. tabela e constraints versionadas em migration;
3. RLS/grants e teste negativo de acesso cruzado;
4. inclusao explicita no registry e no manifest de ownership.

Uma configuracao arbitraria `{ tableName, entityIdColumn }` nao faz parte do
contrato publico.

## 4. UI e cache

Hooks podem aplicar optimistic update, mas devem guardar o snapshot anterior e
restaura-lo em falha. A resposta do backend e a autoridade final e invalida a
raiz `communityFeedQueryKeys.root`. Estado otimista nao concede permissao nem
altera contadores diretamente no banco.

Web Share/clipboard e efeito da UI. O evento persistido e append-only,
idempotente por Profile/Post e deriva o Profile ativo no owner de Posts.

## 5. Guardrails

- `core-platform-ownership.json` declara um writer por tabela;
- `social-engagement-ssot.test.ts` bloqueia o retorno dos facades, hooks
  antigos, identidade recebida da UI e storage generico arbitrario;
- `CommunitySocialProductionHardening.spec.ts` valida RLS, constraints,
  triggers, limites e auditoria;
- `validate-core-platform-ownership` bloqueia novos callsites nao declarados.

## 6. Limites honestos

- O modulo de bloqueio entre usuarios nao esta implementado. O antigo
  `BlockService` referenciava uma tabela inexistente, nao tinha consumidores e
  foi removido; uma futura capacidade exige schema, UX, RLS e moderacao
  completos.
- Os contratos estaticos e testes locais nao substituem probe autenticado e
  carga em staging. Nenhuma capacidade de requisicoes por segundo e prometida
  sem medicao p50/p95/p99 no ambiente autorizado.
- Comments de Classificado, Q&A e outros dominios nao devem ser fundidos com
  `comments(post_id)` apenas por semelhança visual.
