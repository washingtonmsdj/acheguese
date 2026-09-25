# FEED.P1.A Hardening Report

Data: 2026-07-28

Sprint: FEED.P1.A.HARDENING

Status: pronta para encerramento

## 1. Escopo

Hardening executado exclusivamente para eliminar o bloqueador `P1A-R1` documentado em `docs/feed/FEED-P1.A-REVIEW.md`.

Nao foram implementadas novas funcionalidades, nao houve alteracao de runtime, nao houve alteracao de arquitetura e nao houve alteracao de GOVERNANCE.

## 2. Arquivos Alterados

- `src/core/feed/__tests__/FeedService.spec.ts`
- `docs/feed/FEED-P1.A-HARDENING-REPORT.md`

## 3. H1 - `FeedService.updateItem()`

Cobertura direta adicionada ou consolidada:

- edicao valida por autor;
- ator sem permissao;
- `FeedTarget` invalido;
- item removido;
- mismatch territorial;
- rollout bloqueado;
- AccessPolicy bloqueada;
- garantia de que `FeedRepository.updateItem()` nao e chamado quando houver bloqueio.

Evidencias principais:

- `FeedService.spec.ts:1252` - autor edita com sucesso.
- `FeedService.spec.ts:1278` - ator sem permissao falha fechado.
- `FeedService.spec.ts:1297` - `FeedTarget` invalido falha antes do repository.
- `FeedService.spec.ts:1317` - item removido nao e atualizado.
- `FeedService.spec.ts:1337` - mismatch territorial nao atualiza.
- `FeedService.spec.ts:1356` - rollout bloqueado nao chama repository.
- `FeedService.spec.ts:1382` - AccessPolicy bloqueada nao chama repository.

## 4. H2 - `FeedService.deleteItem()`

Cobertura direta adicionada ou consolidada:

- autor autorizado;
- moderador autorizado;
- ator sem permissao;
- `FeedTarget` invalido;
- item removido;
- mismatch territorial;
- rollout bloqueado;
- AccessPolicy bloqueada;
- garantia de que `FeedRepository.deleteItem()` nao e chamado quando houver bloqueio.

Evidencias principais:

- `FeedService.spec.ts:1404` - autor exclui com sucesso.
- `FeedService.spec.ts:1427` - moderador exclui com permissao elevada.
- `FeedService.spec.ts:1454` - ator sem permissao falha fechado.
- `FeedService.spec.ts:1472` - `FeedTarget` invalido falha antes do repository.
- `FeedService.spec.ts:1491` - item removido nao e excluido.
- `FeedService.spec.ts:1510` - mismatch territorial nao exclui.
- `FeedService.spec.ts:1528` - rollout bloqueado nao chama repository.
- `FeedService.spec.ts:1553` - AccessPolicy bloqueada nao chama repository.

## 5. H3 - `FeedService.votePoll()`

Cobertura direta adicionada ou consolidada:

- `FeedTarget` invalido;
- item removido;
- mismatch territorial;
- rollout bloqueado;
- usuario ausente;
- AccessPolicy de reacao bloqueada;
- pollId divergente;
- voto valido;
- garantia de que `FeedRepository.votePoll()` nao e chamado quando houver bloqueio de contexto, target, visibilidade, territorio, rollout, usuario ou policy.

Evidencias principais:

- `FeedService.spec.ts:1574` - `FeedTarget` invalido falha antes do repository.
- `FeedService.spec.ts:1595` - item removido nao vota.
- `FeedService.spec.ts:1616` - mismatch territorial nao vota.
- `FeedService.spec.ts:1636` - rollout bloqueado nao chama repository.
- `FeedService.spec.ts:1663` - usuario ausente nao chama repository.
- `FeedService.spec.ts:1683` - AccessPolicy `canReact: false` nao chama repository.
- `FeedService.spec.ts:1708` - `pollId` divergente retorna `poll_not_found`.
- `FeedService.spec.ts:1734` - voto valido passa pelo repository.

Observacao tecnica: `pollId` divergente nao e bloqueio pre-repository no runtime atual. O pertencimento da enquete ao item validado e verificado no `FeedRepository.votePoll()`, que retorna `null`; o `FeedService.votePoll()` converte esse retorno em `poll_not_found`. Nenhuma alteracao runtime foi feita porque o comportamento existente ja falha fechado sem registrar voto valido.

## 6. Validacao Executada

| Comando | Resultado |
| --- | --- |
| `npm run test -- src/core/feed/__tests__/FeedService.spec.ts` | Passou: 1 arquivo, 78 testes. |
| `npm run test -- src/core/feed` | Passou: 12 arquivos, 152 testes. |
| `npm run typecheck` | Passou. |
| `npm run lint` | Passou com 13 warnings pre-existentes de mapas, sem erros. |
| `npm run build` | Passou. |

## 7. Aderencia A GOVERNANCE

Resultado: aderente ao hardening solicitado.

- Nenhuma operacao publica nova foi criada.
- Nenhum runtime foi alterado.
- Nenhuma regra de negocio foi alterada.
- A suite agora trava diretamente a falha fechada de `updateItem`, `deleteItem` e `votePoll`.
- `FeedContext`, `FeedTarget`, territorio, Rollout e AccessPolicy permanecem obrigatorios nos cenarios cobertos.

## 8. Riscos

Risco baixo.

O hardening adicionou apenas testes diretos sobre contratos ja existentes. A unica ressalva e que `pollId` divergente continua sendo validado dentro do repository, como ja ocorria, e nao exigiu alteracao de runtime.

## 9. Conclusao

O bloqueador `P1A-R1` foi eliminado.

A Sprint FEED.P1.A esta pronta para encerramento.
