# FEED.P0.C - Implementation Report

Data: 2026-07-25

## Escopo

Sprint implementada seguindo:

- `docs/feed/FEED-GOVERNANCE.md`
- `docs/feed/FEED-ROADMAP.md`
- `docs/feed/FEED-EXECUTION-PLAN.md`

Objetivo da P0.C: toda criacao publica de post deve passar pelo Feed Service usando `ResolvedTerritory`, `TerritoryFilter`, `Rollout` e `AccessPolicy`, sem fallback silencioso para o bairro do perfil quando houver Territory resolvido pela rota.

Nao foram implementadas tarefas de P0.D/P0.E ou superiores: comentarios, reacoes, saves, share, busca, mobility, realtime e moderacao permaneceram fora do escopo.

## Arquivos Alterados

### Dominio Feed

- `src/core/feed/types.ts`
- `src/core/feed/index.ts`
- `src/core/feed/services/FeedService.ts`
- `src/core/feed/repositories/FeedRepository.ts`
- `src/core/feed/hooks/useFeedContext.ts`
- `src/core/feed/hooks/useCreateFeedItem.ts`
- `src/core/feed/__tests__/FeedService.spec.ts`
- `src/core/feed/__tests__/FeedRepository.spec.ts`
- `src/core/feed/__tests__/useFeedContext.spec.tsx`
- `src/core/feed/__tests__/useFeedTimeline.spec.tsx`
- `src/core/feed/__tests__/useFeedItemDetail.spec.tsx`

### Callers publicos de criacao

- `src/core/community/components/composer/CreatePostModal.tsx`
- `src/core/community/components/composer/UnifiedComposer.tsx`
- `src/core/community/hooks/composer/useCreatePost.ts`
- `src/core/community/pages/ComunidadePage.tsx`
- `src/core/community/pages/NovoPostPage.tsx`
- `src/app/pages/CidadeLandingPage.tsx`

### Testes/hardening afetados

- `src/core/community/access/__tests__/CommunitySocialProductionHardening.spec.ts`
- `src/core/community/hooks/__tests__/usePostById.feed.spec.tsx`

## Responsabilidades Migradas

### Feed Service

Adicionado `FeedService.createItem(input)`.

Responsabilidades assumidas:

- validar `FeedContext` antes da mutation;
- bloquear criacao sem `ResolvedTerritory`;
- bloquear criacao sem `TerritoryFilter` resolvido;
- bloquear mismatch entre `TerritoryFilter` e `ResolvedTerritory`;
- bloquear rollout pendente, desconhecido, inativo ou bloqueado;
- bloquear AccessPolicy pendente/desconhecida;
- exigir `accessPolicyDecision.canCreateItem === true`;
- validar `targetLocationId` contra o Territory resolvido;
- rejeitar target fora do bairro/grupo ativo;
- exigir target explicito quando o Territory for grupo com multiplos bairros e nenhum alvo puder ser derivado com seguranca.

### Feed Repository

Adicionado `FeedRepository.createItem(input)`.

Responsabilidade:

- manter `postService.createPost()` e `postService.createPostWithImages()` como dependencia interna do repository, nunca como API de criacao publica;
- receber `locationId` ja validado pelo Feed Service;
- preservar upload de imagens existente atras do boundary do Feed.

### Feed Context

Adicionado `FeedPolicyDecision.canCreateItem`.

Regras:

- `useFeedContext` deriva `canCreateItem` de `useCommunityAccess().can.create_post`;
- estados `unknown` e `pending` continuam fechados por padrao;
- nenhum default permissivo foi introduzido.

## Callers Removidos

Removidos caminhos publicos de criacao direta:

- `CreatePostModal` nao chama mais `postService.createPostWithImages()`;
- `useCreatePost` nao chama mais `PostsFacade.mutations.createPost()`;
- o fallback para `activeProfile.locationId` foi removido do hook legado;
- o modal nao usa mais `useTerritoryFilter()` nem bairro do perfil para definir `location_id`.

Observacao de escopo:

- `CreatePostModal` ainda chama `postService.updatePost()` somente para edicao existente. Edicao nao faz parte da P0.C e nao foi migrada.

## Integracao Com Rotas Publicas

### `/novo-post`

Comportamento implementado:

- usa `useTerritorialContextOptional`;
- monta `FeedContext` com `ResolvedTerritory`, `resolvedLocationIds`, `TerritoryFilter`, Rollout e AccessPolicy;
- passa `feedContext` e `targetLocationId` para `CreatePostModal`;
- sem Territory resolvido, redireciona para `/onboarding?redirect=...`;
- nao usa bairro do perfil como fallback.

### Modal de criacao na Comunidade

Comportamento implementado:

- recebe o `FeedContext` ja derivado da pagina;
- usa `resolveCommunityRouteDefaultLocationId()` para alvo derivado da rota;
- publica via `useCreateFeedItem`;
- respeita AccessPolicy e Rollout pelo Feed Service.

### Modal de criacao na Territory Home / Landing territorial

Comportamento implementado:

- cria `FeedContext` a partir do Territory ativo da pagina;
- passa o target derivado do Territory resolvido;
- mantem UX atual, mas sem bypass de criacao.

### UnifiedComposer

Comportamento implementado:

- aceita `feedContext` e `targetLocationId`;
- quando abrir modal diretamente, tambem passa pelo Feed boundary;
- nao havia caller ativo encontrado para `UnifiedComposer`, mas a superficie foi compatibilizada.

## Aderencia A GOVERNANCE

- Criacao publica passa por `FeedService.createItem`.
- Criacao exige `ResolvedTerritory`.
- Criacao exige `TerritoryFilter`.
- Criacao exige Rollout resolvido e ativo.
- Criacao exige AccessPolicy resolvida e com `canCreateItem`.
- Nenhum componente publico cria post diretamente por `PostService`.
- Nenhum hook publico cria post diretamente por `PostsFacade`.
- Nenhuma criacao publica usa slug manual.
- Nenhuma criacao publica usa fallback silencioso para bairro do perfil.
- `postService` permanece permitido apenas como dependencia interna do repository para a mutation de criacao.

## Validacoes Obrigatorias

1. Toda criacao passa pelo FeedService.

Status: atendido.

Evidencia: `CreatePostModal` e `useCreatePost` usam `useCreateFeedItem`, que chama `FeedService.createItem`.

2. Nenhum componente publico cria posts diretamente pelo PostService.

Status: atendido.

Evidencia: varredura nao encontrou `postService.createPost*` em componentes/pages/hooks publicos, apenas em teste estatico e no `FeedRepository`.

3. `/novo-post` respeita o Territory da rota.

Status: atendido dentro da capacidade atual da rota.

Evidencia: a pagina usa `useTerritorialContextOptional`; quando nao existe Territory resolvido, redireciona para onboarding oficial em vez de usar fallback de perfil.

4. O modal de criacao respeita o Territory ativo.

Status: atendido.

Evidencia: callers passam `feedContext` e `targetLocationId` derivados do Territory resolvido.

5. AccessPolicy e validada antes da criacao.

Status: atendido.

Evidencia: `FeedService.createItem` bloqueia quando `canCreateItem` nao e `true`.

6. Rollout e validado antes da criacao.

Status: atendido.

Evidencia: `validateFeedContext` e chamado antes de `repository.createItem`.

7. Sem Territory resolvido a criacao falha fechado ou redireciona.

Status: atendido.

Evidencia: `FeedService.createItem` retorna `context_invalid`; `/novo-post` redireciona para onboarding.

8. Nao existe fallback para bairro do perfil quando houver Territory na URL.

Status: atendido.

Evidencia: removido `activeProfile.locationId` e removido `profile.locationId` como fonte de `location_id` para criacao publica.

9. Contratos publicos permanecem compativeis.

Status: atendido.

Evidencia: `CreatePostModal` e `useCreatePost` receberam props/opcoes opcionais; callers antigos sem contexto falham fechado em vez de publicar incorretamente.

## Testes Executados

- `npm run test -- src/core/feed`
  - Resultado: passou
  - Cobertura executada: 6 arquivos, 38 testes

- `npm run test -- src/core/feed src/core/community/components/composer src/core/community/hooks/composer src/core/community/hooks/__tests__/usePostById.feed.spec.tsx src/core/community/access/__tests__/CommunitySocialProductionHardening.spec.ts`
  - Resultado: passou
  - Cobertura executada: 10 arquivos, 73 testes

- `npm run typecheck`
  - Resultado: passou

- `npm run lint`
  - Resultado: passou com 0 erros
  - Observacao: 13 warnings pre-existentes de `maps/no-manual-entity-projection` em paginas de mapa/home/onboarding, fora do escopo da P0.C.

- `npm run build`
  - Resultado: passou

## Riscos

- Edicao de post ainda usa `postService.updatePost()` no modal. Mantido fora do escopo porque P0.C trata exclusivamente criacao.
- `UnifiedComposer` nao possui caller ativo encontrado; foi compatibilizado, mas o comportamento real depende do caller futuro passar `FeedContext`.
- Em TerritoryGroup com multiplos bairros, o caller precisa fornecer `targetLocationId` derivado do Territory oficial. O Feed Service bloqueia caso o alvo nao exista ou seja invalido.
- `/novo-post` global sem Territory resolvido agora envia para onboarding. Isso e intencional para evitar fallback de perfil.

## Rollback

Rollback tecnico da P0.C:

1. Remover `FeedService.createItem`, `FeedRepository.createItem`, `useCreateFeedItem` e tipos `FeedCreateItem*`.
2. Reverter `CreatePostModal` para o fluxo anterior de criacao direta.
3. Reverter `useCreatePost` para a mutation anterior.
4. Remover props `feedContext` e `targetLocationId` dos callers.
5. Reverter testes adicionados/alterados da P0.C.

Impacto do rollback:

- restauraria o comportamento anterior de criacao;
- reabriria o risco de fallback por perfil;
- reabriria bypass ao Feed Service para criacao;
- nao afetaria P0.A/P0.B se revertido apenas nos arquivos da P0.C listados neste relatorio.

## Observacoes Fora Do Escopo

- O worktree ja contem muitas alteracoes nao relacionadas a esta sprint. Este relatorio lista apenas os arquivos alterados para P0.C.
- Os warnings de lint em mapas/home/onboarding nao pertencem ao dominio Feed.
- Comentarios, reacoes, saves, share action minimo e hardening final continuam nas sprints posteriores definidas no roadmap.

## Resultado

A Sprint FEED.P0.C atende aos criterios definidos pela governanca e esta pronta para review.
