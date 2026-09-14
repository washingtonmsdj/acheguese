# G164 — Premium entry arrival loading

Data: 2026-09-14
Branch: `main`

## Objetivo

Substituir o skeleton genérico da entrada pública por uma experiência de chegada territorial premium, responsiva e honesta, sem pseudo-mapa nem geometria inventada.

## Implementação

- criado `TerritoryEntryMapArrival.tsx` como owner do loading visual da entrada;
- removido `TerritoryEntryMapSkeleton.tsx` do código ativo;
- wrapper e runtime usam a mesma experiência de chegada;
- globo central, halos discretos, identidade territorial e mensagens humanas substituem blocos de skeleton;
- mensagens rotativas:
  - `Procurando sua comunidade`;
  - `Preparando a casa para você se achegar`;
  - `Buscando o limite oficial do Complexo`;
  - `Tudo quase pronto para sua chegada`;
- três estágios visuais: `Comunidade`, `Mapa` e `Limite oficial`;
- fase das mensagens sincronizada por tempo para não reiniciar entre wrapper, Suspense e runtime;
- `prefers-reduced-motion` congela a narrativa e remove animações não essenciais;
- mobile permanece compacto para a área real de 10,5–12rem; expansão visual acontece apenas em `md/lg`;
- desktop ocupa integralmente a coluna do mapa;
- o mapa real continua oculto até MapLibre + boundary estabilizarem;
- timeout de falha continua limitado a 8s;
- nenhuma rua, bairro ou fronteira falsa é desenhada durante o loading.

## Regressão

`tests/regression/public/territory-entry-map-arrival.test.ts`

Protege:

- owner único de Arrival Loading;
- ausência do skeleton antigo;
- mensagens e estágios premium;
- continuidade entre fases;
- adaptação mobile/desktop;
- reduced motion;
- ausência de geometria falsa;
- transição somente após boundary estabilizar;
- timeout finito de falha.

## Certificação

O código e as regressões estão registrados na `main`, mas não considerar build/deploy/performance certificados sem execução verde do mesmo SHA.
