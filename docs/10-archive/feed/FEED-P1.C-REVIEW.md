# FEED.P1.C Review

Data: 2026-07-28

## Escopo

Revisao exclusiva da Sprint `FEED.P1.C`, comparando:

- `docs/feed/FEED-GOVERNANCE.md`
- `docs/feed/FEED-ROADMAP.md`
- `docs/feed/FEED-EXECUTION-PLAN.md`
- `docs/feed/FEED-P1.C-REPORT.md`
- `docs/feed/FEED-FREEZE-AUDIT.md`

Nao houve alteracao de codigo nesta review.

## Veredito

Status: a Sprint `FEED.P1.C` pode ser considerada oficialmente concluida.

O bloqueador `FRZ-B2` foi eliminado para os fluxos publicos de Feed cobertos pela auditoria original:

- denuncia de post;
- denuncia de comentario;
- denuncia de comentario com item pai obrigatorio.

## Evidencias Principais

| Area | Evidencia | Status |
| --- | --- | --- |
| SSOT publico | `FeedService.reportTarget()` existe e e chamado por `useReportFeedItem()` | OK |
| Repository boundary | `FeedRepository.reportTarget()` encapsula `communityReportService.report()` | OK |
| Caller publico de post | `useComunidadePage` usa `useModeration({ feedContext })` | OK |
| Caller publico de comentario | `PostCommentsPanel` usa `useModeration({ feedContext })` | OK |
| Contexto obrigatorio | `useModeration()` falha se `feedContext` estiver ausente | OK |
| Territory obrigatorio | `validateFeedContext()` exige `ResolvedTerritory` e `TerritoryFilter` compativel | OK |
| Rollout obrigatorio | `validateFeedContext()` bloqueia rollout pending, blocked ou inactive | OK |
| AccessPolicy obrigatoria | `validateFeedContext()` exige policy ready e `reportTarget()` exige `canReport === true` | OK |
| Item pai de comentario | comentario exige `parentItemId` e a arvore de comentarios do post pai deve conter o comentario | OK |
| Item removido/oculto | detalhe resolve visibilidade e bloqueia `removed`, `hidden` e `unavailable` | OK |

## Findings

### Recomendacao - P1C-R1 - Restringir o dialog generico para nao aceitar targets de Feed no futuro

Classificacao: Recomendacao.

O `CommunityReportContentDialog` ainda chama `communityReportService.report()` diretamente, mas os callers atuais encontrados usam apenas alvos nao-Feed:

- `question`;
- `answer`;
- `lost_found_post`.

Nao foi encontrado caller publico atual usando esse dialog para `post` ou `comment`. Portanto isso nao reabre o `FRZ-B2`.

Risco residual: o tipo `CommunityReportTargetType` ainda inclui `post` e `comment`, entao um caller futuro poderia usar o dialog generico de forma incorreta e recriar bypass de Feed. A recomendacao e restringir esse componente a non-Feed targets ou documentar/validar explicitamente que `post` e `comment` devem usar `FeedService.reportTarget()`.

Impacto: medio.

Esforco: S.

Risco: baixo, se tratado como hardening posterior.

Bloqueia encerramento da P1.C: nao.

## Respostas Obrigatorias

### 1. O bloqueador FRZ-B2 foi totalmente eliminado?

Sim, para o escopo definido pelo `FRZ-B2`: denuncias publicas de posts e comentarios de Feed.

Antes, `useModeration()` chamava `communityReportService.report()` diretamente para `post` e `comment`. Agora, esses fluxos passam por:

`UI -> useModeration() -> useReportFeedItem() -> FeedService.reportTarget() -> FeedRepository.reportTarget() -> CommunityReportService`.

### 2. Existe ainda algum caller publico denunciando posts ou comentarios sem passar por FeedService.reportTarget()?

Nao foi encontrado caller publico atual denunciando `post` ou `comment` fora de `FeedService.reportTarget()`.

O uso direto remanescente de `communityReportService.report()` esta no dialog generico de reports para alvos nao-Feed e nos testes do proprio service.

### 3. Existe algum bypass ao FeedRepository para denuncias?

Nao para denuncias de post/comentario de Feed.

O unico acesso ao colaborador interno `CommunityReportService` no boundary do Feed ocorre dentro de `FeedRepository.reportTarget()`.

### 4. FeedContext continua obrigatorio?

Sim.

`FeedReportTargetInput` exige `context: FeedContext`, `useModeration()` falha quando `feedContext` esta ausente e `FeedService.reportTarget()` chama `validateFeedContext()` antes de qualquer report.

### 5. ResolvedTerritory continua obrigatorio?

Sim.

`validateFeedContext()` exige `resolvedTerritory` por padrao e rejeita contexto sem territorio resolvido.

### 6. Rollout continua obrigatorio?

Sim.

`validateFeedContext()` exige rollout `ready`, sem loading, ativo e nao bloqueado.

### 7. CommunityAccessPolicy continua obrigatoria?

Sim.

`validateFeedContext()` exige policy `ready`, sem loading e com permissao de visualizar timeline. Alem disso, `FeedService.reportTarget()` exige `canReport === true` antes de chamar `FeedRepository.reportTarget()`.

### 8. FeedTarget continua obrigatorio?

Sim.

Post exige `FeedTarget` de tipo `item` com `id` valido. Comentario exige `FeedTarget` de tipo `comment` com `id` e `parentItemId`.

### 9. Existe algum cenario onde uma denuncia possa ocorrer sem as garantias exigidas?

Nao foi identificado cenario de denuncia de Feed que consiga persistir sem as garantias exigidas.

| Cenario | Resultado |
| --- | --- |
| Sem territorio | `context_invalid` antes do report |
| Cross-territory | `territory_mismatch` antes do report |
| Sem item pai valido | `target_invalid` ou `target_not_found` antes do report |
| Item removido | `target_not_visible` antes do report |
| Item oculto | `target_not_visible` antes do report |
| Sem FeedContext | erro fechado em `useModeration()` e contexto invalido no service |

### 10. Os testes realmente cobrem os cenarios criticos?

Sim.

`src/core/feed/__tests__/FeedService.spec.ts` cobre diretamente:

- `FeedContext` invalido;
- `FeedTarget` invalido;
- rollout bloqueado;
- `AccessPolicy` bloqueada;
- `canReport = false`;
- reporter ausente;
- item removido;
- item oculto;
- mismatch territorial;
- denuncia duplicada;
- comentario fora da arvore do item pai;
- comentario sem item pai;
- comentario cujo post pai pertence a outro territorio;
- denuncia valida de post;
- denuncia valida de comentario.

`src/core/feed/__tests__/FeedRepository.spec.ts` cobre a traducao de um `FeedTarget` validado para `communityReportService.report()`.

### 11. Existe algum motivo tecnico para impedir o encerramento oficial da Sprint FEED.P1.C?

Nao.

O unico ponto residual identificado e uma recomendacao preventiva sobre `CommunityReportContentDialog`, mas nao ha caller publico atual de `post` ou `comment` usando esse caminho e os alvos atuais desse dialog estao fora do contrato `FeedTarget`.

## Compatibilidade Com GOVERNANCE

| Regra | Resultado |
| --- | --- |
| F15: nenhuma denuncia sem contexto territorial do alvo | Atendida para post/comentario de Feed |
| Porta publica unica para denuncia de Feed | Atendida por `FeedService.reportTarget()` |
| Nenhum componente publico denuncia post/comentario por ID puro | Atendido nos callers atuais |
| Nenhum comentario denunciado apenas por `comment_id` | Atendido; `parentItemId` e arvore do post pai sao obrigatorios |
| Nenhum bypass ao repository | Atendido para Feed |

## Conclusao

A Sprint `FEED.P1.C` atende aos criterios da GOVERNANCE para denuncias de posts e comentarios do Feed.

O encerramento oficial pode ocorrer.
