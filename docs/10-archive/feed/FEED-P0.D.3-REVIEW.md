# FEED.P0.D.3.REVIEW

## Status

A Sprint FEED.P0.D.3 ainda nao atende integralmente aos criterios da GOVERNANCE.

O boundary principal de compartilhamento foi implementado: os callers publicos inspecionados passaram a usar `useShareFeedItem()`, que delega para `FeedService.shareItem()`, e nao foi encontrado acesso publico direto a `postShare.ts` ou `postService.recordPostShare()` para compartilhar item do Feed.

Permanece, porem, um bloqueador: `useShareFeedItem()` aceita qualquer pathname iniciado por `/comunidade` como base territorial do compartilhamento. Isso permite que um contexto valido gere uma URL nominal/global como `/comunidade?post=<id>` caso o hook seja executado em uma rota de comunidade sem base territorial completa. A repository falha fechado quando nao ha base, mas o hook injeta uma base fraca antes dessa validacao.

## Base Comparada

- `docs/feed/FEED-GOVERNANCE.md`
- `docs/feed/FEED-GOVERNANCE-CHANGELOG.md`
- `docs/feed/FEED-ROADMAP.md`
- `docs/feed/FEED-EXECUTION-PLAN.md`
- `docs/feed/FEED-P0.D.3-REPORT.md`

## Escopo Esperado Da P0.D.3

- `FeedService.shareItem()`
- Repository correspondente
- `useShareFeedItem()`
- `FeedQueryKeys` necessarias
- `FeedTarget` para compartilhamento
- Validacao obrigatoria de `FeedContext`, `FeedTarget`, `ResolvedTerritory`, `TerritoryFilter`, `Rollout` e `CommunityAccessPolicy`
- Falha fechada
- Nenhum acesso publico direto a `ShareService`, `postShare.ts` ou `postService.recordPostShare()`
- Nenhum compartilhamento global, nominal ou cross-territory

## Respostas Obrigatorias

### 1. Todo o escopo da P0.D.3 foi implementado?

Parcialmente.

Foram implementados o service, repository, hook, query key e callers publicos principais. A validacao do target e da visibilidade passa pelo Feed. Entretanto, o escopo nao pode ser considerado completo enquanto o hook aceitar `/comunidade` como base suficiente para gerar URL de compartilhamento.

### 2. Existe alguma implementacao pertencente a P1.B ou superior?

Nao foi identificado avanço funcional claro de P1.B ou superior.

A implementacao manteve um compartilhamento minimo com `?post=<id>`. A canonicalizacao completa de URL e a evolucao de deep-link permanecem fora do escopo atual.

### 3. Existe alguma violacao da GOVERNANCE?

Sim.

A GOVERNANCE exige que compartilhamento nao use fallback global ou nominal. O hook permite uma base derivada apenas de `window.location.pathname.startsWith("/comunidade")`, sem comprovar que a rota contem um territorio valido. Isso pode produzir URL global/nominal.

### 4. Ainda existe algum caminho publico acessando ShareService, postShare.ts ou postService.recordPostShare() diretamente?

Nao foi encontrado caminho publico de compartilhamento do Feed acessando diretamente `postShare.ts` ou `postService.recordPostShare()`.

O acesso a `postService.recordPostShare()` encontrado fica encapsulado em `FeedRepository.shareItem()`, como colaborador interno do boundary do Feed. As ocorrencias de `sharePost` em componentes publicos sao nomes de handler, nao importacoes do util legado.

### 5. Existe algum bypass ao FeedService para compartilhamento?

Nao foi identificado bypass publico para compartilhamento de item do Feed.

Os callers publicos inspecionados passam por `useShareFeedItem()` e, a partir dele, por `FeedService.shareItem()`.

### 6. FeedContext, FeedTarget, Territory, Rollout e CommunityAccessPolicy sao sempre validados antes do compartilhamento?

No service, sim.

`FeedService.shareItem()` valida o contexto e o target antes da operacao. O ponto pendente nao esta nessa validacao, mas na origem da base de URL usada pelo hook: a base pode ser aceita como territorial mesmo quando representa apenas `/comunidade`.

### 7. Existe algum cenario onde o compartilhamento possa gerar URL global, fallback nominal ou compartilhar item fora do territorio?

Sim.

Se `useShareFeedItem()` executar em `window.location.pathname = "/comunidade"` com `FeedContext` valido, o hook passa `/comunidade` como `basePath`. A repository consegue montar uma URL como `/comunidade?post=<id>`, que nao representa a base territorial exigida.

Nao foi encontrado cenario evidente de compartilhamento cross-territory quando `FeedTarget` e `FeedContext` sao validados pelo service, mas a base nominal/global ainda viola a regra de URL territorial.

### 8. Os testes realmente cobrem os cenarios exigidos?

Parcialmente.

Cobertura encontrada:

- `FeedContext` invalido
- rollout bloqueado
- `AccessPolicy` bloqueada
- `FeedTarget` invalido
- item removido
- item oculto
- mismatch territorial
- ausencia de base territorial na repository
- cancelamento do Web Share
- invalidao de cache/query key apos sucesso
- falha fechada quando o service retorna indisponivel

Lacuna:

- nao ha teste comprovando que `useShareFeedItem()` rejeita pathnames nao territoriais iniciados por `/comunidade`, como `/comunidade`, antes de gerar URL de share.

### 9. Existe algum risco de compatibilidade com P0.A, P0.B, P0.C, P0.E, P0.D.1 ou P0.D.2?

O risco de compatibilidade estrutural e baixo.

A implementacao preserva os boundaries ja criados para timeline, detail, create, mobility, comentarios, reacoes e saves. O risco remanescente e localizado na P0.D.3: URL de compartilhamento com base fraca.

### 10. Existe algum motivo tecnico para impedir o encerramento oficial da Sprint FEED.P0.D.3?

Sim.

Enquanto `useShareFeedItem()` puder gerar uma URL baseada apenas em `/comunidade`, a sprint nao cumpre a regra de compartilhamento sem fallback global/nominal.

## Findings

### Bloqueador - P0D3-R1 - Base de share aceita rota global de comunidade

Evidencia:

- `src/core/feed/hooks/useShareFeedItem.ts`
- `resolveBrowserBasePath()` aceita `window.location.pathname` quando ele apenas inicia com `/comunidade`.
- `src/core/feed/repositories/FeedRepository.ts`
- `resolveFeedShareUrl()` monta a URL final a partir do `basePath` recebido.

Impacto:

Alto. Um compartilhamento pode gerar URL nominal/global, quebrando a garantia de que todo share publico preserve base territorial.

Esforco estimado:

S.

Risco:

Baixo se corrigido apenas restringindo a base aceita e adicionando teste de regressao.

Dependencias:

Nenhuma dependencia externa. A decisao deve permanecer dentro do boundary atual de Feed/territory URL.

Correcao esperada em hardening:

- Rejeitar pathname `/comunidade` como base valida.
- Exigir base territorial resolvida ou `canonicalFeedUrl` auditavel.
- Adicionar teste do hook para garantir falha fechada quando a rota atual nao representa uma base territorial.

### Recomendacao - P0D3-R2 - Util legado postShare.ts permanece no codigo

Evidencia:

- `src/core/posts/utils/postShare.ts`

Impacto:

Medio. O arquivo nao parece ter caller publico atual para share do Feed, mas permanece como superficie legada que pode ser reintroduzida por engano.

Esforco estimado:

S.

Risco:

Baixo.

Observacao:

Nao bloqueia a P0.D.3 se nao houver import publico ativo. A remocao ou depreciacao formal pode ficar para hardening/freeze ou para a sprint de URLs canonicas.

### Melhoria futura - P0D3-R3 - Handoff de share em Profile permanece sensivel

Evidencia:

- `src/core/posts/hooks/usePostActions.ts`
- Chamadas sem `feedContext` falham fechado.

Impacto:

Baixo para GOVERNANCE do Feed. O comportamento preserva falha fechada, mas pode exigir decisao futura de UX/Profile para compartilhar historico pessoal sem abrir superficie publica fora do Feed.

Esforco estimado:

M.

Risco:

Medio se misturar Profile com Feed sem contrato explicito.

## Conclusao

A P0.D.3 consolidou o boundary publico de compartilhamento, mas ainda nao pode ser encerrada oficialmente. O bloqueador e especifico: a base de URL usada pelo hook precisa ser comprovadamente territorial, nao apenas um pathname com prefixo `/comunidade`.
