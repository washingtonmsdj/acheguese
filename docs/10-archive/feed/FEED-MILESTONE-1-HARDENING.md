# FEED-MILESTONE-1-HARDENING.md

Sprint: FEED.MILESTONE.1.HARDENING

Status: hardening final do Milestone 1

Base obrigatoria:

- `docs/feed/FEED-MILESTONE-1.md`
- `docs/feed/FEED-MILESTONE-1-AUDIT.md`

Regra de escopo: esta nao e uma sprint funcional. Nao foram implementados comentarios, nao houve alteracao de GOVERNANCE, nao houve alteracao de ROADMAP e nao houve mudanca de arquitetura.

## 1. Objetivo

Eliminar exclusivamente o bloqueador arquitetural identificado em `docs/feed/FEED-MILESTONE-1-AUDIT.md`: hooks canonicos de Feed nao podem reapresentar dados previamente cacheados quando o `FeedContext` ou `FeedTarget` deixam de estar prontos.

## 2. Resultado

Status: concluido.

- M1-H1: concluido.
- M1-H2: concluido.
- M1-H3: concluido.

O Milestone 1 agora falha fechado tambem no retorno publico dos hooks, nao apenas no `enabled` da query.

## 3. Arquivos alterados

| Arquivo | Linhas principais | Motivo |
| --- | ---: | --- |
| `src/core/feed/hooks/useFeedTimeline.ts` | 40-43 | Mascara `query.data` quando `FeedContext` nao esta pronto e expoe `total = 0`. |
| `src/core/feed/hooks/useFeedItemDetail.ts` | 70-73 | Mascara `query.data` quando `FeedContext` ou `FeedTarget` nao estao prontos. |
| `src/core/feed/__tests__/useFeedTimeline.spec.tsx` | 163, 184, 208, 234 | Cobertura de cache pre-existente com contexto invalido, rollout perdido, AccessPolicy perdida e Territory invalido. |
| `src/core/feed/__tests__/useFeedItemDetail.spec.tsx` | 179, 195, 216, 241, 268 | Cobertura de cache pre-existente com contexto invalido, target invalido, rollout perdido, AccessPolicy perdida e Territory invalido. |

## 4. M1-H1 - useFeedTimeline

Antes:

- `useFeedTimeline()` desabilitava a query quando `validateFeedContext(context).isReady` era falso;
- mesmo assim, `posts` era derivado de `query.data`;
- se React Query tivesse cache para a chave atual, dados antigos poderiam permanecer no retorno.

Depois:

- `posts` so e derivado de `query.data` quando `contextValidation.isReady === true`;
- quando o contexto nao esta pronto, `posts = []`;
- quando o contexto nao esta pronto, `data = []`;
- quando o contexto nao esta pronto, `total = 0`;
- nenhum dado cacheado e reapresentado.

## 5. M1-H2 - useFeedItemDetail

Antes:

- `useFeedItemDetail()` desabilitava a query quando contexto ou target nao estavam prontos;
- mesmo assim, `detail` podia usar `query.data ?? unavailableDetail`.

Depois:

- `detail` so usa `query.data` quando `contextValidation.isReady === true` e `targetReady === true`;
- quando `FeedContext` falha, retorna somente `unavailableDetail`;
- quando `FeedTarget` falha, retorna somente `unavailableDetail`;
- cache antigo nao pode reabrir detalhe de item.

## 6. M1-H3 - Testes adicionados

Cobertura adicionada em timeline:

- cache pre-existente + `FeedContext` invalido;
- rollout perdido;
- AccessPolicy perdida;
- TerritoryFilter em mismatch com o Territory resolvido;
- retorno `posts = []`, `data = []` e `total = 0`.

Cobertura adicionada em detalhe:

- cache pre-existente + `FeedContext` invalido;
- cache pre-existente + `FeedTarget` invalido;
- rollout perdido;
- AccessPolicy perdida;
- TerritoryFilter em mismatch com o Territory resolvido;
- retorno `unavailableDetail` sem expor `query.data`.

## 7. Validacao executada

| Comando | Resultado |
| --- | --- |
| `npm run test -- src/core/feed` | Passou: 7 arquivos, 59 testes. |
| `npm run typecheck` | Passou. |
| `npm run lint` | Passou com 0 erros e 13 warnings pre-existentes de mapas fora do escopo. |
| `npm run build` | Passou. |
| `git diff --check -- <arquivos alterados>` | Passou. |

Observacao:

- Uma primeira tentativa de `npm run typecheck` em paralelo com lint/build estourou timeout local. O comando foi reexecutado sozinho com janela maior e passou.

## 8. Fora de escopo preservado

Nao foi implementado:

- comentarios;
- replies;
- reacoes;
- saves;
- share;
- URL canonica;
- busca;
- moderacao;
- realtime;
- edicao;
- exclusao;
- nova UX.

Nao foram alterados:

- `docs/feed/FEED-GOVERNANCE.md`;
- `docs/feed/FEED-ROADMAP.md`;
- `docs/feed/FEED-EXECUTION-PLAN.md`;
- `docs/feed/FEED-MILESTONE-1.md`;
- `docs/feed/FEED-MILESTONE-1-AUDIT.md`.

## 9. Aderencia

O hardening elimina o bloqueador arquitetural apontado na auditoria e preserva o boundary do Milestone 1.

A P0.D.1 ainda deve implementar comentarios pelo Feed, mas agora pode depender de timeline/detalhe sem risco de cache reapresentar conteudo quando o contexto deixar de ser valido.

Status final: Feed Milestone 1 pronto para Freeze parcial.
