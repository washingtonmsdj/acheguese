# FEED-EXECUTION-PLAN.md

Sprint: FEED.EXECUTION.PLAN.1

Status: plano tecnico de execucao antes de implementacao

Base obrigatoria:

- `docs/feed/FEED-GOVERNANCE.md`
- `docs/feed/FEED-ROADMAP.md`

Regra de escopo: este documento nao implementa codigo, nao altera banco, nao cria migrations, nao cria componentes e nao muda a governanca ou prioridades. Ele define como executar tecnicamente as sprints ja aprovadas no roadmap.

## 1. Premissas de execucao

1. Nenhuma sprint pode pular a arquitetura oficial: Pages -> Feed Hooks -> Feed Service -> Feed Repository -> Supabase.
2. Nenhuma operacao publica nova pode chamar Posts, Comments, Engagement, Media, Moderation ou Supabase diretamente.
3. Toda migracao deve ser incremental: criar caminho novo, cobrir com teste, migrar caller, manter rollback local, remover caminho antigo apenas quando a cobertura provar equivalencia.
4. Nenhuma sprint deste plano requer migration ou alteracao de schema. Se uma execucao descobrir necessidade de banco, a sprint deve parar e gerar nova decisao.
5. Todo teste de isolamento deve cobrir pelo menos: item do mesmo bairro, item de outro bairro, cidade, TerritoryGroup e contexto ausente.

## 2. Plano por sprint

### Sprint P0.A - Boundary minimo do Feed

Objetivo tecnico: criar o boundary minimo do dominio Feed, introduzindo `FeedContext`, Feed Service, Feed Repository e hooks publicos sem migrar todos os fluxos de uma vez.

Arquivos previstos:

- `src/core/feed/index.ts`
- `src/core/feed/types.ts`
- `src/core/feed/services/FeedService.ts`
- `src/core/feed/repositories/FeedRepository.ts`
- `src/core/feed/hooks/useFeedContext.ts`
- `src/core/feed/hooks/useFeedTimeline.ts`
- `src/core/feed/queryKeys.ts`
- adapters internos para `src/core/posts/services/*`
- testes em `src/core/feed/**/__tests__/*`

Ordem exata das alteracoes:

1. Criar tipos internos `FeedContext`, `FeedItem`, `FeedTarget`, `FeedVisibility` e `FeedPolicyDecision`.
2. Criar helper de validacao de contexto que falha fechado sem `ResolvedTerritory` e `TerritoryFilter`.
3. Criar `FeedRepository` como wrapper inicial sobre queries existentes de posts.
4. Criar `FeedService.listTimeline` como primeira operacao publica.
5. Criar query keys territoriais derivadas de `TerritoryFilter`.
6. Criar `useFeedContext` para compor Territory, Rollout e AccessPolicy.
7. Criar `useFeedTimeline` chamando `FeedService.listTimeline`.
8. Migrar somente o caminho nominal da timeline para validar o boundary, sem mudar detalhe, composer ou actions.
9. Adicionar testes unitarios de falha fechada e isolamento basico.
10. Executar typecheck/lint/testes focados antes de avançar.

Contratos afetados:

- `FeedContext`
- `FeedItem`
- `FeedTarget`
- `FeedPolicyDecision`
- `TerritoryFilter`
- query key de Feed

Servicos afetados:

- Novo `FeedService`
- Novo adapter interno para `PostService`
- `CommunityRolloutService` apenas como dependencia de leitura
- `CommunityAccessPolicy` apenas como dependencia de decisao

Hooks afetados:

- Novo `useFeedContext`
- Novo `useFeedTimeline`
- `useCommunityFeedSimple` como caller a ser envolvido ou substituido incrementalmente

Repositories afetados:

- Novo `FeedRepository`
- Queries existentes de posts usadas apenas por adapter interno

Componentes afetados:

- `CommunityFeed` somente no consumo da timeline
- `TerritoryFeedHeader` sem mudanca visual esperada
- `UnifiedFeedWithMessages` sem mudanca visual esperada

Paginas afetadas:

- `ComunidadePage`
- `TerritoryFeedPage` como alias de superficie

Criterios de rollback:

- Reverter `CommunityFeed` para `useCommunityFeedSimple`.
- Manter novos arquivos inativos se typecheck permitir.
- Nunca reativar consulta sem territorio se a nova guarda ja tiver identificado contexto ausente.

Criterios de aceite:

- Timeline nominal continua carregando.
- Sem `TerritoryFilter`, a timeline nao consulta dados.
- Query key inclui escopo territorial.
- Nenhum componente novo consulta Supabase.
- Testes provam falha fechada para contexto ausente.

Riscos tecnicos:

- Divergencia entre shape atual de posts e `FeedItem`.
- Duplicacao temporaria entre `useCommunityFeedSimple` e `useFeedTimeline`.
- Invalidacao de cache incorreta por mudanca de query key.

Estrategia de testes:

- Testes unitarios de `FeedContext` valido/invalido.
- Testes de `FeedService.listTimeline` com bairro, cidade e grupo.
- Teste de query key para garantir isolamento por `TerritoryFilter`.
- Smoke visual manual da timeline principal.

Estrategia de migracao incremental:

- Introduzir o boundary em paralelo.
- Migrar primeiro apenas timeline.
- Manter adapters sobre services atuais ate as sprints seguintes.

Estrategia de compatibilidade:

- Preservar resposta visual da timeline.
- Preservar cursor/paginacao existentes.
- Preservar Empty State atual quando nao houver resultado.

Estrategia para evitar regressoes:

- Nao migrar composer/actions nesta sprint.
- Travar chamada sem contexto no service, nao no componente.
- Auditar imports para garantir que UI nao use repository.

### Sprint P0.B - Detalhe territorial e deep-link seguro

Objetivo tecnico: migrar detalhe/modal/deep-link de item para `FeedService.getDetail`, validando que o item pertence ao Territory atual antes de renderizar.

Arquivos previstos:

- `src/core/feed/services/FeedService.ts`
- `src/core/feed/repositories/FeedRepository.ts`
- `src/core/feed/hooks/useFeedItemDetail.ts`
- `src/core/community/hooks/usePostById.ts`
- `src/core/community/components/modals/PostDetailModal.tsx`
- `src/core/community/pages/ComunidadePage.tsx`
- testes de detalhe territorial

Ordem exata das alteracoes:

1. Adicionar `FeedService.getDetail(context, target)`.
2. Adicionar repository method que busca item por ID com validacao territorial.
3. Aplicar filtros de visibilidade no detalhe.
4. Criar hook `useFeedItemDetail`.
5. Migrar `usePostById` ou seu caller para usar o hook de Feed.
6. Atualizar `PostDetailModal` para receber resultado territorial.
7. Atualizar abertura por `?post=<id>` para falhar fechado quando o item nao pertencer ao Territory.
8. Testar item valido, item de outro bairro e item removido/oculto.

Contratos afetados:

- `FeedTarget`
- `FeedItemDetail`
- `FeedVisibility`
- `FeedContext`

Servicos afetados:

- `FeedService`
- `PostService` apenas como dependencia interna

Hooks afetados:

- Novo `useFeedItemDetail`
- `usePostById`
- hooks de modal em `useCommunityModals`

Repositories afetados:

- `FeedRepository`
- query atual `getPostById` apenas como referencia a ser encapsulada ou substituida

Componentes afetados:

- `PostDetailModal`
- `CommunityModals`
- componentes de card que abrem detalhe

Paginas afetadas:

- `ComunidadePage`
- rotas de comunidade que aceitam `?post=<id>`

Criterios de rollback:

- Reverter abertura do modal para caminho antigo somente para item no mesmo Territory.
- Manter bloqueio de item fora do Territory.
- Remover o novo hook do caller se houver regressao visual.

Criterios de aceite:

- Item do mesmo Territory abre.
- Item de outro Territory nao abre e mostra erro/empty controlado.
- Item oculto/removido nao abre como publico.
- `getPostById(id)` nao e usado diretamente por UI publica.

Riscos tecnicos:

- Links antigos sem base territorial podem deixar de abrir.
- Comentarios podem depender do detalhe antigo.
- O shape do detalhe pode divergir do card.

Estrategia de testes:

- Unitario de `getDetail` com Territory correto/incorreto.
- Integracao de `?post=<id>` em rota territorial.
- Teste de item oculto/removido.
- Regressao de abertura a partir do card.

Estrategia de migracao incremental:

- Migrar apenas leitura do detalhe.
- Manter comentarios e reacoes ainda no caminho antigo, mas recebendo o item validado como guarda.

Estrategia de compatibilidade:

- Preservar query param atual enquanto a URL canonica final nao for definida.
- Preservar modal e layout existentes.

Estrategia para evitar regressoes:

- Bloqueio de cross-territory no service.
- Testar deep-link antes de migrar share.
- Nao alterar `/p/:slug`.

### Sprint P0.C - Criacao territorial e rollout

Objetivo tecnico: fazer criacao de post entrar por `FeedService.createItem`, usando Territory da rota, rollout e AccessPolicy, sem fallback silencioso para bairro do perfil.

Arquivos previstos:

- `src/core/feed/services/FeedService.ts`
- `src/core/feed/hooks/useCreateFeedItem.ts`
- `src/core/community/pages/NovoPostPage.tsx`
- `src/core/community/components/composer/CreatePostModal.tsx`
- `src/core/community/components/composer/CreatePostModal.permissions.ts`
- hooks de composer em `src/core/community/hooks/composer/*`

Ordem exata das alteracoes:

1. Adicionar `FeedService.createItem(context, input)`.
2. Criar hook `useCreateFeedItem`.
3. Fazer `NovoPostPage` resolver/receber Territory antes de abrir composer.
4. Passar `FeedContext` para `CreatePostModal`.
5. Remover fallback silencioso para perfil quando houver Territory de rota.
6. Aplicar rollout antes da mutation.
7. Aplicar AccessPolicy antes da mutation.
8. Manter upload/midia pelo fluxo existente, chamado internamente apos validacao de Feed.
9. Testar criacao em bairro ativo, bairro bloqueado, contexto ausente e perfil sem permissao.

Contratos afetados:

- `FeedCreateItemInput`
- `FeedContext`
- `FeedPolicyDecision`
- `CreatePostModal` props

Servicos afetados:

- `FeedService`
- `postService.createPostWithImages` como dependencia interna
- `CommunityRolloutService`
- `CommunityAccessPolicy`

Hooks afetados:

- Novo `useCreateFeedItem`
- hooks de composer
- hooks de Territory usados por `NovoPostPage`

Repositories afetados:

- `FeedRepository`
- adapter de criacao para Posts/Media

Componentes afetados:

- `CreatePostModal`
- `CommunityComposerEntry`
- botao/CTA de criar post quando presente

Paginas afetadas:

- `NovoPostPage`
- `ComunidadePage` quando abre modal de criacao

Criterios de rollback:

- Reverter caller do modal para criacao antiga apenas dentro de rota territorial validada.
- Manter bloqueio para contexto ausente.
- Desativar `/novo-post` sem contexto se necessario.

Criterios de aceite:

- Criacao em Territory correto.
- Criacao sem Territory falha fechado.
- Rollout de bairro bloqueia criacao mesmo se cidade estiver ativa.
- Usuario sem permissao nao cria.

Riscos tecnicos:

- `/novo-post` pode depender de contexto global atual.
- Composer pode assumir `location_id` antes de policy.
- Fluxo de midia pode acoplar validacao e upload.

Estrategia de testes:

- Teste unitario de policy de criacao.
- Teste de composer com Territory valido.
- Teste de contexto ausente.
- Teste de rollout bloqueado.

Estrategia de migracao incremental:

- Primeiro migrar criacao aberta de `ComunidadePage`.
- Depois migrar `/novo-post`.
- Manter payload de post igual ate validar compatibilidade.

Estrategia de compatibilidade:

- Preservar tipos de post atuais.
- Preservar rascunho/offline do composer.
- Preservar upload de imagens.

Estrategia para evitar regressoes:

- Validar contexto antes de tocar no estado do formulario.
- Nao alterar schema de post.
- Nao mudar UX visual nesta sprint.

### Sprint P0.D - Comentarios, respostas e reacoes por Feed Service

Objetivo tecnico: migrar comentarios, respostas, likes, saves, reactions e shares de action para alvos validados por Feed.

Arquivos previstos:

- `src/core/feed/services/FeedService.ts`
- `src/core/feed/hooks/useFeedComments.ts`
- `src/core/feed/hooks/useFeedActions.ts`
- `src/core/community/components/comments/PostCommentsPanel.tsx`
- `src/core/community/hooks/useComments.ts`
- `src/core/community/hooks/useCommentActions.ts`
- `src/core/posts/hooks/usePostActions.ts`
- `src/core/community/components/UnifiedPostCard/*`

Ordem exata das alteracoes:

1. Adicionar `FeedService.listComments`.
2. Adicionar `FeedService.createComment`.
3. Adicionar `FeedService.reactToTarget` e `removeReaction`.
4. Adicionar `FeedService.saveTarget` quando aplicavel.
5. Criar hooks `useFeedComments` e `useFeedActions`.
6. Migrar `PostCommentsPanel` para comentarios via Feed.
7. Migrar `usePostActions` para usar Feed actions quando houver `FeedContext`.
8. Ajustar invalidacao de query para escopo territorial.
9. Testar contadores, optimistic state, erro e rollback de mutation.

Contratos afetados:

- `FeedTarget`
- `FeedCommentInput`
- `FeedReactionInput`
- `FeedActionResult`
- query keys de Feed

Servicos afetados:

- `FeedService`
- `CommentService` como dependencia interna
- `PostEngagementService` como dependencia interna

Hooks afetados:

- Novo `useFeedComments`
- Novo `useFeedActions`
- `useComments`
- `useCommentActions`
- `usePostActions`

Repositories afetados:

- `FeedRepository`
- adapters para Comments e Engagement

Componentes afetados:

- `PostCommentsPanel`
- `CommentsList`
- `CommentItem`
- `UnifiedPostCard`
- `PostActions`

Paginas afetadas:

- `ComunidadePage`
- qualquer pagina que renderize card publico de Feed

Criterios de rollback:

- Reverter por acao: comentarios primeiro, depois reactions/saves.
- Manter detalhe territorial como guarda obrigatoria.
- Desativar optimistic update se gerar divergencia.

Criterios de aceite:

- Comentario em item de outro Territory bloqueado.
- Like/save em item de outro Territory bloqueado.
- Contadores permanecem consistentes apos sucesso/erro.
- Nenhum hook publico chama Comments/Engagement por ID puro.

Riscos tecnicos:

- Estados otimistas duplicados.
- Invalidation ampla recarregando feeds de outros Territories.
- Comentarios aninhados podem perder parent validation.

Estrategia de testes:

- Unitarios de `createComment` com alvo valido/invalido.
- Unitarios de `reactToTarget` com target fora do Territory.
- Testes de UI de comentarios com erro e retry.
- Testes de invalidacao por query key territorial.

Estrategia de migracao incremental:

- Dividir internamente em comentarios e engajamento.
- Migrar leitura antes de escrita.
- Migrar uma action por vez.

Estrategia de compatibilidade:

- Preservar UI e textos.
- Preservar formato de comentarios existente.
- Preservar contadores retornados pelos services atuais.

Estrategia para evitar regressoes:

- Nao alterar layout de cards.
- Manter adapters atomicos internos.
- Rodar testes de actions a cada submigracao.

### Sprint P0.E - Mobility sem vazamento territorial

Objetivo tecnico: impedir que Mobility consulte posts sociais globalmente por tipo e fazer o modulo usar Feed com contexto territorial.

Arquivos previstos:

- `src/modules/mobility/hooks/useCommunityPosts.ts`
- `src/modules/mobility/components/community/CommunityRideFeed.tsx`
- `src/modules/mobility/components/community/CommunityRidePost.tsx`
- `src/modules/mobility/components/MobilidadeFeed.tsx`
- `src/core/feed/services/FeedService.ts`

Ordem exata das alteracoes:

1. Identificar todos os callers de `useCommunityPosts`.
2. Adicionar entrada no Feed Service para listar itens `ride_share` por `FeedContext`.
3. Alterar `useCommunityPosts` para exigir contexto territorial.
4. Remover chamada global a `getPostsByType("ride_share")`.
5. Garantir Empty State quando contexto estiver ausente.
6. Testar bairro A, bairro B e cidade.

Contratos afetados:

- `FeedContext`
- filtro de tipo/intencao `ride_share`
- retorno de `CommunityPost`

Servicos afetados:

- `FeedService`
- `postService.getPostsByType` deixa de ser porta publica

Hooks afetados:

- `useCommunityPosts`
- hooks de Mobility que chamarem posts sociais

Repositories afetados:

- `FeedRepository`

Componentes afetados:

- `CommunityRideFeed`
- `CommunityRidePost`
- `MobilidadeFeed`

Paginas afetadas:

- superficies publicas de mobilidade com feed comunitario

Criterios de rollback:

- Reverter componentes de Mobility, mas manter guarda que impede query global sem Territory.
- Retornar empty state em vez de consultar globalmente.

Criterios de aceite:

- Post de carona de outro bairro nao aparece.
- Sem Territory, Mobility nao consulta posts.
- Com Territory valido, posts `ride_share` do escopo aparecem.

Riscos tecnicos:

- Mobility pode nao receber Territory em alguma rota.
- Empty State pode crescer se caller nao passar contexto.

Estrategia de testes:

- Unitario de hook com contexto valido/ausente.
- Teste de query com `ride_share` em bairros distintos.
- Smoke de tela de mobilidade.

Estrategia de migracao incremental:

- Migrar apenas leitura primeiro.
- Manter criacao com `location_id` ate passar por Feed em sprint posterior se necessario.

Estrategia de compatibilidade:

- Preservar shape `CommunityPost`.
- Preservar cards de carona.

Estrategia para evitar regressoes:

- Falha fechada no hook.
- Teste especifico para nao chamar `getPostsByType` sem `location_id`.

### Sprint P1.A - Consolidacao do SSOT e mutations publicas

Objetivo tecnico: remover callers publicos restantes que usam Posts/Comments/Engagement por ID puro e consolidar mutations publicas no Feed Service.

Arquivos previstos:

- `src/core/community/hooks/posts/useUpdatePost.ts`
- `src/core/community/hooks/posts/useDeletePost.ts`
- `src/core/community/components/cards/PostCard.tsx`
- `src/core/community/components/PostCard.tsx`
- `src/core/posts/components/PostCard.tsx`
- `src/core/community/components/UnifiedPostCard/*`
- `src/core/feed/services/FeedService.ts`
- `src/core/feed/hooks/*`

Ordem exata das alteracoes:

1. Rodar busca estatica por operacoes proibidas.
2. Classificar callers publicos e internos.
3. Migrar edicao para `FeedService.updateItem`.
4. Migrar exclusao/ocultacao para `FeedService.deleteItem` ou `hideItem`.
5. Migrar cards legados para action props vindas do Feed.
6. Marcar APIs atomicas como internas quando ainda necessarias.
7. Remover exports publicos indevidos.
8. Rodar auditoria estatica novamente.

Contratos afetados:

- `FeedUpdateItemInput`
- `FeedDeleteItemInput`
- props de action dos cards

Servicos afetados:

- `FeedService`
- `PostService`
- `CommentService`
- `PostEngagementService`

Hooks afetados:

- `useUpdatePost`
- `useDeletePost`
- `usePostActions`
- hooks de cards legados

Repositories afetados:

- `FeedRepository`
- adapters internos para mutations de Posts

Componentes afetados:

- cards legados
- `UnifiedPostCard`
- menus de post

Paginas afetadas:

- paginas que usam cards legados
- `ComunidadePage`

Criterios de rollback:

- Reverter por operacao, nao a sprint inteira.
- Manter P0 de isolamento.
- Restaurar export atomico temporariamente apenas se caller interno quebrar.

Criterios de aceite:

- Auditoria estatica nao encontra operacao publica proibida.
- Edicao/exclusao valida continuam funcionando.
- Usuario sem permissao nao altera item.

Riscos tecnicos:

- Grande quantidade de callers legados.
- Props de cards divergentes.
- Dificuldade de separar caller publico de interno.

Estrategia de testes:

- Busca estatica automatizada por nomes proibidos.
- Testes de edicao/exclusao por autor, moderador e usuario sem permissao.
- Smoke dos cards ainda usados.

Estrategia de migracao incremental:

- Dividir por operacao se necessario: edicao, exclusao, cards, hooks.
- Migrar um caller por vez.

Estrategia de compatibilidade:

- Preservar nomes de handlers nos componentes quando possivel.
- Manter adapters internos ate remocao completa.

Estrategia para evitar regressoes:

- Criar lista de imports proibidos.
- Validar cada card migrado com smoke visual.

### Sprint P1.B - URL canonica, share e busca

Objetivo tecnico: fazer deep-link, compartilhamento e resultado de busca usarem URL territorial canonica de Feed sem fallback global.

Arquivos previstos:

- `src/core/posts/utils/postShare.ts`
- builders/hooks de routing territorial
- `src/core/search/services/SearchDocumentMapper.ts`
- `src/core/search/providers/searchProviders.ts`
- `src/app/pages/BuscaPage.tsx`
- `docs/SCREEN-MAP.md`
- `docs/FEATURE-MAP.md`

Ordem exata das alteracoes:

1. Definir builder de URL de item de Feed sobre base territorial existente.
2. Atualizar `FeedService.createShareLink`.
3. Migrar `postShare` para exigir base territorial ou link gerado pelo Feed.
4. Remover fallback para `LAUNCH_URLS.community` no caminho nominal.
5. Atualizar mapper de Search para preencher URL canonica quando houver Territory.
6. Garantir que resultado sem Territory falhe fechado ou nao navegue.
7. Atualizar docs de rota para nao usar `/p/:slug` como post.

Contratos afetados:

- `canonicalFeedUrl`
- `FeedShareLink`
- `SearchDocument.target_url`

Servicos afetados:

- `FeedService`
- Search providers/mappers
- util de share

Hooks afetados:

- hooks de post actions que chamam share
- hooks de busca apenas se precisarem passar contexto

Repositories afetados:

- Nenhum novo repository esperado

Componentes afetados:

- botoes de share nos cards
- cards de resultado de busca

Paginas afetadas:

- `BuscaPage`
- `ComunidadePage`
- rotas territoriais de comunidade

Criterios de rollback:

- Reverter target_url de busca para nulo.
- Manter share bloqueado sem fallback global.
- Nao voltar a usar `/p/:slug` para Feed.

Criterios de aceite:

- Share em rota territorial gera link territorial.
- Share fora de contexto nao usa fallback global.
- Resultado de busca de post navega para item territorial valido.
- Docs nao contradizem rota real.

Riscos tecnicos:

- Links antigos sem Territory.
- Duplicidade com rota premium `/p/:slug`.
- Search provider pode nao ter contexto suficiente para montar URL.

Estrategia de testes:

- Unitario do builder de URL.
- Teste de share em rota territorial e fora dela.
- Teste de SearchDocument com target_url.
- Teste de abertura do link gerado.

Estrategia de migracao incremental:

- Primeiro criar builder.
- Depois migrar share.
- Por ultimo migrar search e docs.

Estrategia de compatibilidade:

- Manter query param atual se a base for territorial.
- Links sem Territory recebem fallback controlado, nao global.

Estrategia para evitar regressoes:

- Teste que falha se `LAUNCH_URLS.community` voltar ao share nominal.
- Teste que `/p/:slug` permanece premium business.

### Sprint P1.C - Moderacao territorial

Objetivo tecnico: fazer denuncia e moderacao de Feed receberem contexto territorial validado pelo Feed Service.

Arquivos previstos:

- `src/core/feed/services/FeedService.ts`
- `src/core/community/hooks/useModeration.ts`
- `src/core/community/moderation/CommunityReportService.ts`
- `src/core/community/moderation/CommunityContentModerationService.ts`
- componentes de report dialog
- filas/painel quando consumirem denuncias de Feed

Ordem exata das alteracoes:

1. Adicionar `FeedService.reportTarget`.
2. Validar target pelo detalhe territorial antes da denuncia.
3. Incluir contexto territorial no payload de denuncia quando suportado.
4. Adaptar `useModeration` para chamar Feed Service.
5. Ajustar dialog de denuncia para lidar com bloqueio territorial.
6. Ajustar fila para exibir/filtrar contexto quando disponivel.
7. Testar denuncia de target valido/invalido.

Contratos afetados:

- `FeedReportTargetInput`
- payload de denuncia de Feed
- `FeedTarget`

Servicos afetados:

- `FeedService`
- `CommunityReportService`
- services de moderation queue

Hooks afetados:

- `useModeration`
- hooks de report dialog

Repositories afetados:

- `FeedRepository` para validar alvo
- repositorios/queries de moderation se existentes

Componentes afetados:

- report dialog
- menus de denuncia
- filas de moderacao

Paginas afetadas:

- superficies de comunidade
- admin/moderation quando aplicavel

Criterios de rollback:

- Preservar fila global legada para historico.
- Reverter UI de fila sem remover validacao do alvo no Feed.

Criterios de aceite:

- Denuncia nova de Feed contem Territory validado.
- Target de outro Territory nao pode ser denunciado via contexto atual.
- Moderador visualiza contexto territorial quando disponivel.

Riscos tecnicos:

- Schema atual de denuncia pode nao ter todos os campos.
- Fila global pode nao suportar filtro territorial sem mudanca de banco.

Estrategia de testes:

- Unitario de `reportTarget`.
- Teste de denuncia em item cross-territory.
- Teste de fila com registro com/sem contexto.

Estrategia de migracao incremental:

- Enviar contexto em metadata/payload existente quando possivel.
- Manter leitura de denuncias antigas sem contexto.

Estrategia de compatibilidade:

- Denuncias antigas continuam visiveis.
- Novas denuncias seguem contrato territorial.

Estrategia para evitar regressoes:

- Nao mudar workflow admin alem do contexto.
- Validar target antes de chamar moderation service.

### Sprint P1.D - Realtime territorial

Objetivo tecnico: trocar highlight local por invalidacao/realtime filtrado pelo contexto territorial da timeline.

Arquivos previstos:

- `src/core/feed/hooks/useFeedTimeline.ts`
- `src/core/feed/queryKeys.ts`
- `src/core/realtime/services/RealtimeService.ts`
- `src/core/community/state/newPostHighlight.ts`
- `src/core/community/components/feed/CommunityFeed.tsx`

Ordem exata das alteracoes:

1. Definir chave territorial de subscription/invalidation.
2. Adicionar listener filtrado por location_ids do `TerritoryFilter`.
3. Invalidar apenas query key do Territory afetado.
4. Manter highlight local como fallback temporario.
5. Tratar duplicidade de item ja presente.
6. Testar evento do mesmo Territory e de outro Territory.

Contratos afetados:

- query key de Feed
- contrato de evento realtime filtrado por Territory

Servicos afetados:

- `RealtimeService`
- `FeedService` se expuser helpers de subscription

Hooks afetados:

- `useFeedTimeline`
- hook de subscription se criado

Repositories afetados:

- Nenhum esperado

Componentes afetados:

- `CommunityFeed`
- indicador/highlight de novo post

Paginas afetadas:

- timeline territorial

Criterios de rollback:

- Desativar subscription realtime.
- Manter refetch manual/highlight local.
- Nunca ampliar query para global.

Criterios de aceite:

- Evento do mesmo Territory atualiza timeline.
- Evento de outro Territory nao atualiza.
- Sem realtime, feed ainda funciona por refetch.

Riscos tecnicos:

- Duplicidade de item.
- Subscription ampla demais.
- Invalidacao excessiva.

Estrategia de testes:

- Unitario de filtro de evento.
- Teste de invalidacao por query key.
- Smoke manual com simulacao de evento.

Estrategia de migracao incremental:

- Implementar como melhoria ativavel sobre query atual.
- Manter fallback de refetch.

Estrategia de compatibilidade:

- Timeline continua funcional sem realtime.
- UI nao depende do evento para mostrar post criado pelo proprio usuario.

Estrategia para evitar regressoes:

- Teste que evento cross-territory nao invalida query.
- Limitar escopo de subscription.

### Sprint P2.A - Filtros, ranking e performance

Objetivo tecnico: alinhar filtros exibidos, ordenacao/ranking e paginacao no caminho canonico do Feed, validando performance com massa real ou equivalente.

Arquivos previstos:

- `src/core/feed/repositories/FeedRepository.ts`
- `src/core/feed/hooks/useFeedTimeline.ts`
- `src/core/community/hooks/useCommunityFiltersAAA.ts`
- `src/core/community/hooks/feed/territorialFeedEngine.ts`
- `src/core/posts/services/postFeedCursor.ts`
- testes/benchmarks focados

Ordem exata das alteracoes:

1. Mapear filtros exibidos para parametros aceitos pelo Feed Service.
2. Aplicar filtros no repository quando possivel.
3. Definir comportamento para filtros que ainda forem client-side.
4. Alinhar ordenacao com cursor/paginacao.
5. Medir bairro, cidade e grupo.
6. Registrar gargalos sem criar novos requisitos nesta sprint.

Contratos afetados:

- filtros de timeline
- sort/ranking mode
- cursor/pagination contract

Servicos afetados:

- `FeedService`
- ranking/engine atual

Hooks afetados:

- `useFeedTimeline`
- `useCommunityFiltersAAA`
- hooks de filtros legados

Repositories afetados:

- `FeedRepository`

Componentes afetados:

- controles de filtro/sort
- `TerritoryFeedHeader`

Paginas afetadas:

- timeline territorial

Criterios de rollback:

- Reverter filtro/ranking especifico.
- Manter timeline territorial segura.

Criterios de aceite:

- Filtro visivel altera resultado ou fica explicitamente inativo.
- Ordenacao nao contradiz paginacao.
- Performance medida em escopos previstos.

Riscos tecnicos:

- Mudanca de ordem percebida.
- Filtro pode reduzir resultados inesperadamente.
- Gargalo de query aparecer com grupo/cidade.

Estrategia de testes:

- Unitarios de filtros.
- Testes de cursor com sort.
- Benchmark local ou teste com massa controlada.

Estrategia de migracao incremental:

- Migrar um filtro por vez.
- Validar sort separado de ranking.

Estrategia de compatibilidade:

- Preservar labels atuais.
- Preservar default de ordenacao enquanto possivel.

Estrategia para evitar regressoes:

- Snapshot de query key/filtros.
- Teste de pagina 1 e proxima pagina.

### Sprint P2.B - UI publica consistente do Feed

Objetivo tecnico: consolidar card publico, estados oficiais e remover caminho nominal com mock/hardcode visual.

Arquivos previstos:

- `src/core/community/components/UnifiedPostCard/*`
- `src/core/community/components/PostCard.tsx`
- `src/core/community/components/cards/PostCard.tsx`
- `src/core/posts/components/PostCard.tsx`
- `src/core/community/components/FeedStates.tsx`
- `src/core/community/components/page/CommunityOverviewSurface.tsx`
- `src/core/community/components/page/communityOverviewHelpers.ts`

Ordem exata das alteracoes:

1. Identificar cards ainda usados em rotas publicas.
2. Definir `UnifiedPostCard` como render publico nominal.
3. Migrar cards legados para wrapper ou remover uso publico.
4. Unificar loading/empty/error/offline/retry.
5. Remover fixture visual do caminho nominal.
6. Substituir hardcode visual por metadata/fallback oficial quando aplicavel.
7. Rodar smoke visual mobile/desktop.

Contratos afetados:

- props do card publico
- estados oficiais do Feed

Servicos afetados:

- Nenhum service novo esperado

Hooks afetados:

- hooks que fornecem actions ao card
- hooks de estado/loading quando aplicavel

Repositories afetados:

- Nenhum esperado

Componentes afetados:

- Cards de post
- Feed states
- Overview surface
- helpers visuais

Paginas afetadas:

- `ComunidadePage`
- Territory/community overview

Criterios de rollback:

- Reverter uma tela por vez para card anterior.
- Manter actions via Feed Service.

Criterios de aceite:

- Uma superficie publica nominal usa card consolidado.
- Nenhum mock aparece como dado real.
- Empty/loading/error oficiais estao presentes.

Riscos tecnicos:

- Divergencia visual.
- Props antigas ausentes no card consolidado.
- Snapshot visual quebrar.

Estrategia de testes:

- Smoke visual mobile/desktop.
- Teste de acoes do card.
- Teste de empty/error/loading.

Estrategia de migracao incremental:

- Migrar rota principal primeiro.
- Depois overview/previews.
- Manter wrappers temporarios se necessario.

Estrategia de compatibilidade:

- Preservar layout nominal.
- Preservar textos e CTAs contextuais.

Estrategia para evitar regressoes:

- Verificacao visual por viewport.
- Garantir que card legado nao execute action proibida.

### Sprint P3.A - Limpeza documental e residuos

Objetivo tecnico: limpar residuos documentais e textuais sem alterar comportamento do Feed.

Arquivos previstos:

- `docs/SCREEN-MAP.md`
- `docs/FEATURE-MAP.md`
- arquivos proximos ao Feed com `LAUNCH_URLS` residual nao nominal
- arquivos com textos publicos/commentarios com encoding degradado

Ordem exata das alteracoes:

1. Atualizar docs de rota para refletir URL canonica decidida em P1.B.
2. Remover referencias documentais a `/p/:slug` como detalhe de post.
3. Corrigir textos com encoding degradado em superficie publica.
4. Revisar residuos de `LAUNCH_URLS` proximos ao Feed.
5. Garantir que nenhuma alteracao funcional foi feita.

Contratos afetados:

- Documentacao de rotas
- Nenhum contrato runtime esperado

Servicos afetados:

- Nenhum

Hooks afetados:

- Nenhum

Repositories afetados:

- Nenhum

Componentes afetados:

- Apenas se houver texto publico com encoding degradado

Paginas afetadas:

- Nenhuma funcionalmente

Criterios de rollback:

- Reverter doc/texto alterado.
- Sem impacto em runtime.

Criterios de aceite:

- Docs nao contradizem rotas reais.
- Textos publicos nao exibem mojibake.
- Caminho nominal nao usa `LAUNCH_URLS` residual.

Riscos tecnicos:

- Baixo; risco de snapshot textual.

Estrategia de testes:

- Busca estatica por `/p/:slug`, `LAUNCH_URLS.community` e mojibake conhecido.
- Typecheck se arquivo TSX textual for tocado.

Estrategia de migracao incremental:

- Docs primeiro.
- Textos publicos depois.
- Residuos de imports por ultimo.

Estrategia de compatibilidade:

- Nao alterar comportamento.
- Nao mudar rotas reais.

Estrategia para evitar regressoes:

- Diff review manual.
- Nenhuma alteracao de logica junto com texto.

## 3. Respostas obrigatorias

### 1. Qual sprint possui maior risco estrutural?

**Sprint P0.A - Boundary minimo do Feed.**

Ela cria a fronteira tecnica do dominio e muda o ponto oficial de entrada para operacoes publicas. Se esse boundary nascer mal definido, todas as sprints seguintes herdam o erro.

### 2. Qual sprint altera mais arquivos?

**Sprint P1.A - Consolidacao do SSOT e mutations publicas.**

Ela tende a tocar mais arquivos porque precisa remover callers publicos restantes em hooks, cards, componentes legados e services atomicos expostos.

### 3. Qual sprint possui maior chance de regressao?

**Sprint P0.D - Comentarios, respostas e reacoes por Feed Service.**

Ela toca acoes frequentes, contadores, invalidacao de cache, optimistic updates, listas de comentarios e botoes de card.

### 4. Qual sprint deve ser dividida?

**Sprint P1.A deve ser dividida se a busca estatica encontrar muitos callers legados.**

Divisao recomendada:

1. edicao/exclusao;
2. hooks legados;
3. cards/componentes;
4. callers de modulos externos.

**Sprint P0.D tambem pode ser dividida** em comentarios e engajamento se os contadores ou optimistic updates mostrarem regressao.

### 5. Existe alguma dependencia escondida?

**Sim.**

As dependencias escondidas sao:

- `QueryClient` e query keys atuais, porque invalidacoes amplas podem afetar outros Territories.
- RLS e visibilidade real do banco, porque o plano valida no app mas depende de o banco continuar coerente.
- Shape historico dos posts, porque `FeedItem` precisa mapear registros existentes sem migration.
- Rotas antigas e docs, porque `/p/:slug` nao pertence ao Feed.
- Perfil ativo/multi-profile, porque criacao e actions dependem de `activeProfile` correto.
- Upload/midia do composer, porque P0.C deve validar Feed antes de publicar sem quebrar fluxo de imagem.

### 6. Existe alguma alteracao que deveria ser feita antes da Sprint P0.A?

**Nao deve haver alteracao funcional antes da Sprint P0.A.**

Antes de P0.A, so sao aceitaveis preparacoes sem mudanca de comportamento:

- confirmar branch limpa ou separar alteracoes em andamento;
- listar callers proibidos para orientar a execucao;
- rodar testes de baseline;
- registrar estado atual de rotas e fluxos criticos.

Qualquer codigo antes de P0.A quebraria a ordem do roadmap.

### 7. O plano permite implementacao incremental sem interromper o funcionamento do Feed?

**Sim.**

O plano introduz o Feed boundary em paralelo, migra primeiro a timeline nominal, depois detalhe, criacao, comentarios/reacoes e Mobility. Cada sprint possui rollback local e preserva o caminho existente ate o novo fluxo estar validado, com falha fechada apenas para contextos territoriais invalidos.

## 4. Prontidao para implementacao

O plano esta pronto para iniciar implementacao porque:

- respeita a ordem do roadmap;
- nao altera prioridades;
- nao adiciona novos requisitos;
- nao exige migration;
- define rollback por sprint;
- preserva compatibilidade incremental;
- identifica riscos estruturais, regressivos e dependencias escondidas.

Status final: o dominio Feed esta pronto para iniciar implementacao.
