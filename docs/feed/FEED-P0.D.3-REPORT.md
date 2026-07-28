# FEED-P0.D.3-REPORT.md

Data: 2026-07-27

Sprint: FEED.P0.D.3

Status: pronta para review

## 1. Escopo implementado

Implementada exclusivamente a sprint P0.D.3: compartilhamento publico de item de Feed passa pelo boundary do Feed antes de gerar link, acionar Web Share/clipboard ou registrar evento de share.

Nao foram implementados:

- comentarios;
- replies;
- reacoes;
- saves;
- realtime;
- notificacoes;
- moderacao;
- edicao;
- exclusao;
- URL canonica completa de P1.B;
- busca;
- deep-link canonicalization adicional.

## 2. Arquivos alterados

- `src/core/feed/types.ts`
- `src/core/feed/services/FeedService.ts`
- `src/core/feed/repositories/FeedRepository.ts`
- `src/core/feed/queryKeys.ts`
- `src/core/feed/index.ts`
- `src/core/feed/hooks/useShareFeedItem.ts`
- `src/core/feed/__tests__/FeedService.spec.ts`
- `src/core/feed/__tests__/FeedRepository.spec.ts`
- `src/core/feed/__tests__/queryKeys.spec.ts`
- `src/core/feed/__tests__/useShareFeedItem.spec.tsx`
- `src/core/posts/hooks/usePostActions.ts`
- `src/core/community/hooks/posts/usePostInteractions.ts`
- `src/core/community/components/page/CommunityOverviewSurface.tsx`

## 3. Responsabilidades migradas

### FeedService

Adicionado:

- `FeedService.shareItem()`

A operacao valida antes:

- `FeedContext`;
- `FeedTarget`;
- `ResolvedTerritory`;
- `TerritoryFilter`;
- Rollout;
- `CommunityAccessPolicy` para visualizar o alvo;
- detalhe territorial do item;
- visibilidade publica do item.

`shareItem()` reutiliza o caminho consolidado de validacao de alvo do Feed. Se o contexto ou alvo falhar, a operacao retorna status fechado e nao chama o repository.

### FeedRepository

Adicionado:

- `FeedRepository.shareItem()`

O repository:

- gera o payload de share somente a partir de `basePath` territorial ou `canonicalFeedUrl` do `FeedContext`;
- nao usa `LAUNCH_URLS.community`;
- nao gera fallback global nominal;
- encapsula `postService.recordPostShare()` como colaborador interno opcional;
- nao bloqueia o share quando o registro de evento falha.

### Feed hook

Adicionado:

- `useShareFeedItem()`

O hook:

- chama `FeedService.shareItem()` antes de Web Share/clipboard;
- falha fechado quando o Feed retorna contexto ou alvo invalido;
- nao reapresenta dado antigo, pois nao le cache e nao aciona navegador sem resultado `ready`;
- registra o evento de share via Feed somente depois de share de navegador bem-sucedido;
- invalida chaves territoriais de share e detalhe apos sucesso.

## 4. Callers removidos

Foram removidos acessos diretos de UI publica de Feed a `sharePost()` / `postService.recordPostShare()` em:

- `src/core/posts/hooks/usePostActions.ts`
- `src/core/community/hooks/posts/usePostInteractions.ts`
- `src/core/community/components/page/CommunityOverviewSurface.tsx`

Esses fluxos agora chamam:

- `useShareFeedItem()`
- `FeedService.shareItem()`

Varredura realizada:

```text
rg -n 'from "@/core/posts/utils/postShare"|postService\.recordPostShare' src/core/community src/core/posts src/modules/profile src/modules/mobility
```

Resultado: nenhum caller publico de Feed restante.

Observacao: `src/core/posts/utils/postShare.ts` permanece como arquivo legado, mas nao e mais importado pelos fluxos publicos de post auditados nesta sprint.

## 5. Cache e falha fechada

Share nao possui query de leitura propria, portanto nao existe dado de share a reapresentar.

Mesmo assim, `useShareFeedItem()` foi testado para garantir que:

- quando o `FeedService` retorna `context_invalid`, o hook nao chama `navigator.share`;
- nao ha invalidacao de cache em falha fechada;
- sucesso invalida apenas chaves territoriais:
  - `feedQueryKeys.share(territoryFilter, target)`
  - `feedQueryKeys.detail(territoryFilter, target)`

## 6. Aderencia a GOVERNANCE

Resultado: aderente para o escopo P0.D.3.

- Existe boundary publico unico para share de item de Feed: `FeedService.shareItem()`.
- UI publica nao chama `PostService` nem util de share de Posts para item de Feed.
- `FeedRepository` e o ponto interno que pode registrar `post_share_events`.
- Share sem `FeedContext` falha fechado.
- Share cross-territory falha fechado.
- Share de item oculto/removido falha fechado.
- Share sem base territorial nao usa fallback global.
- URL canonica completa permanece fora do escopo e continua prevista para P1.B.

## 7. Cobertura de testes

Executado:

- `npm run test -- src/core/feed` - passou: 12 arquivos, 127 testes.

Cobertura adicionada:

- `FeedService.shareItem()` com sucesso apos validacao;
- `FeedService.shareItem()` com `FeedContext` invalido;
- `FeedService.shareItem()` com Rollout bloqueado;
- `FeedService.shareItem()` com AccessPolicy bloqueada;
- `FeedService.shareItem()` com `FeedTarget` invalido;
- `FeedService.shareItem()` com item removido;
- `FeedService.shareItem()` com item oculto;
- `FeedService.shareItem()` com mismatch territorial;
- `FeedService.shareItem()` sem base territorial;
- `FeedRepository.shareItem()` gerando URL territorial sem fallback global;
- `FeedRepository.shareItem()` usando `canonicalFeedUrl`;
- `FeedRepository.shareItem()` falhando fechado sem base territorial;
- `FeedRepository.shareItem()` registrando share via colaborador interno;
- `feedQueryKeys.share()`;
- `useShareFeedItem()` validando pelo Feed antes de Web Share;
- `useShareFeedItem()` nao compartilhando dado antigo quando Feed falha fechado;
- `useShareFeedItem()` nao registrando evento quando o share nativo e cancelado;
- `useShareFeedItem()` registrando evento apos share bem-sucedido;
- `useShareFeedItem()` invalidando chaves territoriais apos sucesso.

## 8. Validacao obrigatoria

Executado:

- `npm run typecheck` - passou.
- `npm run lint` - passou com 13 warnings preexistentes de mapa fora do escopo.
- `npm run build` - passou.
- `npm run test -- src/core/feed` - passou.

Warnings fora do escopo:

- `src/app/pages/AchegueSeHomePage.tsx`
- `src/app/pages/AchegueSeHomePageMap.tsx`
- `src/app/pages/OnboardingPage.tsx`
- `src/app/pages/PreLaunchTerritoryMap.tsx`

Os warnings sao da regra `maps/no-manual-entity-projection` e nao envolvem Feed, share ou P0.D.3.

## 9. Compatibilidade

Preservado:

- Web Share API quando disponivel;
- fallback para clipboard;
- fallback final via toast informativo;
- cancelamento nativo sem erro para o usuario;
- share de item valido em rota territorial;
- registro de share para usuario/perfil quando aplicavel.

Mudanca intencional:

- share sem `FeedContext` nao usa fallback global e passa a falhar fechado;
- share fora de rota territorial sem `canonicalFeedUrl` nao gera link;
- Profile sem handoff territorial nao compartilha post diretamente, preservando a regra de que abertura/acao social deve passar pelo Feed.

## 10. Riscos

Risco principal: superficies privadas de Profile que ainda chamam `usePostActions()` sem `FeedContext` deixam de compartilhar diretamente. Isso e coerente com a governanca, mas pode exigir handoff territorial em sprint futura de Profile/Feed Routing.

Risco secundario: `postShare.ts` continua existindo como util legado. A sprint removeu callers publicos de Feed, mas o arquivo deve ser removido ou rebaixado em P1.B quando URL canonica for consolidada.

Riscos fora do escopo:

- shares de empresas, classificados, turismo, profissionais e Safety Ride Share pertencem aos seus dominios e nao sao share de item de Feed;
- URL canonica completa de share permanece em P1.B;
- share de busca/notificacao permanece em P1.B/P1+.

## 11. Rollback

Rollback seguro:

1. Reverter a migracao dos callers para `useShareFeedItem()` somente se houver regressao critica.
2. Manter bloqueio territorial como guarda minima.
3. Nao reintroduzir `LAUNCH_URLS.community` como fallback de share de post.
4. Nao reintroduzir chamada publica a `postService.recordPostShare()`.
5. Se necessario, desabilitar temporariamente o botao de share quando `FeedContext` estiver ausente.

Rollback nao pode restaurar:

- `sharePost({ postId })` em UI publica de Feed;
- `postService.recordPostShare(postId)` em UI publica;
- share por `post_id` sem alvo validado pelo Feed;
- fallback global nominal.

## 12. Observacoes fora do escopo

- `src/core/posts/utils/postShare.ts` ainda existe como residuo legado, sem caller publico de Feed identificado nesta sprint.
- `SafetyRideShareService` aparece em buscas por "ShareService", mas pertence ao dominio Safety/Mobility e nao ao compartilhamento de item de Feed.
- Community group share, Business share, Classified share e Tourist Point share nao foram alterados porque nao compartilham `FeedTarget`.

## 13. Conclusao

A Sprint FEED.P0.D.3 implementou o boundary minimo de compartilhamento por Feed, removeu fallback global nos callers publicos de item de Feed e completou a cobertura obrigatoria para falha fechada.

Status final: A Sprint FEED.P0.D.3 esta pronta para review.
