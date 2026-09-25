# FEED.P0.E - Review

Data: 2026-07-25

## Escopo da Review

Auditoria exclusiva da Sprint `FEED.P0.E`, comparando:

- `docs/feed/FEED-GOVERNANCE.md`
- `docs/feed/FEED-ROADMAP.md`
- `docs/feed/FEED-EXECUTION-PLAN.md`
- `docs/feed/FEED-P0.E-REPORT.md`

Nao foi alterado codigo. Esta review apenas registra aderencia, desvios e bloqueadores.

## Veredito

**A Sprint FEED.P0.E ainda nao atende aos criterios da governanca.**

A migracao principal foi feita: a leitura nominal de `ride_share` em Mobility saiu de `PostService.getPostsByType("ride_share")` e passou por `FeedService.listRideShareItems()`.

Porem existem dois bloqueadores:

1. o hook pode devolver dados ja presentes no cache mesmo quando o `FeedContext` atual nao esta valido;
2. a query especifica de `ride_share` nao aplica os mesmos filtros publicos de visibilidade da timeline canonica (`is_hidden=false`, `is_removed=false`).

## Findings

### P0E-REV-01 - Falha fechada incompleta por reaproveitamento de cache

Status: bloqueador.

Evidencia:

- `src/modules/mobility/hooks/useCommunityPosts.ts:69-76`
- `src/modules/mobility/hooks/useCommunityPosts.ts:139-140`

O hook calcula `canReadRideSharePosts` e desabilita a query quando o contexto nao esta pronto. Isso impede nova consulta.

Mas o retorno continua sendo:

```ts
posts: data || []
```

Em TanStack Query, uma query `enabled: false` ainda pode retornar dados ja existentes no cache para a mesma `queryKey`. Como a chave continua baseada no `territoryFilter`, um contexto que ficou invalido por rollout, access policy ou mismatch operacional pode continuar exibindo dados cacheados daquele mesmo territorio.

Impacto:

- um caller publico pode continuar vendo `ride_share` com `FeedContext` invalido;
- a regra de falha fechada de `FEED-GOVERNANCE.md` nao fica plenamente garantida;
- os testes atuais nao exercitam cache preexistente com contexto invalidado.

Criterio pendente:

- quando `isFeedContextReady(feedContext)` for falso, o hook deve retornar lista vazia independentemente de cache.

### P0E-REV-02 - Leitura `ride_share` nao aplica filtros publicos de visibilidade

Status: bloqueador.

Evidencia:

- `src/core/feed/repositories/FeedRepository.ts:137-154`
- `src/core/posts/services/posts.queries.ts:228-271`
- comparativo com `src/core/posts/services/posts.feed.queries.ts:170-172`

`FeedRepository.listRideShareItems()` delega para `postService.getPostsByType("ride_share")` com `TerritoryFilter`.

O filtro territorial foi aplicado corretamente, mas `getPostsByType()` filtra apenas:

```ts
.eq("is_published", true)
```

A timeline canonica filtra tambem:

```ts
.eq("is_hidden", false)
.eq("is_removed", false)
```

Impacto:

- posts ocultos ou removidos podem aparecer na leitura publica de Mobility se estiverem marcados como publicados;
- isso viola a entidade `FeedVisibility` da governanca e enfraquece a promessa de que Feed controla estado publico do item;
- o novo caminho `FeedService.listRideShareItems()` nao possui filtro posterior de `resolveFeedItemVisibility()`.

Criterio pendente:

- leitura publica de `ride_share` deve aplicar os mesmos filtros de visibilidade publica da timeline canonica ou filtrar via Feed antes de retornar.

### P0E-REV-03 - Rollback documentado reintroduz o comportamento inseguro

Status: pendente documental.

Evidencia:

- `docs/feed/FEED-P0.E-REPORT.md:176-181`
- `docs/feed/FEED-EXECUTION-PLAN.md:504-507`

O relatorio da sprint diz que o rollback deve reverter `useCommunityPosts()` para a leitura anterior e reconhece que isso restauraria a leitura global de `ride_share`.

O plano oficial exige o contrario:

- reverter componentes de Mobility, mas manter guarda que impede query global sem Territory;
- retornar Empty State em vez de consultar globalmente.

Impacto:

- rollback operacional descrito nao e seguro;
- em contingencia, a orientacao reabre exatamente o vazamento que a P0.E deveria eliminar.

Criterio pendente:

- ajustar o rollback para manter a guarda territorial mesmo ao reverter a integracao visual.

### P0E-REV-04 - Cobertura de testes nao prova todos os cenarios criticos

Status: pendente.

Evidencia:

- `src/modules/mobility/hooks/useCommunityPosts.spec.tsx:79-120`
- `src/core/feed/__tests__/FeedService.spec.ts:187-217`
- `src/core/feed/__tests__/FeedRepository.spec.ts:72-120`

Cobertura existente:

- FeedContext ausente no hook;
- query key territorial para location;
- scope `none` no repository;
- bairro individual;
- grupo territorial;
- delegacao pelo FeedService.

Lacunas:

- cache preexistente com `FeedContext` invalido;
- rollout/access policy invalidos especificamente em `listRideShareItems()`;
- item `ride_share` hidden/removed;
- cidade como caso explicito previsto no plano de execucao;
- smoke de tela de mobilidade previsto no plano.

Impacto:

- os testes confirmam a migracao principal, mas nao provam falha fechada completa nem visibilidade publica.

## Respostas Obrigatorias

### 1. Todo o escopo da P0.E foi implementado?

**Parcialmente.**

Implementado:

- caller nominal de Mobility passou a chamar `FeedService.listRideShareItems()`;
- chamada global direta a `getPostsByType("ride_share")` foi removida do hook publico;
- `TerritoryFilter` e cache territorial foram introduzidos;
- sem `feedContext` o hook nao dispara nova query.

Pendente:

- garantir lista vazia mesmo quando houver cache e o contexto atual estiver invalido;
- aplicar filtros de visibilidade publica em `ride_share`;
- alinhar rollback com o plano oficial.

### 2. Existe algo implementado que pertence a P0.D ou superior?

**Nao como nova implementacao da P0.E.**

Comentarios e reacoes continuam presentes em `useCommunityPosts()` via `CommentService` e `PostEngagementService`, mas isso e legado ja reconhecido como escopo futuro de P0.D. A P0.E nao ampliou esses fluxos.

### 3. Existe alguma violacao da GOVERNANCE?

**Sim.**

Violacoes encontradas:

- falha fechada incompleta por possibilidade de retorno de cache com contexto invalido;
- leitura publica sem filtro equivalente de `FeedVisibility` para hidden/removed.

Tambem permanece uma divida fora do escopo P0.E:

- comentarios e reacoes ainda operam por dominios atomicos, aguardando P0.D.

### 4. Ainda existe algum fluxo publico de leitura de `ride_share` acessando PostService diretamente?

**Nao foi encontrado caller publico direto.**

Busca estatica encontrou apenas:

- `FeedRepository.listRideShareItems()` chamando `postService.getPostsByType("ride_share")`;
- testes do `FeedRepository`.

Isso esta dentro da excecao permitida pela governanca, desde que o service tenha validado o contexto antes.

### 5. Existe algum caller publico que consiga listar `ride_share` sem FeedContext valido?

**Sim, por cache.**

Nao ha nova consulta ao backend sem contexto valido. Porem o hook pode devolver `data` cacheado quando `enabled=false`, se a `queryKey` for a mesma de um contexto anteriormente valido.

### 6. Territory, Rollout e AccessPolicy sao sempre validados antes da leitura?

**Parcialmente.**

Antes de consultar o repository, `FeedService.listRideShareItems()` chama `validateFeedContext()`, que valida:

- `ResolvedTerritory`;
- `TerritoryFilter`;
- Rollout;
- AccessPolicy.

Mas o hook ainda pode retornar cache sem passar por nova leitura quando o contexto fica invalido.

### 7. Existe alguma chave de cache territorial ausente ou que possa causar vazamento entre bairros?

**Nao ha chave ausente entre bairros.**

`feedQueryKeys.rideShare()` inclui:

- namespace do Feed;
- escopo `ride-share`;
- `territoryFilterKey`;
- busca;
- categoria.

O risco nao e vazamento entre bairros por chave ausente. O risco e retorno de cache do mesmo territorio quando o contexto atual deixou de ser valido.

### 8. Existe algum bypass ao FeedRepository para leitura publica de `ride_share`?

**Nao foi encontrado bypass de leitura publica.**

O caminho atual e:

```text
CommunityRideFeed
  -> useCommunityPosts
  -> FeedService.listRideShareItems()
  -> FeedRepository.listRideShareItems()
  -> PostService.getPostsByType("ride_share", { territoryFilter })
```

### 9. Os testes realmente cobrem FeedContext ausente, TerritoryFilter, cache territorial, falha fechada, grupo territorial e bairro individual?

**Parcialmente.**

Cobrem:

- FeedContext ausente no hook;
- `TerritoryFilter` em repository;
- cache key territorial para location;
- falha fechada para `scope: none`;
- grupo territorial;
- bairro individual.

Nao cobrem:

- cache com dados preexistentes quando o contexto passa a invalido;
- rollout/access policy invalidos especificamente em `listRideShareItems()`;
- hidden/removed;
- cidade;
- smoke de tela de mobilidade.

### 10. O rollback descrito restaura completamente o comportamento anterior?

**Sim, mas isso e um problema.**

O rollback descrito restaura a leitura global anterior de `ride_share`, o que contradiz o `FEED-EXECUTION-PLAN.md`, que exige manter uma guarda contra query global sem Territory mesmo durante rollback.

## Conclusao

A P0.E avancou corretamente na direcao arquitetural esperada, mas ainda nao pode ser considerada oficialmente concluida.

Bloqueadores para encerramento:

1. impedir retorno de dados cacheados quando `FeedContext` nao estiver valido;
2. aplicar filtros publicos de visibilidade em `ride_share`;
3. corrigir rollback para nao reintroduzir consulta global;
4. completar testes dos cenarios criticos pendentes.

Status final: **a Sprint FEED.P0.E ainda nao atende aos criterios da governanca.**
