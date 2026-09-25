# FEED.P0.E.HARDENING Report

## Escopo

Sprint de hardening para concluir a FEED.P0.E, limitada aos bloqueadores documentados em `docs/feed/FEED-P0.E-REVIEW.md`.

Base obrigatoria:

- `docs/feed/FEED-GOVERNANCE.md`
- `docs/feed/FEED-P0.E-REPORT.md`
- `docs/feed/FEED-P0.E-REVIEW.md`

Nao foram implementadas funcionalidades de P0.D, nao houve alteracao de arquitetura, nao houve alteracao de governanca e nao houve mudanca de UX.

## Resultado

Status: pronto para encerramento.

Os quatro bloqueadores da review foram eliminados dentro do escopo:

- P0E-H1: resolvido.
- P0E-H2: resolvido.
- P0E-H3: resolvido.
- P0E-H4: resolvido, com observacao de uma falha legada fora do escopo na suite completa de Mobility.

## Arquivos Alterados

| Arquivo | Linhas principais | Motivo |
| --- | ---: | --- |
| `src/modules/mobility/hooks/useCommunityPosts.ts` | 71, 76, 82, 90-91 | Falha fechada completa quando `FeedContext` nao permite leitura publica de `ride_share`. |
| `src/core/posts/services/posts.queries.ts` | 238-239 | Aplicacao de `is_hidden = false` e `is_removed = false` na leitura publica por tipo. |
| `src/modules/mobility/hooks/useCommunityPosts.spec.tsx` | 116, 145, 199 | Cobertura de cache pre-existente, AccessPolicy invalida e territorio City. |
| `src/core/feed/__tests__/FeedService.spec.ts` | 202, 223 | Cobertura de rollout bloqueado e AccessPolicy bloqueada sem chamada ao repositorio. |
| `src/core/posts/services/__tests__/posts.queries.spec.ts` | 91, 103-104 | Cobertura dos filtros canonicos de visibilidade publica para `ride_share`. |
| `src/modules/mobility/components/community/CommunityRideFeed.spec.tsx` | 27 | Smoke de renderizacao da tela Mobility sem `FeedContext` valido. |
| `docs/feed/FEED-P0.E-REPORT.md` | rollback | Rollback corrigido para nunca restaurar leitura global publica. |

## P0E-H1 - Falha Fechada Completa

`useCommunityPosts()` agora deriva `posts` e `loading` a partir de `canReadRideSharePosts`.

Quando `FeedContext` deixa de ser valido, o hook retorna:

- `posts: []`
- `isLoading: false`
- `loading: false`

Mesmo que o React Query possua dados previamente em cache, esses dados nao permanecem visiveis ao caller publico.

## P0E-H2 - Visibilidade Publica Canonica

`getPostsByType()` passou a aplicar os mesmos criterios publicos minimos da timeline canonica para leitura de `ride_share`:

- `is_published = true`
- `is_hidden = false`
- `is_removed = false`

A leitura publica de Mobility continua passando por:

`useCommunityPosts()` -> `FeedService.listRideShareItems()` -> `FeedRepository.listRideShareItems()` -> `PostService.getPostsByType()`

Nao foi encontrado caller publico de Mobility acessando `PostService.getPostsByType("ride_share")` diretamente.

## P0E-H3 - Rollback Corrigido

O rollback documentado em `FEED-P0.E-REPORT.md` foi corrigido para preservar a guarda territorial.

O rollback permitido:

- pode reverter a integracao visual especifica de Mobility;
- deve manter Empty State quando nao houver `FeedContext` valido;
- deve manter a query desabilitada sem territorio valido;
- nao pode restaurar leitura global publica de `ride_share`.

## P0E-H4 - Testes

Testes adicionados ou ampliados:

- cache pre-existente + `FeedContext` invalido;
- rollout bloqueado;
- AccessPolicy invalida;
- garantia de que `FeedRepository` nao e chamado quando rollout ou AccessPolicy bloqueiam a leitura;
- `ride_share` hidden;
- `ride_share` removed;
- cenario City;
- smoke da tela Mobility.

## Validacao Executada

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Passou. |
| `npm run lint` | Passou, com 13 warnings pre-existentes de `maps/no-manual-entity-projection` fora do escopo. |
| `npm run build` | Passou. |
| `npm run test -- src/core/feed` | Passou: 7 arquivos, 50 testes. |
| `npm run test -- src/modules/mobility/hooks/useCommunityPosts.spec.tsx src/modules/mobility/components/community/CommunityRideFeed.spec.tsx` | Passou: 2 arquivos, 6 testes. |
| `npm run test -- src/core/posts/services/__tests__/posts.queries.spec.ts` | Passou: 1 arquivo, 2 testes. |
| `npm run test -- src/modules/mobility` | Falhou por teste legado fora do escopo: `src/modules/mobility/delivery/__tests__/DeliverySSOTGuard.test.ts`. |
| `git diff --check` | Passou, apenas warnings de CRLF em arquivos ja sujos. |

Falha fora do escopo na suite completa de Mobility:

- Teste: `DeliverySSOTGuard.test.ts`
- Motivo: expectativa ASCII para mensagem de entrega por rede de motoboy, enquanto a fonte atual usa texto acentuado e frase expandida.
- Impacto na P0.E: nenhum. O teste pertence ao fluxo de Delivery e nao ao hardening de leitura publica `ride_share`.

Smoke visual:

- Smoke de componente da tela Mobility foi executado via Vitest em `CommunityRideFeed.spec.tsx`.
- Smoke no browser foi tentado, mas o runtime do browser tool ficou indisponivel e depois expirou em `Runtime.evaluate`; nao houve evidencia de falha da aplicacao nessa tentativa.

## Auditoria De Caller

Busca estatica por `getPostsByType` encontrou uso direto de `ride_share` apenas em:

- `src/core/feed/repositories/FeedRepository.ts`
- testes do proprio Feed/Posts

Nao foi encontrado caller publico de Mobility lendo `ride_share` fora do Feed.

## Riscos

- `PostService.getPostsByType()` ainda existe como helper interno e continua exposto pelo modulo de Posts, mas o fluxo publico coberto pela P0.E nao o chama diretamente.
- A suite completa de Mobility ainda possui uma falha legada em Delivery, fora do escopo desta sprint.
- O browser smoke nao foi concluido por limitacao de ferramenta; a cobertura de componente garante o Empty State sem `FeedContext`.

## Rollback Atualizado

Rollback seguro da P0.E.HARDENING:

1. Reverter somente a alteracao visual/integracao de Mobility que consome o hook, se necessario.
2. Manter `useCommunityPosts()` retornando Empty State quando `FeedContext` for invalido.
3. Manter a leitura publica sem territorio valido desabilitada.
4. Manter os filtros `is_published`, `is_hidden` e `is_removed` na leitura publica.
5. Nao restaurar `postService.getPostsByType("ride_share")` como leitura publica global.

Esse rollback preserva a governanca territorial e nao reabre vazamento global.

## Aderencia A GOVERNANCE

- A leitura publica de `ride_share` permanece sob o dominio Feed.
- `TerritoryFilter`, `Rollout` e `AccessPolicy` continuam avaliados antes da leitura.
- O hook publico falha fechado sem contexto valido.
- Nao houve criacao de novo SSOT.
- Nao houve duplicacao de regras de autorizacao no modulo Mobility.
- Nao houve implementacao de comentarios, replies, reacoes, saves, share, realtime ou moderacao.

Conclusao: a Sprint FEED.P0.E esta pronta para encerramento.
