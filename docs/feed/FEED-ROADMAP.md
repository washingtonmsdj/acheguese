# FEED-ROADMAP.md

Sprint: FEED.ROADMAP.1

Status: plano oficial de implementacao do dominio Feed

Base obrigatoria:

- `docs/feed/FEED-AUDIT.md`
- `docs/feed/FEED-GOVERNANCE.md`

Regra de escopo: este documento transforma os findings da auditoria e a governanca oficial em backlog executavel. Nao implementa codigo, nao altera banco, nao cria migrations, nao adiciona requisitos novos e nao define refactors opcionais.

## 1. Principios do roadmap

1. O roadmap segue a governanca do Feed: Pages -> Hooks -> Feed Service -> Repository -> Supabase.
2. Toda correcao deve preservar `ResolvedTerritory`, `TerritoryFilter`, Rollout e AccessPolicy quando aplicavel.
3. Nenhum item abaixo autoriza operacao publica por `post_id`, `comment_id` ou fallback global sem contexto territorial.
4. P0 remove risco de vazamento territorial.
5. P1 remove bloqueios de governanca e congelamento.
6. P2 melhora consistencia, UX e comportamento de Feed sem mudar requisitos.
7. P3 limpa residuos documentais, fallbacks e qualidade de manutencao.

## 2. Backlog oficial

### P0

Status oficial:

- P0.A ✅ Concluida
- P0.B ✅ Concluida
- Proxima sprint oficial: P0.C

Sequencia P0 restante:

```text
P0.C
  ->
P0.E
  ->
P0.D.1
  ->
P0.D.2
  ->
P0.D.3
```

#### FEED-P0-FND / Sprint P0.A - Boundary minimo do Feed Service

Origem: `FEED-GOVERNANCE.md`, `FEED-P1-01`.

| Campo | Valor |
| --- | --- |
| Status | P0.A ✅ Concluida. |
| Descricao | Criar a porta unica minima para timeline, detalhe, comentarios, reacoes, compartilhamento e denuncias, com `FeedContext` validado antes de chamar repositorios ou dominios atomicos. |
| Impacto | Alto; desbloqueia todos os P0 que hoje dependem de servicos por ID puro. |
| Risco | Alto; muda o ponto de entrada das operacoes publicas de Feed. |
| Esforco | L |
| Dependencias | Territory hooks, Community AccessPolicy, Rollout, PostService atual, CommentService, Engagement, routing de comunidade. |
| Risco de quebra | Alto em criacao, detalhe, comentarios e reacoes se algum caller nao receber contexto. |
| Compatibilidade | Deve ser incremental; os caminhos antigos so podem permanecer como internos ou temporarios, nunca como porta publica final. |
| Ordem obrigatoria | 1 |
| Pode ser paralelo? | Nao. E fundacao dos demais P0. |
| Bloqueia congelamento? | Nao mais para o escopo P0.A concluido; os criterios de Freeze ainda dependem dos P0/P1 restantes. |
| Bloqueia lancamento? | Nao mais para o escopo P0.A concluido. |
| Dominio responsavel | Feed, com dependencias de Territory, Community, Posts, Comments e Engagement. |

#### FEED-P0-01 / Sprint P0.B - Leitura de detalhe territorial

Origem: `FEED-P0-01`.

| Campo | Valor |
| --- | --- |
| Status | P0.B ✅ Concluida. |
| Descricao | Substituir leitura publica de item por ID puro por leitura via Feed Service que valida `ResolvedTerritory`, `TerritoryFilter`, visibilidade e estado do item antes de retornar detalhe. |
| Impacto | Alto; elimina o principal risco de deep-link ou modal exibir item fora do territorio. |
| Risco | Alto; afeta detalhe, share, search result, notificacao futura e comentarios. |
| Esforco | M |
| Dependencias | FEED-P0-FND, rotas de comunidade, PostService/repository, filtros de visibilidade. |
| Risco de quebra | Medio a alto; links por `?post=<id>` podem passar a falhar fechado se o item nao pertencer ao Territory atual. |
| Compatibilidade | Compatibilidade deve ser mantida para links territoriais validos; links globais devem receber erro/empty state controlado. |
| Ordem obrigatoria | 2 |
| Pode ser paralelo? | Parcialmente, depois de FEED-P0-FND; pode caminhar junto com share canonicamente, mas deve terminar antes de comentarios/reacoes. |
| Bloqueia congelamento? | Nao mais para o escopo P0.B concluido; hardening de testes segue obrigatorio antes do Freeze. |
| Bloqueia lancamento? | Nao mais para o escopo P0.B concluido. |
| Dominio responsavel | Feed, com Posts e Territory. |

#### FEED-P0-02 - Criacao por rota territorial

Origem: `FEED-P0-02`.

| Campo | Valor |
| --- | --- |
| Descricao | Fazer a criacao publica de post entrar pelo Feed Service com Territory resolvido da rota, rollout e AccessPolicy; impedir fallback silencioso para bairro do perfil quando a rota tiver Territory. |
| Impacto | Alto; impede publicacao no territorio errado ou bloqueado. |
| Risco | Alto; afeta `/novo-post`, composer, modal de criacao e CTAs. |
| Esforco | M |
| Dependencias | FEED-P0-FND, Community AccessPolicy, Rollout, composer, rota territorial. |
| Risco de quebra | Alto para usuarios que hoje usam `/novo-post` fora de contexto territorial. |
| Compatibilidade | Deve preservar criacao valida a partir de rota territorial; acesso sem territorio deve falhar fechado ou direcionar para selecao oficial de territorio, sem criar post. |
| Ordem obrigatoria | 3 |
| Pode ser paralelo? | Nao recomendado no estado atual; e a proxima sprint oficial apos P0.A/P0.B concluidas. |
| Bloqueia congelamento? | Sim. |
| Bloqueia lancamento? | Sim. |
| Dominio responsavel | Feed, com Community, Territory, Rollout e Posts. |

#### FEED-P0-03 / Sprint P0.E - Isolamento territorial dos posts de mobilidade

Origem: `FEED-P0-03`.

| Campo | Valor |
| --- | --- |
| Descricao | Remover consulta de posts de mobilidade por tipo global; Mobility deve consumir Feed com `ResolvedTerritory`/`TerritoryFilter` ou falhar fechado. |
| Impacto | Alto; corrige vazamento confirmado de caronas/solicitacoes entre bairros. |
| Risco | Medio; escopo concentrado em Mobility usando Feed. |
| Esforco | M |
| Dependencias | FEED-P0-FND, contrato de Feed para itens `ride_share`, hooks de Mobility. |
| Risco de quebra | Medio; feeds de carona podem ficar vazios quando o contexto territorial estiver ausente. |
| Compatibilidade | Deve preservar caronas do territorio atual e bloquear resultado global implicito. |
| Ordem obrigatoria | 4 |
| Pode ser paralelo? | Pode rodar em paralelo controlado com P0.D.1 se nao compartilhar os mesmos arquivos no mesmo momento; a sequencia oficial posiciona P0.E antes de P0.D.1. |
| Bloqueia congelamento? | Sim. |
| Bloqueia lancamento? | Sim. |
| Dominio responsavel | Feed e Mobility. |

#### FEED-P0-04A / Sprint P0.D.1 - Comentarios e respostas territorializados

Origem: `FEED-P0-04`.

| Campo | Valor |
| --- | --- |
| Descricao | Fazer comentarios e respostas operarem por Feed Service apos validacao do item pai no Territory atual. |
| Impacto | Alto; remove a dependencia de autorizacao externa fragil por `post_id` para comentarios. |
| Risco | Alto; toca painel de comentarios, replies, invalidacao e erro/retry. |
| Esforco | M |
| Dependencias | FEED-P0-FND, FEED-P0-01, CommentService, PostCommentsPanel, query keys territoriais. |
| Risco de quebra | Alto; comentarios aninhados, contadores e invalidacoes podem divergir. |
| Compatibilidade | Deve preservar a UX atual para itens validos e bloquear comentarios/respostas em itens fora do Territory. |
| Ordem obrigatoria | 5 |
| Pode ser paralelo? | Parcialmente, apenas com P0.E se os arquivos nao conflitarem. |
| Bloqueia congelamento? | Sim. |
| Bloqueia lancamento? | Sim. |
| Dominio responsavel | Feed, com Comments. |

#### FEED-P0-04B / Sprint P0.D.2 - Reacoes, saves e contadores territorializados

Origem: `FEED-P0-04`.

| Campo | Valor |
| --- | --- |
| Descricao | Fazer reacoes, likes, saves e contadores operarem por Feed Service apos validacao do alvo no Territory atual. |
| Impacto | Alto; remove a dependencia de autorizacao externa fragil por `post_id` para engajamento. |
| Risco | Alto; toca acoes frequentes, estados otimistas, contadores e invalidacoes. |
| Esforco | M |
| Dependencias | FEED-P0-FND, FEED-P0-01, FEED-P0-04A, Engagement, PostEngagementService, UnifiedPostCard. |
| Risco de quebra | Alto; estados otimistas e contadores podem divergir apos sucesso/erro. |
| Compatibilidade | Deve preservar a UX atual para itens validos e bloquear reacoes/saves em itens fora do Territory. |
| Ordem obrigatoria | 6 |
| Pode ser paralelo? | Nao recomendado; depende da validacao de alvo consolidada antes de migrar engajamento. |
| Bloqueia congelamento? | Sim. |
| Bloqueia lancamento? | Sim. |
| Dominio responsavel | Feed, com Engagement. |

#### FEED-P0-04C / Sprint P0.D.3 - Share Action minimo sem fallback global

Origem: `FEED-P0-04`.

| Campo | Valor |
| --- | --- |
| Descricao | Fazer a action publica de share operar somente sobre alvo validado pelo Feed, sem fallback global nominal. |
| Impacto | Alto; impede share de alvo fora do Territory ou sem contexto territorial validado. |
| Risco | Medio; toca botoes de share e integracao atual de `usePostActions`, sem assumir a URL canonica final. |
| Esforco | S |
| Dependencias | FEED-P0-FND, FEED-P0-01, FEED-P0-04B, util atual de share, FeedTarget validado. |
| Risco de quebra | Medio; share em contexto sem Territory deve falhar fechado em vez de usar fallback global. |
| Compatibilidade | Deve preservar share de item valido em rota territorial; URL canonica completa permanece em P1.B. |
| Ordem obrigatoria | 7 |
| Pode ser paralelo? | Nao recomendado; deve vir apos engajamento minimo para concentrar action migration. |
| Bloqueia congelamento? | Sim. |
| Bloqueia lancamento? | Sim. |
| Dominio responsavel | Feed, com Routing/Territory para base territorial existente. |

### P1

#### FEED-P1-01 - SSOT completo do Feed

Origem: `FEED-P1-01`.

| Campo | Valor |
| --- | --- |
| Descricao | Consolidar timeline, detalhe, comentarios, engajamento, busca, moderacao e mobilidade como entradas pelo boundary do Feed. |
| Impacto | Alto; transforma o dominio em unidade congelavel. |
| Risco | Medio a alto; remove caminhos paralelos e dependencias diretas. |
| Esforco | XL |
| Dependencias | Todos os P0, Feed Service/Repository, hooks publicos. |
| Risco de quebra | Alto; callers legados podem depender de APIs atomicas. |
| Compatibilidade | Deve ser incremental, com remocao controlada de callers diretos apos cobertura dos fluxos publicos. |
| Ordem obrigatoria | 8 |
| Pode ser paralelo? | Nao como sprint unica; pode ser quebrado por operacao depois dos P0. |
| Bloqueia congelamento? | Sim. |
| Bloqueia lancamento? | Parcialmente; bloqueia lancamento oficial completo do Feed. |
| Dominio responsavel | Feed, com todos os dominios colaboradores. |

#### FEED-P1-02 - Mutations seguras como unico caminho publico

Origem: `FEED-P1-02`.

| Campo | Valor |
| --- | --- |
| Descricao | Remover uso publico de mutations por ID puro e manter edicao/exclusao apenas via Feed Service com autor, territorio, visibilidade e policy. |
| Impacto | Alto; reduz risco de alteracao indevida de item. |
| Risco | Medio; afeta hooks legados e composer. |
| Esforco | M |
| Dependencias | FEED-P0-FND, FEED-P0-01, FEED-P0-02. |
| Risco de quebra | Medio; edicao/exclusao podem passar a falhar se o contexto estiver incompleto. |
| Compatibilidade | Compatibilidade preservada para autor/moderador valido no Territory correto. |
| Ordem obrigatoria | 9 |
| Pode ser paralelo? | Sim, com FEED-P1-03 apos P0. |
| Bloqueia congelamento? | Sim. |
| Bloqueia lancamento? | Sim para superficies com edicao/exclusao publica. |
| Dominio responsavel | Feed e Posts. |

#### FEED-P1-03 - Rollout universal no Feed

Origem: `FEED-P1-03`.

| Campo | Valor |
| --- | --- |
| Descricao | Garantir que todo caminho publico de Feed respeite rollout do Territory resolvido, com precedencia de bairro sobre cidade. |
| Impacto | Alto; habilita ativacao gradual por bairro. |
| Risco | Medio; pode bloquear superficies que hoje funcionam por fallback. |
| Esforco | M |
| Dependencias | FEED-P0-FND, CommunityRolloutService, AccessPolicy, rotas. |
| Risco de quebra | Medio; bairros sem rollout efetivo podem deixar de permitir criacao/acao. |
| Compatibilidade | Compatibilidade deve seguir a regra oficial: Empty State ou bloqueio controlado quando rollout nao permitir. |
| Ordem obrigatoria | 10 |
| Pode ser paralelo? | Sim, com FEED-P1-02. |
| Bloqueia congelamento? | Sim. |
| Bloqueia lancamento? | Sim. |
| Dominio responsavel | Feed, Rollout e Community. |

#### FEED-P1-04 - Compartilhamento e detalhe com URL canonica

Origem: `FEED-P1-04`, `FEED-P3-01`, `FEED-P3-02`.

| Campo | Valor |
| --- | --- |
| Descricao | Definir e usar deep-link canonico territorial para item de Feed; remover fallback global de compartilhamento e alinhar documentacao de rota. |
| Impacto | Medio a alto; estabiliza share, search result e notificacao futura. |
| Risco | Medio; altera URLs de compartilhamento e comportamento de links antigos. |
| Esforco | M |
| Dependencias | FEED-P0-01, FEED-P0-04C, roteamento territorial, builders de URL. |
| Risco de quebra | Medio; links antigos sem territorio devem receber fallback controlado ou erro. |
| Compatibilidade | Links territoriais validos devem continuar abrindo; `/p/:slug` continua fora do Feed enquanto for premium business. |
| Ordem obrigatoria | 11 |
| Pode ser paralelo? | Sim, apos FEED-P0-01. |
| Bloqueia congelamento? | Sim. |
| Bloqueia lancamento? | Sim para experiencia com share/deep-link publico. |
| Dominio responsavel | Feed e Routing/Territory. |

#### FEED-P1-05 - Moderacao territorial de Feed

Origem: `FEED-P1-05`.

| Campo | Valor |
| --- | --- |
| Descricao | Fazer denuncia e fila de moderacao receberem target, reporter, autor, evidencia e contexto territorial validado pelo Feed. |
| Impacto | Medio a alto; permite moderacao por comunidade/bairro. |
| Risco | Medio; toca workflow administrativo e permissoes. |
| Esforco | M |
| Dependencias | FEED-P0-01, FEED-P0-04A, FEED-P0-04B, FEED-P0-04C, Moderation, Community roles. |
| Risco de quebra | Medio; filas globais podem precisar de escopo territorial explicito. |
| Compatibilidade | Denuncias existentes podem continuar globais como legado, mas novas denuncias de Feed devem ser territoriais. |
| Ordem obrigatoria | 12 |
| Pode ser paralelo? | Sim, apos P0.D completo. |
| Bloqueia congelamento? | Sim. |
| Bloqueia lancamento? | Sim para lancamento social com moderacao local. |
| Dominio responsavel | Feed e Moderation. |

#### FEED-P1-07 - Busca de posts com destino canonico

Origem: `FEED-P1-07`.

| Campo | Valor |
| --- | --- |
| Descricao | Fazer resultados de busca de posts usarem destino canonico de Feed territorial, mantendo `TerritoryFilter` do caller. |
| Impacto | Medio; completa a jornada de busca para Feed. |
| Risco | Medio; depende de URL canonica de detalhe. |
| Esforco | S |
| Dependencias | FEED-P1-04, SearchService, SearchDocumentMapper. |
| Risco de quebra | Baixo a medio; resultados que hoje nao navegam passarao a navegar ou falhar fechado. |
| Compatibilidade | Busca territorial continua limitada ao Territory atual. |
| Ordem obrigatoria | 13 |
| Pode ser paralelo? | Sim, depois de FEED-P1-04. |
| Bloqueia congelamento? | Sim. |
| Bloqueia lancamento? | Nao bloqueia lancamento minimo se busca de post nao for superficie principal. |
| Dominio responsavel | Feed e Search. |

#### FEED-P1-06 - Realtime territorial

Origem: `FEED-P1-06`.

| Campo | Valor |
| --- | --- |
| Descricao | Substituir highlight local isolado por realtime/invalidation territorial que respeite FeedContext e visibilidade. |
| Impacto | Medio; melhora atualizacao da timeline entre usuarios. |
| Risco | Medio; eventos realtime podem gerar duplicidade, ordem incorreta ou vazamento se nao filtrados. |
| Esforco | M |
| Dependencias | FEED-P0-FND, FEED-P0-01, query keys territoriais, RealtimeService. |
| Risco de quebra | Medio; risco de duplicar itens ou invalidar queries erradas. |
| Compatibilidade | Pode manter polling/refetch como fallback; realtime nao deve ampliar escopo territorial. |
| Ordem obrigatoria | 14 |
| Pode ser paralelo? | Sim, depois da query territorial estar consolidada. |
| Bloqueia congelamento? | Sim se realtime for requisito ativo da superficie; caso contrario pode ser excecao auditavel. |
| Bloqueia lancamento? | Nao para lancamento minimo, desde que refetch manual funcione. |
| Dominio responsavel | Feed e Realtime/Notifications. |

### P2

#### FEED-P2-01 - Filtros e hashtags aplicados na consulta

Origem: `FEED-P2-01`.

| Campo | Valor |
| --- | --- |
| Descricao | Fazer filtros de tag/tipo refletirem no caminho canonico da timeline, sem ficarem apenas em estado de UI. |
| Impacto | Medio. |
| Risco | Baixo. |
| Esforco | M |
| Dependencias | Feed Service, Repository, query de timeline. |
| Risco de quebra | Baixo a medio; usuarios podem ver menos resultados por filtros realmente aplicados. |
| Compatibilidade | Filtros existentes devem manter os mesmos labels e intencao. |
| Ordem obrigatoria | 15 |
| Pode ser paralelo? | Sim, apos P1 de SSOT. |
| Bloqueia congelamento? | Nao, se filtros incompletos forem desativados ou marcados como excecao auditavel. |
| Bloqueia lancamento? | Nao. |
| Dominio responsavel | Feed. |

#### FEED-P2-02 - Ordenacao/ranking coerente com paginacao

Origem: `FEED-P2-02`.

| Campo | Valor |
| --- | --- |
| Descricao | Alinhar ordenacao e ranking da timeline para nao depender apenas de ordenacao client-side sobre pagina ja carregada. |
| Impacto | Medio. |
| Risco | Medio. |
| Esforco | M |
| Dependencias | Feed Repository, postFeedCursor, ranking atual. |
| Risco de quebra | Medio; ordem percebida pode mudar. |
| Compatibilidade | Deve preservar modos de ordenacao existentes quando possivel. |
| Ordem obrigatoria | 16 |
| Pode ser paralelo? | Sim, apos timeline pelo Feed Service. |
| Bloqueia congelamento? | Nao, se comportamento atual for documentado como limite. |
| Bloqueia lancamento? | Nao. |
| Dominio responsavel | Feed e Posts. |

#### FEED-P2-03 - Remocao de duplicacao de componentes de post

Origem: `FEED-P2-03`.

| Campo | Valor |
| --- | --- |
| Descricao | Consolidar uso publico em um card de Feed e impedir acoes divergentes por componentes legados. |
| Impacto | Medio. |
| Risco | Medio. |
| Esforco | M |
| Dependencias | P0/P1 de acoes, UnifiedPostCard, cards legados. |
| Risco de quebra | Medio; telas antigas podem depender de props especificas. |
| Compatibilidade | Aparencia e acoes principais devem permanecer equivalentes. |
| Ordem obrigatoria | 17 |
| Pode ser paralelo? | Sim, apos acoes passarem pelo Feed Service. |
| Bloqueia congelamento? | Parcialmente; bloqueia se card legado mantiver operacao proibida. |
| Bloqueia lancamento? | Nao, se caminho publico principal estiver seguro. |
| Dominio responsavel | Feed e UI Community. |

#### FEED-P2-04 - Estados UX oficiais do Feed

Origem: `FEED-P2-04`.

| Campo | Valor |
| --- | --- |
| Descricao | Unificar loading, empty, error, offline, skeleton e retry no caminho publico do Feed. |
| Impacto | Medio. |
| Risco | Baixo. |
| Esforco | M |
| Dependencias | Feed hooks, componentes de estado existentes. |
| Risco de quebra | Baixo; risco visual e de mensagens. |
| Compatibilidade | Textos e CTAs devem continuar contextuais ao Territory. |
| Ordem obrigatoria | 18 |
| Pode ser paralelo? | Sim, apos o caminho principal do Feed estar seguro. |
| Bloqueia congelamento? | Parcialmente; governance exige Empty States oficiais. |
| Bloqueia lancamento? | Nao, salvo ausencia de Empty State em superficie publica. |
| Dominio responsavel | Feed e UX. |

#### FEED-P2-05 - Hardcodes visuais e fixture visual fora do caminho nominal

Origem: `FEED-P2-05`.

| Campo | Valor |
| --- | --- |
| Descricao | Remover dependencia evolutiva de imagens por slug e fixture visual em superficie publica nominal; manter dados visuais via SSOT territorial quando aplicavel. |
| Impacto | Medio. |
| Risco | Baixo. |
| Esforco | S |
| Dependencias | Metadata territorial, CommunityOverviewSurface. |
| Risco de quebra | Baixo; pode afetar hero/fallback visual. |
| Compatibilidade | Fallback visual deve continuar sem parecer dado real. |
| Ordem obrigatoria | 19 |
| Pode ser paralelo? | Sim. |
| Bloqueia congelamento? | Parcialmente, se fixture/hardcode permanecer como caminho nominal. |
| Bloqueia lancamento? | Nao, se nao afetar dados reais. |
| Dominio responsavel | Feed, Community e Territory. |

#### FEED-P2-06 - Validacao de performance com dados reais

Origem: `FEED-P2-06`.

| Campo | Valor |
| --- | --- |
| Descricao | Validar timeline com volume real em cidade, bairro e TerritoryGroup, incluindo expansao territorial, paginacao e merge/ranking. |
| Impacto | Medio. |
| Risco | Medio. |
| Esforco | M |
| Dependencias | Feed Service, Repository, dados reais ou massa equivalente, indices existentes. |
| Risco de quebra | Baixo em codigo; medio em descobertas de gargalo. |
| Compatibilidade | Nao deve alterar comportamento sem novo item aprovado. |
| Ordem obrigatoria | 20 |
| Pode ser paralelo? | Sim, apos timeline canonica. |
| Bloqueia congelamento? | Parcialmente; bloqueia se aparecer gargalo P0/P1. |
| Bloqueia lancamento? | Nao para escopo pequeno; sim se performance falhar no territorio de lancamento. |
| Dominio responsavel | Feed, Posts e Platform/Data. |

### P3

#### FEED-P3-01 - Limpeza residual de `LAUNCH_URLS` proximo ao Feed

Origem: `FEED-P3-01`.

| Campo | Valor |
| --- | --- |
| Descricao | Remover usos residuais de `LAUNCH_URLS` em caminhos proximos ao Feed quando houver URL territorial canonica disponivel. |
| Impacto | Baixo a medio. |
| Risco | Baixo. |
| Esforco | S |
| Dependencias | FEED-P1-04. |
| Risco de quebra | Baixo; risco concentrado em fallback de navegacao. |
| Compatibilidade | Fallbacks devem ser substituidos por erro controlado ou builder territorial. |
| Ordem obrigatoria | 21 |
| Pode ser paralelo? | Sim, apos URL canonica. |
| Bloqueia congelamento? | Parcialmente, se houver uso nominal. |
| Bloqueia lancamento? | Nao, se residual nao for caminho nominal. |
| Dominio responsavel | Feed e Routing/Territory. |

#### FEED-P3-02 - Alinhamento de documentacao de rotas

Origem: `FEED-P3-02`.

| Campo | Valor |
| --- | --- |
| Descricao | Atualizar mapas de telas para nao declarar `/p/:slug` como detalhe de post enquanto a rota pertencer a premium business. |
| Impacto | Baixo. |
| Risco | Baixo. |
| Esforco | S |
| Dependencias | FEED-P1-04. |
| Risco de quebra | Nenhum em runtime; risco apenas documental. |
| Compatibilidade | Deve refletir rotas reais sem alterar contrato de produto. |
| Ordem obrigatoria | 22 |
| Pode ser paralelo? | Sim, apos decisao de URL canonica. |
| Bloqueia congelamento? | Sim para auditoria documental final. |
| Bloqueia lancamento? | Nao. |
| Dominio responsavel | Feed e Documentation/Routing. |

#### FEED-P3-03 - Correcao de encoding degradado

Origem: `FEED-P3-03`.

| Campo | Valor |
| --- | --- |
| Descricao | Corrigir textos/comentarios com mojibake em arquivos do Feed sem alterar comportamento. |
| Impacto | Baixo. |
| Risco | Baixo. |
| Esforco | S |
| Dependencias | Nenhuma funcional. |
| Risco de quebra | Baixo; risco apenas em snapshots/testes de texto. |
| Compatibilidade | Deve preservar texto funcional e semantica. |
| Ordem obrigatoria | 23 |
| Pode ser paralelo? | Sim. |
| Bloqueia congelamento? | Nao, salvo se afetar textos publicos ou docs oficiais. |
| Bloqueia lancamento? | Nao. |
| Dominio responsavel | Feed e Documentation/UX copy. |

## 3. Sequencia oficial de implementacao

### Sprint P0.A - Boundary minimo do Feed

| Campo | Valor |
| --- | --- |
| Status | ✅ Concluida. |
| Objetivo | Criar o caminho oficial minimo `FeedContext` -> Feed Hooks -> Feed Service -> Feed Repository para operacoes publicas. |
| Arquivos previstos | `src/core/feed/*`, hooks publicos de Feed, adapters internos para Posts/Comments/Engagement, query keys de Feed. |
| Tempo estimado | 3 a 5 dias. |
| Risco | Alto. |
| Rollback | Manter antigos caminhos como fallback interno temporario e reverter callers migrados ao caminho anterior se o boundary falhar. |
| Criterio de aceite | Existe porta unica minima; nenhuma operacao migrada executa sem `ResolvedTerritory` e `TerritoryFilter`; timeline nominal continua funcionando. |

### Sprint P0.B - Detalhe territorial e deep-link seguro

| Campo | Valor |
| --- | --- |
| Status | ✅ Concluida. |
| Objetivo | Fazer detalhe/modal/deep-link buscar item apenas via Feed Service e falhar fechado fora do Territory. |
| Arquivos previstos | Detalhe/modal de post, hooks de post por ID, Feed Service, Feed Repository, rotas/query param de Feed. |
| Tempo estimado | 2 a 3 dias. |
| Risco | Alto. |
| Rollback | Reverter leitura de detalhe ao caminho antigo apenas se links validos quebrarem; manter bloqueio para itens fora do Territory. |
| Criterio de aceite | Item fora do Territory nao abre; item valido abre com comentarios e acoes preparadas para contexto. |

### Sprint P0.C - Criacao territorial e rollout

| Campo | Valor |
| --- | --- |
| Objetivo | Fazer `/novo-post` e composer criarem apenas com Territory resolvido, rollout e AccessPolicy. |
| Arquivos previstos | `NovoPostPage`, `CreatePostModal`, hooks de criacao, Feed Service, Community AccessPolicy/Rollout integration. |
| Tempo estimado | 2 a 4 dias. |
| Risco | Alto. |
| Rollback | Reverter o caller do composer, mantendo validacao de `location_id` obrigatoria; bloquear criacao sem contexto em vez de publicar por fallback. |
| Criterio de aceite | Criacao em rota territorial publica no Territory correto; criacao sem Territory falha fechado; rollout por bairro e respeitado. |

### Sprint P0.E - Mobility sem vazamento territorial

| Campo | Valor |
| --- | --- |
| Objetivo | Fazer Mobility consumir itens sociais via Feed ou `TerritoryFilter`, removendo consulta global por tipo. |
| Arquivos previstos | `src/modules/mobility/hooks/useCommunityPosts.ts`, componentes de feed de carona, Feed Service. |
| Tempo estimado | 1 a 2 dias. |
| Risco | Medio. |
| Rollback | Reverter apenas a integracao de Mobility, mantendo uma guarda que impede consulta global sem territorio. |
| Criterio de aceite | Caronas/posts de mobilidade aparecem somente no Territory atual; sem contexto territorial retorna empty/bloqueio controlado. |

### Sprint P0.D.1 - Comentarios e respostas por Feed Service

| Campo | Valor |
| --- | --- |
| Objetivo | Migrar comentarios e respostas para operarem sobre item pai validado pelo Feed. |
| Arquivos previstos | `PostCommentsPanel`, hooks de comentarios, Feed Service, adapters de Comments. |
| Tempo estimado | 2 a 3 dias. |
| Risco | Alto. |
| Rollback | Reverter comentarios/respostas mantendo leitura de detalhe territorial como guarda minima. |
| Criterio de aceite | Comentario/resposta em item fora do Territory e bloqueado; comentarios de item valido continuam consistentes. |

### Sprint P0.D.2 - Reacoes, saves e contadores por Feed Service

| Campo | Valor |
| --- | --- |
| Objetivo | Migrar likes, reacoes, saves e contadores para operarem sobre alvo validado pelo Feed. |
| Arquivos previstos | `usePostActions`, hooks de engajamento, Feed Service, adapters de Engagement, `UnifiedPostCard`. |
| Tempo estimado | 2 a 3 dias. |
| Risco | Alto. |
| Rollback | Reverter uma action por vez, mantendo leitura de detalhe territorial como guarda minima. |
| Criterio de aceite | Reacao/save em item fora do Territory e bloqueado; contadores e invalidacoes continuam consistentes para item valido. |

### Sprint P0.D.3 - Share Action minimo sem fallback global

| Campo | Valor |
| --- | --- |
| Objetivo | Migrar a action minima de share para alvo validado pelo Feed, sem fallback global nominal. |
| Arquivos previstos | `usePostActions`, util atual de share, botoes de share, Feed Service. |
| Tempo estimado | 1 a 2 dias. |
| Risco | Medio. |
| Rollback | Bloquear share sem contexto territorial em vez de voltar a fallback global. |
| Criterio de aceite | Share de item fora do Territory e bloqueado; share sem contexto nao usa fallback global; URL canonica completa permanece em P1.B. |

### Sprint P1.A - Consolidacao do SSOT e mutations publicas

| Campo | Valor |
| --- | --- |
| Objetivo | Remover callers publicos restantes de Posts/Comments/Engagement por ID puro e tornar Feed Service o SSOT completo. |
| Arquivos previstos | Hooks legados `useUpdatePost`, `useDeletePost`, PostService callers, components/cards publicos, Feed Service/Repository. |
| Tempo estimado | 5 a 8 dias. |
| Risco | Alto. |
| Rollback | Reverter por operacao, mantendo P0 de isolamento ativo. |
| Criterio de aceite | Auditoria estatica nao encontra operacao publica proibida fora do Feed Service. |

### Sprint P1.B - URL canonica, share e busca

| Campo | Valor |
| --- | --- |
| Objetivo | Estabilizar deep-link territorial, remover fallback global de share e fazer busca de post navegar para destino canonico. |
| Arquivos previstos | `postShare`, routing/builders, SearchDocumentMapper, Search providers, docs de rota. |
| Tempo estimado | 3 a 5 dias. |
| Risco | Medio. |
| Rollback | Manter leitura por URL territorial antiga; bloquear links globais ambiguos. |
| Criterio de aceite | Compartilhamento nunca usa fallback global; resultado de busca de post abre item territorial valido ou falha fechado. |

### Sprint P1.C - Moderacao territorial

| Campo | Valor |
| --- | --- |
| Objetivo | Incluir contexto territorial validado em denuncia e moderacao de itens de Feed. |
| Arquivos previstos | CommunityReportService callers, Feed Service report target, filas/painel de moderacao quando aplicavel. |
| Tempo estimado | 3 a 5 dias. |
| Risco | Medio. |
| Rollback | Preservar fila global legada para historico; novas denuncias de Feed devem continuar territoriais. |
| Criterio de aceite | Toda denuncia nova de Feed contem Territory validado e alvo confirmado. |

### Sprint P1.D - Realtime territorial

| Campo | Valor |
| --- | --- |
| Objetivo | Substituir destaque local por realtime/invalidation filtrado por Territory. |
| Arquivos previstos | Feed hooks, query keys, RealtimeService, CommunityFeed. |
| Tempo estimado | 3 a 5 dias. |
| Risco | Medio. |
| Rollback | Desativar realtime e manter refetch/invalidation manual sem ampliar escopo. |
| Criterio de aceite | Novo item de outro usuario aparece apenas na timeline do Territory correto. |

### Sprint P2.A - Filtros, ranking e performance

| Campo | Valor |
| --- | --- |
| Objetivo | Aplicar filtros reais, alinhar ordenacao com paginacao e validar performance com dados reais. |
| Arquivos previstos | Feed Repository, hooks de filtros, `territorialFeedEngine`, `postFeedCursor`, testes/benchmarks. |
| Tempo estimado | 5 a 8 dias. |
| Risco | Medio. |
| Rollback | Reverter filtro/ranking por modo; manter timeline segura e paginada. |
| Criterio de aceite | Filtros exibidos afetam resultado; ordenacao e paginacao nao contradizem o escopo; performance validada. |

### Sprint P2.B - UI publica consistente do Feed

| Campo | Valor |
| --- | --- |
| Objetivo | Consolidar card publico, estados de UX e remover dependencia nominal de mocks/hardcodes visuais. |
| Arquivos previstos | `UnifiedPostCard`, cards legados, FeedStates, CommunityOverviewSurface, helpers visuais. |
| Tempo estimado | 4 a 6 dias. |
| Risco | Medio. |
| Rollback | Reverter componente por tela mantendo acoes via Feed Service. |
| Criterio de aceite | Nao ha acao publica divergente por card; estados oficiais existem; mock visual nao aparece como dado real. |

### Sprint P3.A - Limpeza documental e residuos

| Campo | Valor |
| --- | --- |
| Objetivo | Corrigir docs de rota, residuos de `LAUNCH_URLS` nao nominais e encoding degradado. |
| Arquivos previstos | `docs/SCREEN-MAP.md`, `docs/FEATURE-MAP.md`, arquivos proximos ao Feed com textos/rotas residuais. |
| Tempo estimado | 1 a 3 dias. |
| Risco | Baixo. |
| Rollback | Reverter alteracoes documentais/textuais sem tocar comportamento. |
| Criterio de aceite | Documentacao nao contradiz rotas reais; residuos nao afetam caminho nominal; textos publicos nao exibem encoding degradado. |

## 4. Respostas obrigatorias

### 1. Qual deve ser a PRIMEIRA sprint?

**Sprint P0.C - Criacao territorial e rollout.**

P0.A e P0.B estao oficialmente concluidas. A proxima sprint deve ser P0.C porque a criacao ainda e o principal caminho capaz de inserir novo conteudo no Territory errado ou publicar por fallback silencioso do perfil.

### 2. Qual sprint possui maior risco?

Entre as sprints restantes, **Sprint P0.C - Criacao territorial e rollout** possui maior risco estrutural, porque move a mutation de criacao para o Feed Service e precisa preservar composer, upload, rota territorial e policy.

**Sprint P0.D.2 - Reacoes, saves e contadores por Feed Service** possui o maior risco comportamental, porque toca acoes frequentes, contadores, invalidacao de cache e estados otimistas.

### 3. Qual sprint desbloqueia mais itens?

Entre as sprints restantes, **Sprint P0.C** desbloqueia mais itens.

Ela consolida a primeira mutation publica dentro do Feed Service e estabelece o padrao que P0.D.1, P0.D.2, P0.D.3 e P1.A devem seguir para outras operacoes por alvo validado.

### 4. Existe alguma dependencia circular?

**Nao ha dependencia circular obrigatoria.**

Existe uma dependencia em cadeia:

```text
Feed boundary
  -> detalhe territorial
  -> criacao territorial
  -> mobility territorial
  -> comentarios/respostas
  -> reacoes/saves/contadores
  -> share action minimo
  -> moderacao/busca/share canonico
  -> consolidacao de SSOT
  -> congelamento
```

Essa cadeia e linear. O risco de circularidade aparece apenas se a implementacao tentar resolver share canonico, busca ou notificacao antes do alvo validado pelo Feed.

### 5. Existe alguma sprint que deveria ser dividida?

**Sim.**

`Sprint P0.D` foi oficialmente dividida em:

1. `P0.D.1 - Comentarios e respostas por Feed Service`;
2. `P0.D.2 - Reacoes, saves e contadores por Feed Service`;
3. `P0.D.3 - Share Action minimo sem fallback global`.

`Sprint P1.A - Consolidacao do SSOT e mutations publicas` deve ser dividida se, durante execucao, ainda existirem muitos callers legados por UI/hook/modulo. A divisao recomendada, se necessaria, e por operacao:

1. edicao/exclusao;
2. cards/componentes;
3. hooks legados;
4. callers de modulos externos.

### 6. Apos executar todos os P0 o dominio Feed podera entrar em Freeze?

**Nao.**

Executar todos os P0 remove os bloqueios criticos de vazamento territorial e lancamento minimo, mas nao basta para Freeze. O congelamento ainda depende dos P1 que consolidam SSOT completo, mutations seguras, rollout universal, URL canonica/share, moderacao territorial e busca consistente. P0 deixa o dominio seguro para continuar; P1 deixa o dominio congelavel.

## 5. Hardening obrigatorio antes do Freeze

Os itens abaixo sao obrigatorios antes do Freeze do dominio Feed.

Eles nao reabrem P0.A nem P0.B, nao bloqueiam o inicio da P0.C e nao criam novos requisitos. Sao dividas tecnicas herdadas da execucao incremental.

- Adicionar teste de integracao de `?post=<id>` em rota territorial.
- Adicionar fixture dedicada de detalhe com `is_removed=true`.
- Adicionar fixture dedicada de detalhe com `is_published=false`.
- Complementar rollback operacional da P0.B com a lista exata dos callers alterados.
- Consumir os enriquecimentos e actions ainda fora do Feed Service nas sprints previstas: `usePostById` com interacoes/poll, `usePostActions` com like/save/share/delete.
- Resolver ou registrar excecao auditavel para a falha persistente de `npm run test:ssot:community` em regras de navegacao fora do escopo P0.A/P0.B.

## 6. Marco de congelamento

O dominio Feed so podera entrar em Freeze quando:

- todos os P0 estiverem concluidos;
- o hardening obrigatorio antes do Freeze estiver concluido ou formalmente tratado como excecao auditavel;
- FEED-P1-01, FEED-P1-02, FEED-P1-03, FEED-P1-04 e FEED-P1-05 estiverem concluidos;
- FEED-P1-06 tiver sido implementado ou formalmente tratado como excecao auditavel;
- FEED-P1-07 estiver concluido se busca de posts estiver habilitada como superficie publica;
- nenhum caller publico operar por ID puro fora do Feed Service;
- share, deep-link e notification link preservarem Territory;
- auditoria estatica conseguir provar ausencia das operacoes proibidas em `FEED-GOVERNANCE.md`.

## 7. Status final

O dominio Feed possui um plano oficial de implementacao.
