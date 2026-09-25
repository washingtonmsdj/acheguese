# FEED.P1.B-REPORT

## Sprint

FEED.P1.B

## Objetivo

Eliminar o bloqueador FRZ-B4 consolidando URL canonica territorial, deep links territoriais e integracao oficial do Feed com Search.

## Resultado

A Sprint FEED.P1.B foi implementada e esta pronta para review.

O Feed agora possui uma resolucao canonica de URL territorial para itens publicos, validada pelo mesmo boundary do Feed antes de qualquer URL ser emitida. A busca federada deixou de chamar `searchPublicPosts()` diretamente e passou a consumir posts via `FeedService.searchItems()`, recebendo apenas resultados com `target_url` canonico quando o `FeedContext` esta valido.

## Arquivos alterados

- `src/core/feed/types.ts`
- `src/core/feed/index.ts`
- `src/core/feed/queryKeys.ts`
- `src/core/feed/utils/canonicalFeedUrl.ts`
- `src/core/feed/repositories/FeedRepository.ts`
- `src/core/feed/services/FeedService.ts`
- `src/core/feed/hooks/useShareFeedItem.ts`
- `src/core/posts/utils/postShare.ts`
- `src/core/search/contracts.ts`
- `src/core/search/providers/searchProviders.ts`
- `src/core/search/services/__tests__/SearchService.spec.ts`
- `src/core/feed/__tests__/FeedService.spec.ts`
- `src/core/feed/__tests__/FeedRepository.spec.ts`
- `src/core/feed/__tests__/useShareFeedItem.spec.tsx`
- `src/app/pages/BuscaPage.tsx`
- `docs/SCREEN-MAP.md`
- `docs/FEATURE-MAP.md`

## Responsabilidades migradas

### CanonicalFeedUrl

Foi criado o tipo `CanonicalFeedUrl` e o helper canonico `normalizeCanonicalFeedBasePath()` / `resolveCanonicalFeedUrl()` dentro do dominio Feed.

Regras consolidadas:

- aceita somente base comunitaria territorial;
- rejeita `/comunidade`;
- rejeita `/comunidade/ba`;
- aceita no minimo `/comunidade/:uf/:city`;
- preserva origin quando a base canonica for absoluta;
- nunca usa `LAUNCH_URLS.community`;
- nunca gera URL nominal/global;
- gera deep-link por `?post=<id>` somente sobre base territorial validada.

### FeedService

Foram adicionados:

- `FeedService.resolveCanonicalUrl()`;
- `FeedService.searchItems()`.

Ambos validam antes:

- `FeedContext`;
- `ResolvedTerritory`;
- `TerritoryFilter`;
- `Rollout`;
- `CommunityAccessPolicy`;
- `FeedTarget`.

Quando qualquer validacao falha, a operacao falha fechado.

### FeedRepository

Foram adicionados:

- `FeedRepository.resolveCanonicalUrl()`;
- `FeedRepository.searchItems()`.

`searchPublicPosts()` permanece apenas como colaborador interno do `FeedRepository`, nao como boundary publico de Search.

### Search

`SearchFilters` passou a aceitar `feedContext`.

O provider de posts em `searchProviders.ts` agora:

- exige `filters.feedContext`;
- chama `FeedService.searchItems()`;
- retorna lista vazia quando o contexto nao existe ou nao esta pronto;
- nao emite `target_url: null` para posts;
- nao acessa mais `searchPublicPosts()` diretamente.

### BuscaPage

`BuscaPage` agora cria um `FeedContext` com:

- Territory resolvido da rota;
- `resolvedLocationIds`;
- `TerritoryFilter`;
- `requestSource: "search"`;
- `canonicalFeedUrl` derivado de `useAppUrls()`.

Esse contexto e entregue ao Search para permitir destino canonico apenas quando a rota territorial esta valida.

### Share legado

`postShare.ts` nao cai mais em `LAUNCH_URLS.community`. Caso seja chamado fora de rota territorial de comunidade, retorna vazio e falha fechado.

`useShareFeedItem()` passou a reutilizar o helper canonico do Feed, removendo regra duplicada e bloqueando bases incompletas como `/comunidade/ba`.

## Callers migrados

- `src/core/search/providers/searchProviders.ts`
  - antes: `searchPublicPosts()`;
  - agora: `FeedService.searchItems()`.

- `src/app/pages/BuscaPage.tsx`
  - antes: Search recebia apenas `TerritoryFilter`;
  - agora: Search recebe `TerritoryFilter` e `FeedContext`.

- `src/core/posts/utils/postShare.ts`
  - antes: fallback global em `LAUNCH_URLS.community`;
  - agora: falha fechado quando nao ha base territorial valida.

## Callers eliminados

- Nao ha mais caller publico de Search acessando `searchPublicPosts()` diretamente.
- Nao ha mais geracao de URL de post com `target_url: null` no provider de posts.
- Nao ha mais fallback global em `postShare.ts`.

## Aderencia a GOVERNANCE

Atendida.

- Search nao abre post fora do Territory resolvido.
- Deep-link de post preserva Territory.
- URL canonica e emitida apenas depois de validar contexto e alvo.
- `/p/:slug` continua fora do Feed e documentado como mini-site premium.
- Feed permanece como boundary publico para leitura de posts pela busca.
- Falha fechada foi mantida para contexto ausente, rollout bloqueado, policy bloqueada, target invalido, item oculto/removido e mismatch territorial.

## Cobertura de testes

Foram adicionados/ajustados testes para:

- URL canonica territorial valida;
- rejeicao de `/comunidade`;
- rejeicao de `/comunidade/ba`;
- `FeedService.resolveCanonicalUrl()`;
- `FeedService.searchItems()`;
- Search com `FeedContext` valido;
- Search sem `FeedContext` falhando fechado;
- provider de posts sem acesso direto a `searchPublicPosts()`;
- `useShareFeedItem()` com base incompleta;
- `FeedRepository.searchItems()` usando o colaborador interno.

## Validacao executada

```bash
npm run typecheck
```

Resultado: passou.

```bash
npm run lint
```

Resultado: passou sem erros. Permanecem 13 warnings pre-existentes de `maps/no-manual-entity-projection` em telas de mapa fora do escopo da Sprint.

```bash
npm run build
```

Resultado: passou.

```bash
npm run test -- src/core/feed src/core/search/services/__tests__/SearchService.spec.ts
```

Resultado: passou. 13 arquivos de teste, 188 testes.

## Riscos

- `FeedService.searchItems()` valida cada resultado encontrado gerando URL canonica via detalhe do Feed. Isso e mais seguro, mas pode aumentar custo de leitura em buscas com muitos posts. O limite atual permanece controlado por `domainLimit()`.
- Search de posts sem `FeedContext` agora retorna vazio. Esse e o comportamento esperado pela governanca, mas qualquer caller futuro de Search precisa fornecer contexto territorial para exibir posts.

## Rollback

Rollback tecnico minimo:

1. Reverter a migracao do provider de posts para `FeedService.searchItems()`.
2. Remover `feedContext` de `SearchFilters` e de `BuscaPage`.
3. Remover `FeedService.resolveCanonicalUrl()` / `FeedService.searchItems()` e os contratos do `FeedRepository`.

Mesmo em rollback, nao reintroduzir fallback global para `LAUNCH_URLS.community` nem `/p/:slug` como rota de detalhe do Feed. Se necessario, manter posts da busca sem navegacao ate a URL canonica ser restaurada.

## Compatibilidade

- Links territoriais existentes com `?post=<id>` continuam funcionando.
- `/p/:slug` permanece reservado ao mini-site premium de empresas.
- Search continua federado para demais buckets sem exigir `FeedContext`.
- Apenas resultados de post exigem FeedContext valido.

## Observacoes fora do escopo

- `searchPublicPosts()` continua existindo em `core/posts` como query interna reutilizada pelo `FeedRepository`.
- Warnings de lint em mapas sao pre-existentes e nao pertencem ao dominio Feed.
