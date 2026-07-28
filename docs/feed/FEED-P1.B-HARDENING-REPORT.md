# FEED.P1.B-HARDENING-REPORT

## Sprint

FEED.P1.B.HARDENING

## Objetivo

Eliminar exclusivamente o bloqueador `P1B-R1` registrado em `docs/feed/FEED-P1.B-REVIEW.md`.

Esta etapa nao implementou funcionalidades novas, nao alterou runtime, nao alterou arquitetura e nao modificou GOVERNANCE.

## Base obrigatoria

- `docs/feed/FEED-P1.B-REPORT.md`
- `docs/feed/FEED-P1.B-REVIEW.md`

## Resultado

O bloqueador `P1B-R1` foi eliminado.

A suite agora possui cobertura direta para os gates obrigatorios da P1.B em:

- `FeedService.resolveCanonicalUrl()`;
- `FeedService.searchItems()`;
- ausencia de fallback global para URL de post.

## Arquivos alterados

- `src/core/feed/__tests__/FeedService.spec.ts`
- `src/core/feed/__tests__/FeedRepository.spec.ts`
- `docs/feed/FEED-P1.B-HARDENING-REPORT.md`

## Testes adicionados

### H1 - `FeedService.resolveCanonicalUrl()`

Foram adicionados testes diretos garantindo que nenhuma URL canonica e emitida quando:

- rollout bloqueia o `FeedContext`;
- `AccessPolicy` bloqueia a visibilidade da timeline;
- `TerritoryFilter` nao corresponde ao `ResolvedTerritory`.

Em todos os cenarios:

- `result.url` permanece `null`;
- `result.status` permanece `context_invalid`;
- `contextValidation.reason` registra a causa especifica;
- `FeedRepository.getDetail()` nao e chamado;
- `FeedRepository.resolveCanonicalUrl()` nao e chamado.

### H2 - `FeedService.searchItems()`

Foram adicionados testes diretos garantindo que a busca falha fechado quando:

- rollout bloqueia o `FeedContext`;
- `AccessPolicy` bloqueia a visibilidade da timeline;
- `TerritoryFilter` nao corresponde ao `ResolvedTerritory`.

Em todos os cenarios:

- `items` retorna `[]`;
- `status` retorna `context_invalid`;
- `contextValidation.reason` registra a causa especifica;
- `FeedRepository.searchItems()` nao e chamado.

### H3 - ausencia de fallback global

Foi reforcada a cobertura do `FeedRepository` para provar que:

- `/comunidade` nao gera URL de post;
- `/comunidade/ba` nao gera URL de post;
- bases nominais/incompletas como `/comunidade/pituba` falham fechado;
- base absoluta incompleta como `https://www.acheguese.com.br/comunidade` falha fechado;
- `LAUNCH_URLS.community` nao e usado como fallback implicito quando nao existe `basePath` nem `canonicalFeedUrl`.

## Runtime

Nenhum arquivo de runtime foi alterado.

Os testes adicionados confirmaram que o comportamento existente ja falhava fechado nos cenarios exigidos pela review.

## Aderencia a GOVERNANCE

Atendida para o escopo da P1.B.

- URL canonica continua dependendo de `FeedContext`, `ResolvedTerritory`, `TerritoryFilter`, `Rollout`, `CommunityAccessPolicy` e `FeedTarget`.
- Search de posts continua passando por `FeedService.searchItems()`.
- Nenhuma URL nominal/global e emitida.
- Nenhum fallback para `LAUNCH_URLS.community` foi reintroduzido.
- O repository nao e chamado quando os gates falham.

## Validacao executada

```bash
npm run test -- src/core/feed src/core/search
```

Resultado: passou. 13 arquivos de teste, 195 testes.

```bash
npm run lint
```

Resultado: passou sem erros. Permanecem 13 warnings pre-existentes de `maps/no-manual-entity-projection` em telas de mapa fora do escopo.

```bash
npm run build
```

Resultado: passou.

```bash
npm run typecheck
```

Resultado: passou.

Observacao: uma tentativa inicial de `typecheck` estourou timeout enquanto concorria com outras validacoes. A execucao final isolada foi capturada e passou.

## Riscos

Baixo.

As alteracoes sao somente de testes e documentacao. Nao houve mudanca de API publica, runtime, contrato, repository ou service.

## Rollback

Rollback tecnico:

1. Reverter os testes adicionados em `src/core/feed/__tests__/FeedService.spec.ts`.
2. Reverter o teste de fallback global reforcado em `src/core/feed/__tests__/FeedRepository.spec.ts`.
3. Remover `docs/feed/FEED-P1.B-HARDENING-REPORT.md`.

Esse rollback nao altera runtime e nao reabre os fluxos ja migrados da P1.B.

## Conclusao

`P1B-R1` foi eliminado.

A Sprint FEED.P1.B esta pronta para encerramento.
