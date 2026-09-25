# FEED-P0.D.2-HARDENING-REPORT.md

Data: 2026-07-27

Sprint: FEED.P0.D.2.HARDENING

Status: pronta para encerramento

## 1. Base obrigatoria

Documentos usados:

- `docs/feed/FEED-P0.D.2-REPORT.md`
- `docs/feed/FEED-P0.D.2-REVIEW.md`

## 2. Escopo executado

Executado exclusivamente o bloqueador `P0D2-R1` registrado na review.

Nao houve alteracao de runtime, logica, arquitetura, GOVERNANCE ou contratos publicos.

## 3. Arquivos alterados

- `src/core/feed/__tests__/FeedService.spec.ts`
- `docs/feed/FEED-P0.D.2-HARDENING-REPORT.md`

## 4. Testes adicionados

Foram adicionados seis testes diretos no `FeedService`:

### FeedService.react()

- `item removido`: retorna `target_not_visible`, preserva `action = null`, `reactions = null` e nao chama `repository.react()`.
- `mismatch territorial`: retorna `territory_mismatch`, preserva `action = null`, `reactions = null` e nao chama `repository.react()`.
- `FeedTarget invalido`: retorna `target_invalid`, nao chama `repository.getDetail()` e nao chama `repository.react()`.

### FeedService.saveItem()

- `item removido`: retorna `target_not_visible`, preserva `action = null`, `reactions = null` e nao chama `repository.saveItem()`.
- `mismatch territorial`: retorna `territory_mismatch`, preserva `action = null`, `reactions = null` e nao chama `repository.saveItem()`.
- `FeedTarget invalido`: retorna `target_invalid`, nao chama `repository.getDetail()` e nao chama `repository.saveItem()`.

## 5. Evidencia de P0D2-H3

Os testes comprovam explicitamente:

- `validateEngagementTarget()` indiretamente pelo comportamento de `react()` e `saveItem()` antes da mutation;
- `resolveFeedItemVisibility()` pelo caso `is_removed: true`, que passa por `getDetail()` como item encontrado e mesmo assim retorna `target_not_visible`;
- falha fechada antes do `FeedRepository`, validada por `repository.react` e `repository.saveItem` nao chamados;
- falha fechada antes de buscar detalhe quando o `FeedTarget` nao e `item`, validada por `repository.getDetail` nao chamado.

## 6. Validacao obrigatoria

Executado:

- `npm run test -- src/core/feed` - passou: 11 arquivos, 108 testes.
- `npm run typecheck` - passou.
- `npm run lint` - passou com 13 warnings preexistentes de mapas fora do escopo.
- `npm run build` - passou.

Warnings fora do escopo:

- `src/app/pages/AchegueSeHomePage.tsx`
- `src/app/pages/AchegueSeHomePageMap.tsx`
- `src/app/pages/OnboardingPage.tsx`
- `src/app/pages/PreLaunchTerritoryMap.tsx`

Os warnings sao da regra `maps/no-manual-entity-projection` e nao envolvem Feed, reacoes, saves ou P0.D.2.

## 7. Aderencia a review

Bloqueador eliminado:

- `P0D2-R1 - Cobertura obrigatoria incompleta para alvo removido e mismatch nas mutations`

Como os testes agora cobrem diretamente item removido, mismatch territorial e `FeedTarget` invalido para `FeedService.react()` e `FeedService.saveItem()`, a evidencia exigida pela review foi completada.

## 8. Riscos

Risco tecnico: baixo.

Justificativa:

- nao houve runtime change;
- os testes apenas exercitam comportamento ja implementado;
- nenhum contrato publico foi alterado;
- nenhuma sprint futura foi antecipada.

## 9. Rollback

Rollback tecnico:

1. Remover os seis testes adicionados em `src/core/feed/__tests__/FeedService.spec.ts`.
2. Remover este relatorio.

Rollback nao deve alterar `FeedService`, `FeedRepository`, hooks ou callers publicos, porque esta hardening nao modificou runtime.

## 10. Conclusao

A Sprint FEED.P0.D.2.HARDENING eliminou o bloqueador documental da review sem alterar comportamento de produto.

Status final: A Sprint FEED.P0.D.2 esta pronta para encerramento.
