# FEED.P1.C Report

Data: 2026-07-28

## Objetivo

Eliminar exclusivamente o bloqueador `FRZ-B2` identificado em `FEED-FREEZE-AUDIT.md`, fazendo denuncias de itens e comentarios de Feed passarem pela porta publica canonica do dominio Feed.

## Resultado

Status: pronta para review.

`FeedService.reportTarget()` foi implementado como SSOT publico para denuncia de `FeedTarget` de tipo `item` e `comment`.

Novas denuncias de Feed agora validam antes da chamada ao repositorio:

- `FeedContext`;
- `ResolvedTerritory`;
- `TerritoryFilter`;
- `Rollout`;
- `CommunityAccessPolicy` via `FeedContext`;
- `canReport` derivado da authority de Community;
- `FeedTarget`;
- visibilidade publica do item;
- pertencimento territorial do item;
- pertencimento do comentario a arvore do item pai.

## Arquivos Alterados

- `src/core/feed/types.ts`
- `src/core/feed/services/FeedService.ts`
- `src/core/feed/repositories/FeedRepository.ts`
- `src/core/feed/queryKeys.ts`
- `src/core/feed/hooks/useReportFeedItem.ts`
- `src/core/feed/index.ts`
- `src/core/community/hooks/useModeration.ts`
- `src/core/community/hooks/page/useComunidadePage.ts`
- `src/core/community/components/comments/PostCommentsPanel.tsx`
- `src/core/feed/__tests__/FeedService.spec.ts`
- `src/core/feed/__tests__/FeedRepository.spec.ts`
- `docs/feed/FEED-P1.C-REPORT.md`

## Callers Migrados

Migrados para `FeedService.reportTarget()`:

- `src/core/community/hooks/useModeration.ts`
- `src/core/community/hooks/page/useComunidadePage.ts`
- `src/core/community/components/comments/PostCommentsPanel.tsx`

Fluxos cobertos:

- denuncia de post publico do Feed;
- denuncia de comentario publico do Feed;
- denuncia de comentario vinculada obrigatoriamente ao `parentItemId` do post.

## Responsabilidades Migradas

Antes:

- `useModeration()` chamava `communityReportService.report()` diretamente por `post_id` ou `comment_id`;
- a denuncia de comentario nao provava o territorio do item pai;
- a UI publica conseguia iniciar report sem passar pelo Feed boundary.

Depois:

- `useModeration()` preserva a API publica, mas internamente chama `useReportFeedItem()`;
- `useReportFeedItem()` chama `FeedService.reportTarget()`;
- `FeedService.reportTarget()` valida contexto, target, rollout, access policy, territorio e visibilidade;
- `FeedRepository.reportTarget()` encapsula `communityReportService.report()` como colaborador interno.

## Aderencia a GOVERNANCE

| Regra | Status | Evidencia |
| --- | --- | --- |
| Unica porta publica para denuncia de item/comentario de Feed | OK | `FeedService.reportTarget()` e `useReportFeedItem()` |
| Nenhuma denuncia por ID puro | OK | comentario exige `FeedTarget` com `parentItemId`; post exige `FeedTarget` item |
| Sem denuncia cross-territory | OK | detalhe do item pai passa por `FeedRepository.getDetail()` com `TerritoryFilter` |
| Sem fallback territorial silencioso | OK | ausencia de `FeedContext` falha fechado em `useModeration()` |
| Rollout obrigatorio | OK | `validateFeedContext()` bloqueia rollout ausente/inativo antes do repositorio |
| AccessPolicy obrigatoria | OK | `validateFeedContext()` bloqueia policy ausente/bloqueada e `reportTarget()` exige `canReport === true` antes do repositorio |
| Repositorio como colaborador interno | OK | `FeedRepository.reportTarget()` traduz target validado para `CommunityReportService` |

## Cobertura de Testes

Adicionada cobertura direta em `src/core/feed/__tests__/FeedService.spec.ts` para:

- denuncia valida de post;
- `FeedContext` invalido;
- rollout bloqueado;
- `AccessPolicy` bloqueada;
- reporter ausente;
- `canReport` bloqueado;
- `FeedTarget` invalido;
- item removido;
- item oculto;
- mismatch territorial;
- denuncia duplicada;
- denuncia valida de comentario;
- comentario sem item pai;
- comentario com item pai de outro territorio;
- comentario ausente na arvore do item pai.

Adicionada cobertura em `src/core/feed/__tests__/FeedRepository.spec.ts` para:

- traducao de `FeedTarget` validado para `communityReportService.report()`.

## Validacao Executada

- `npm run test -- src/core/feed`
  - Resultado: passou.
  - 12 arquivos de teste.
  - 168 testes.

- `npm run typecheck`
  - Resultado: passou.

- `npm run lint`
  - Resultado: passou com 13 warnings preexistentes de mapas fora do dominio Feed.

- `npm run build`
  - Resultado: passou.

## Compatibilidade

- A API publica de `useModeration()` foi preservada: `reportPostAsync` e `reportCommentAsync` continuam existindo.
- O comportamento de toast de sucesso/erro foi preservado.
- `PostCommentsPanel` continua usando `reportCommentAsync`, agora com `FeedContext`.
- `useComunidadePage` continua usando `reportPostAsync`, agora com `FeedContext`.
- Denuncias antigas continuam sendo lidas pelo fluxo legado; nenhuma migration ou alteracao de schema foi criada.

## Riscos

- `CommunityReportService` ainda nao possui colunas de territorio no payload persistido. A sprint mitigou isso validando o alvo territorialmente antes de registrar a denuncia, conforme permitido pelo plano: "incluir contexto territorial no payload quando suportado".
- `CommunityReportContentDialog` ainda atende alvos nao-Feed (`question`, `answer`, `lost_found_post`, `lost_found_comment`) por caminho legado. Isso nao foi migrado porque esses alvos nao sao `FeedTarget` e a P1.C proibiu alterar contratos ou criar novos conceitos. Nao faz parte do FRZ-B2 documentado para post/comentario de Feed.
- Denuncia de comentario agora valida a arvore atual de comentarios do item pai antes do report; em caso de falha de leitura, o fluxo deve falhar fechado via erro do repositorio.

## Rollback

Rollback tecnico minimo:

1. Reverter `useModeration()` para o caller anterior.
2. Reverter `useReportFeedItem()`, `FeedService.reportTarget()`, `FeedRepository.reportTarget()` e tipos associados.
3. Manter a regra de seguranca: mesmo em rollback, nenhuma leitura global de Feed deve ser reintroduzida.

Observacao: o rollback reabriria o bloqueador `FRZ-B2`; portanto deve ser usado apenas para recuperar runtime e seguido por correcao equivalente.

## Observacoes Fora de Escopo

- Reports de `classifieds`, `jobs`, `question`, `answer`, `lost_found` e `civic_reports` pertencem a outros dominios ou a contratos nao cobertos por `FeedTarget`.
- A sprint nao implementou Search, URL canonica, deep links, compartilhamento, timeline, comentarios, reacoes, saves, notificacoes ou realtime.

## Validacoes Obrigatorias

1. Existe apenas um boundary publico para denuncias de Feed?
   - Sim, para post e comentario de Feed: `FeedService.reportTarget()`.

2. Toda UI publica de Feed usa `FeedService.reportTarget()`?
   - Sim, os fluxos apontados no `FRZ-B2` foram migrados por `useModeration()` -> `useReportFeedItem()`.

3. Existe algum bypass?
   - Nao para denuncia de post/comentario de Feed.

4. `FeedContext` continua obrigatorio?
   - Sim.

5. Territory continua obrigatorio?
   - Sim.

6. Rollout continua obrigatorio?
   - Sim.

7. `CommunityAccessPolicy` continua obrigatoria?
   - Sim, via `FeedContext.accessPolicyDecision` e `canReport`.

8. `FeedTarget` continua obrigatorio?
   - Sim.

9. Falha fechada permanece em todos os cenarios?
   - Sim. Cenários invalidos retornam status bloqueado antes de `FeedRepository.reportTarget()`.

10. Os testes cobrem os cenarios criticos?
    - Sim, incluindo contexto invalido, target invalido, territory invalido/mismatch, rollout bloqueado, access bloqueada, item removido, item oculto, denuncia duplicada e denuncia valida.
