# G177 — Boundary Network Owner and Font Source Cleanup

Data: 2026-09-14  
Status: implementado em `main`; runner/build/deploy ainda não certificados

## Objetivo

Continuar o fechamento estrutural da entrada pública `/` e dos owners compartilhados expostos por ela, eliminando duas compensações que ainda permaneciam após G176:

1. um segundo caminho de leitura HTTP/cache/parser de FeatureServer dentro de `BoundaryService`;
2. um `@import` remoto de Google Fonts mantido no CSS-fonte e apagado apenas durante o build por um plugin PostCSS compensatório.

Baseline documental: G176.

## FeatureServer oficial passou a ter um único owner de rede

Antes deste checkpoint, `src/core/geospatial/data/officialFeatureServerBoundary.ts` já possuía o caminho canônico de boundary oficial com:

- validação de `source_url`/`source_object_id` e `official=true`;
- batching por FeatureServer;
- cache positivo/negativo controlado;
- deduplicação de promises pendentes;
- timeout de 7 segundos com `AbortController`;
- ausência de negative cache quando a requisição aborta/falha, permitindo retry posterior.

Apesar disso, `BoundaryService` ainda mantinha uma segunda implementação para a mesma fonte: parser próprio da metadata, `metadataSourceBoundaryCache`, montagem de URL ArcGIS e `fetch()` direto.

Essa duplicação foi removida.

`BoundaryService` agora apenas orquestra a precedência de fontes e delega a leitura da metadata oficial para:

`src/core/geospatial/data/officialFeatureServerBoundary.ts`

por meio de `loadOfficialFeatureServerBoundary(location)`.

Foram removidos de `BoundaryService`:

- `GeoJsonFeatureCollection` usado somente pelo segundo fetch;
- `metadataSourceBoundaryCache`;
- `getOfficialFeatureServerSource()`;
- montagem local de `/query`;
- `fetch()` direto e tratamento paralelo de HTTP/cache.

A precedência funcional foi preservada: fallback versionado/local, boundaries de banco quando aplicáveis, fonte oficial declarada, boundary versionado e centro canônico continuam sendo resolvidos pelo service conforme o contrato existente.

### Contrato de metadata endurecido

O teste de `BoundaryService` foi alinhado ao owner oficial. Uma localização que declara FeatureServer remoto precisa marcar a fonte como oficial (`official: true`), coerente com a governança territorial existente. O teste também passou a refletir o batch canônico `OBJECTID IN (...)` e `outFields=OBJECTID`.

## Ratchet contra segundo owner de FeatureServer

`tests/architecture/territory-polygon-resilience.test.ts` agora exige que:

- `BoundaryService` importe/use `loadOfficialFeatureServerBoundary`;
- `BoundaryService` não possua `metadataSourceBoundaryCache`;
- `BoundaryService` não recrie `getOfficialFeatureServerSource`;
- `BoundaryService` não execute `fetch()` de FeatureServer;
- cache, pending batches, parsing da fonte e fetch permaneçam no owner oficial.

Isso transforma a consolidação em fronteira arquitetural, não apenas refactor pontual.

## Google Fonts saiu do CSS crítico na origem

`src/index.css` ainda começava com um `@import` para `fonts.googleapis.com` usando `display=swap`.

A aplicação já possuía um caminho melhor para a entrada pública:

- `index.html` guarda a URL opcional em `data-public-font-stylesheet`, com `display=optional`;
- `src/main.tsx` cria o `<link rel="stylesheet">` somente depois da janela prioritária do primeiro mapa por `scheduleAfterPublicRootMap`;
- `<noscript>` preserva tipografia para navegação sem JavaScript.

O `@import` remoto foi removido diretamente de `src/index.css`. O arquivo agora começa pelos directives Tailwind e não abre conexão de fonte durante o parsing do CSS.

## Workaround PostCSS aposentado

`postcss.config.cjs` continha `stripDuplicateGoogleFontImport`, um plugin criado exclusivamente para apagar o `@import` remoto durante o build.

Depois da correção no source, esse plugin ficou sem responsabilidade válida e foi removido por completo. O PostCSS mantém apenas a poda separada de seletores legados da antiga entrada pública, além de Tailwind e Autoprefixer.

A poda de seletores antigos **não** foi removida nesta rodada: existe uma regressão própria que prova a ausência desses callers na página atual e preserva seletores ativos em regras mistas. Remover essa etapa exige limpeza precisa das regras antigas no grande `src/index.css`; não foi substituída por deleção ampla ou arriscada.

## Regressões

### Boundary

- `src/core/geospatial/services/__tests__/BoundaryService.spec.ts`
  - metadata oficial explícita;
  - shape de resposta compatível com o batch canônico;
  - query esperada `OBJECTID IN (112)`.
- `tests/architecture/territory-polygon-resilience.test.ts`
  - impede segundo cache/parser/fetch de FeatureServer dentro do service.

### Fontes

Novo `tests/regression/public/root-entry-font-source-boundary.test.ts` exige que:

- `src/index.css` não contenha `fonts.googleapis.com`;
- CSS-fonte não possua `@import` HTTP/HTTPS;
- PostCSS não contenha o antigo `stripDuplicateGoogleFontImport`;
- `index.html` + `main.tsx` continuem sendo o caminho adiado de fonte opcional com `display=optional` e `maxWaitMs: 2400`.

## Commits principais

- `9784dd74512f5c4b5e66ec4a641821d807f99e8e` — `Route BoundaryService FeatureServer reads through canonical owner`;
- `29580ea51749f50e79df2438100d488bc9d04ee1` — `Align BoundaryService tests with official boundary owner`;
- `06f16062cea8822e229c330a1ca633443a3d8409` — `Guard single official boundary network owner`;
- `a1e7c2fa81aff31070173ad8922b59dc198c4e23` — `Remove critical Google Fonts import from source CSS`;
- `1af25cf1f9416cb03ea98abd3490d468bbcc9919` — `Remove obsolete Google Fonts PostCSS workaround`;
- `1900d2fe03aa1bc7815c174f12b93e62300ed686` — `Guard deferred root font source without build workaround`.

Commits concorrentes de Auth continuaram entrando na `main` durante esta rodada e foram preservados; nenhuma atualização de ref forçada foi usada.

## Validação disponível

Esta conversa continua sem runner local capaz de executar Vitest, typecheck e build sobre o checkout final.

O status remoto deve ser consultado separadamente no SHA final. Um eventual `failure` do Vercel apontando para `build-rate-limit` continua significando indisponibilidade/quota do provider, não compilação reprovada e não certificação positiva.

Assim, G177 declara consolidação estrutural no source e regressões versionadas, não `MVP READY` nem build/deploy certificado.

## Próximos cortes

1. executar testes de boundary/font, arquitetura, typecheck e build no mesmo SHA quando houver runner;
2. fazer limpeza source-aware dos seletores antigos de `/` que hoje ainda são podados por `strip-dead-entry-legacy-selectors`, preservando regras mistas e removendo o plugin somente depois que o CSS-fonte estiver limpo;
3. continuar o censo do bootstrap enxuto por dependências globais e CSS que não pertencem ao primeiro paint;
4. manter basemap-first, boundary oficial sem aproximação e fonte opcional fora do caminho crítico.
