# FEED.P0.E - Implementation Report

Data: 2026-07-25

## Escopo

Sprint executada exclusivamente conforme `docs/feed/FEED-ROADMAP.md`, `docs/feed/FEED-GOVERNANCE.md` e `docs/feed/FEED-EXECUTION-PLAN.md`.

Objetivo da P0.E:

- eliminar vazamento territorial remanescente na leitura de posts de mobilidade;
- manter o Feed como unica porta publica de acesso;
- impedir que `ride_share` seja listado globalmente sem `ResolvedTerritory`, `TerritoryFilter`, Rollout e AccessPolicy validos.

Ficaram fora do escopo:

- comentarios;
- replies;
- reacoes;
- saves;
- share;
- realtime;
- moderacao;
- novas funcionalidades;
- nova UX.

## Arquivos Alterados

- `src/core/feed/types.ts`
- `src/core/feed/index.ts`
- `src/core/feed/queryKeys.ts`
- `src/core/feed/services/FeedService.ts`
- `src/core/feed/repositories/FeedRepository.ts`
- `src/core/posts/services/posts.queries.ts`
- `src/core/posts/services/post.service.runtime.ts`
- `src/modules/mobility/hooks/useCommunityPosts.ts`
- `src/core/feed/__tests__/FeedService.spec.ts`
- `src/core/feed/__tests__/FeedRepository.spec.ts`
- `src/modules/mobility/hooks/useCommunityPosts.spec.tsx`

## Responsabilidades Migradas

### Mobility ride-share read

Antes:

- `useCommunityPosts()` chamava `postService.getPostsByType("ride_share")` diretamente;
- a query nao recebia contexto territorial;
- a chave de cache nao incluia territorio;
- havia risco de reaproveitar resultado entre bairros.

Depois:

- `useCommunityPosts()` chama somente `feedService.listRideShareItems()`;
- a query so fica habilitada quando `FeedContext` esta pronto;
- `FeedService` valida `ResolvedTerritory`, `TerritoryFilter`, Rollout e AccessPolicy antes de consultar;
- `FeedRepository` repassa `TerritoryFilter` obrigatorio para a camada de posts;
- a chave de cache usa `feedQueryKeys.rideShare()` com o `TerritoryFilter` ativo.

## Callers Eliminados

Eliminado do modulo publico:

- `src/modules/mobility/hooks/useCommunityPosts.ts`
  - removido acesso direto a `postService.getPostsByType("ride_share")`;
  - substituido por `feedService.listRideShareItems()`.

A chamada restante a `getPostsByType("ride_share")` fica encapsulada em:

- `src/core/feed/repositories/FeedRepository.ts`

Essa chamada recebe `TerritoryFilter` e nao e exposta como porta publica do modulo Mobility.

## Aderencia a GOVERNANCE

Status: aderente para o escopo P0.E.

Validacoes:

- todos os fluxos de leitura `ride_share` cobertos pela P0.E passam pelo dominio Feed;
- nenhum modulo satelite acessa diretamente Posts para listar `ride_share`;
- `FeedService.listRideShareItems()` falha fechado quando `FeedContext` nao esta pronto;
- `validateFeedContext()` continua sendo a regra unica para `ResolvedTerritory`, `TerritoryFilter`, Rollout e AccessPolicy;
- nenhum hardcode territorial novo foi introduzido;
- nenhuma regra de Rollout ou AccessPolicy foi duplicada;
- nao houve alteracao de UX nem de arquitetura.

## Testes Adicionados

### FeedService

`src/core/feed/__tests__/FeedService.spec.ts`

Cobertura adicionada:

- sem contexto pronto, `listRideShareItems()` retorna feed vazio;
- sem contexto pronto, o repository nao e chamado;
- com contexto pronto, a chamada e delegada ao repository com `TerritoryFilter`, busca e limite.

### FeedRepository

`src/core/feed/__tests__/FeedRepository.spec.ts`

Cobertura adicionada:

- `scope: none` retorna feed vazio e nao consulta posts;
- bairro unico consulta `ride_share` com `TerritoryFilter` de location;
- grupo territorial consulta `ride_share` com `TerritoryFilter` de group.

### Mobility hook

`src/modules/mobility/hooks/useCommunityPosts.spec.tsx`

Cobertura adicionada:

- sem `FeedContext`, a query fica desabilitada e nao chama `FeedService`;
- com `FeedContext`, a query usa chave de cache territorial e chama `feedService.listRideShareItems()`.

## Validacoes Executadas

- `npm run test -- src/core/feed`
  - aprovado;
  - 7 arquivos;
  - 48 testes.

- `npm run test -- src/modules/mobility/hooks/useCommunityPosts.spec.tsx`
  - aprovado;
  - 1 arquivo;
  - 2 testes.

- `npm run typecheck`
  - aprovado.

- `npm run lint`
  - aprovado com warnings existentes;
  - 0 erros;
  - 13 warnings de `maps/no-manual-entity-projection` em paginas de mapa fora do escopo da P0.E.

- `npm run build`
  - aprovado.

## Compatibilidade

Compatibilidade preservada:

- `useCommunityPosts()` manteve assinatura existente e recebeu `options` ja usado pelo fluxo migrado anteriormente;
- a UI de `CommunityRideFeed` nao foi alterada;
- estados visuais existentes de loading, erro e empty state foram mantidos;
- criacao de posts de mobilidade permaneceu no caminho ja migrado para `FeedService.createItem()` em P0.C;
- comentarios e reacoes permaneceram intocados por pertencerem a sprints futuras.

## Riscos

### Risco: lista vazia quando o caller nao fornecer FeedContext

Impacto: esperado pela P0.E.

Motivo: sem territorio resolvido, Mobility nao deve consultar posts.

Mitigacao: `CommunityRideFeed` ja passa `feedContext`; se algum caller futuro omitir contexto, a falha sera fechada e visivel por empty state.

### Risco: `getPostsByType()` ainda existe no dominio Posts

Impacto: baixo para P0.E.

Motivo: o metodo permanece como helper interno/administrativo, mas nao e mais chamado diretamente por Mobility para leitura publica.

Mitigacao: a chamada publica coberta pela sprint agora passa pelo Feed. Qualquer endurecimento global de `getPostsByType()` deve ser tratado em sprint propria para evitar quebra fora do escopo.

## Rollback

Rollback tecnico da P0.E:

1. Reverter a integracao visual de Mobility se necessario.
2. Manter `useCommunityPosts()` falhando fechado quando `FeedContext` nao estiver valido.
3. Manter a query desabilitada sem Territory valido.
4. Manter retorno de Empty State em vez de qualquer leitura global.
5. Remover apenas os testes que dependerem de uma integracao revertida.

Observacao: o rollback nao pode restaurar `postService.getPostsByType("ride_share")` como leitura publica global. Mesmo em contingencia, a guarda territorial permanece obrigatoria.

## Observacoes Fora do Escopo

- Comentarios e reacoes em `useCommunityPosts()` continuam usando seus dominios atuais porque P0.E proibiu implementar P0.D.
- O lint segue reportando 13 warnings de mapas em arquivos fora do dominio Feed/Mobility P0.E.
- O worktree possui muitas alteracoes pre-existentes nao relacionadas a esta sprint; nenhuma delas foi revertida.

## Conclusao

A Sprint FEED.P0.E eliminou o vazamento territorial de leitura de `ride_share` no modulo publico Mobility.

O caminho publico agora e:

`CommunityRideFeed` -> `useCommunityPosts` -> `FeedService.listRideShareItems()` -> `FeedRepository` -> `PostService` com `TerritoryFilter`

Status: pronto para review.
