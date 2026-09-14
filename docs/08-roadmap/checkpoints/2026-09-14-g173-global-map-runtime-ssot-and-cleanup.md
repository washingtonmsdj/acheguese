# G173 — Global Map Runtime SSOT and Cleanup

Data: 2026-09-14  
Status: implementado em `main`; validacao de runner/build/deploy ainda pendente

## Objetivo

Transformar as melhorias de mapa feitas durante a otimizacao da entrada publica em arquitetura reutilizavel, para que outras paginas recebam o mesmo runtime/worker/CSS/configuracao sem manter caminhos paralelos. Ao mesmo tempo, remover excecoes, hardcodes e ownership duplicado descobertos durante a migracao.

## SSOT global de mapas

Owners vigentes:

- `src/core/maps/runtime/loadMapLibreRuntime.ts` — carrega engine, CSS e configuracao de worker;
- `src/core/maps/runtime/maplibreRuntimeCss.ts` — unico owner do CSS do MapLibre;
- `src/core/maps/config/maplibreWorkerRuntime.ts` — unico owner do URL/configuracao do worker;
- `src/core/maps/components/v3/MapLibreAdapter.tsx` — owner React publico, com selecao entre runtime passivo e completo;
- `src/shared/config/mapDefaults.ts` — SSOT de estilos/defaults de mapa;
- `src/core/maps/providers/MapProvider.ts` — projecao do contrato compartilhado para o dominio de mapas.

Regra: pagina/modulo pode usar tipos de `maplibre-gl`, mas nao importa engine ou CSS diretamente quando o owner canonico atende o caso.

## Migracoes desta rodada

Foram removidos os ultimos imports diretos conhecidos em superficies de mobilidade:

- `src/core/mobility/components/RideTrackingMap.tsx`;
- `src/modules/mobility/pages/BuscandoMotoristaPage.tsx`.

Ambos agora usam `loadMapLibreRuntime()`, portanto herdam o mesmo CSS, worker e futuras otimizacoes do runtime canonico.

O import duplicado de `maplibre-gl/dist/maplibre-gl.css` tambem foi removido de `MapLibreAdapterRuntime.tsx`. O CSS passa a existir em um unico owner.

O bridge legado `src/core/maps/components/v3/LazyMapLibreAdapter.tsx` foi censado antes da remocao. Seus callers reais foram migrados diretamente para `MapLibreAdapter.tsx`:

- `src/core/nearby/components/NearbyMiniMap.tsx`;
- `src/core/business/components/NeighborhoodMap.tsx`;
- `src/app/components/territory-vivo/TerritoryMapPreview.tsx`;
- `src/app/features/business-landing/sections/EmpresasHeroSection.tsx`;
- barrel `src/core/maps/components/v3/index.ts`.

Depois de zerar esses callers, o bridge foi deletado. Nao existe mais owner publico paralelo para o adapter.

`tests/security/maplibre-runtime-security.test.ts` foi endurecido para:

- permitir um unico owner estatico da engine completa dentro do core;
- permitir um unico owner do CSS;
- exigir o loader canonico nos consumidores imperativos migrados;
- provar que o bridge `LazyMapLibreAdapter.tsx` nao existe;
- impedir novas excecoes em paginas/modulos.

## SSOT visual de mapas da mobilidade

Foram eliminados valores semanticos duplicados entre tracking e busca de motorista.

Novos owners:

- `src/core/mobility/constants/mapVisuals.ts` — cor/espessura/opacidade de rota e semantica visual de origem, destino e motorista;
- `src/core/mobility/utils/createMobilityMapMarkerElement.ts` — criacao DOM canonica dos markers de mobilidade.

Os consumidores deixaram de manter localmente:

- `#6366f1` para rota;
- verdes divergentes de origem (`#34d399` e `#22c55e`);
- `#ef4444` de destino;
- `#14b8a6` de motorista;
- borda/sombra/tamanho basico duplicados;
- fallback geografico hardcoded de Salvador (`-38.476`, `-12.975`).

O fallback de camera agora vem de `DEFAULT_CAMERA`, que por sua vez deriva do SSOT compartilhado de mapas.

Regressao: `tests/regression/mobility-map-visual-ssot.test.ts` protege esses contratos.

## Melhorias globais x exclusivas da `/`

### Globais

Devem permanecer nos owners canonicos e beneficiar qualquer pagina:

- carregamento da engine por `loadMapLibreRuntime()`;
- CSS unico;
- worker unico;
- runtime passivo/completo pelo adapter canonico;
- defaults/provider de tiles;
- visual semantico reutilizavel da mobilidade;
- ausencia de imports runtime/CSS paralelos;
- ausencia de bridge `LazyMapLibreAdapter`.

### Exclusivas da entrada publica

Podem permanecer especificas porque dependem da prioridade do primeiro viewport da `/`:

- `publicRootReadiness` para adiar fonte/ads/observabilidade/imagem secundaria;
- preload antecipado do style/TileJSON da primeira superficie;
- basemap-first antes do boundary GeoSalvador;
- skeleton page-native e sua transicao;
- `content-visibility` das secoes abaixo da dobra da entrada.

Essas regras nao devem ser copiadas mecanicamente para todas as paginas. Se outra superficie precisar da mesma politica de prioridade, a politica deve ser promovida para um owner generico em vez de duplicada.

## Limpeza adicional preservada

- favicon inicial nao usa mais o PNG de logo de ~128 KB;
- service worker nao precacheia esse logo pesado; imagens continuam cacheadas sob demanda;
- teste de budget do `<head>`/SW protege esse comportamento;
- `CURRENT_RULES.md` v4.9 registra o contrato global de MapLibre.

## Validacao

Nesta conversa nao houve runner capaz de executar Vitest/build no SHA final. O ambiente local disponivel nao conseguiu resolver `github.com` para clonar o repositorio. Portanto:

- regressoes foram atualizadas/criadas no source;
- nao ha declaracao de testes aprovados;
- nao ha declaracao de build aprovado;
- nao ha declaracao de deploy aprovado.

A certificacao pesada continua sendo o lugar correto para produzir build de producao e relatorio de bundle no mesmo SHA.

## Proximo passo recomendado

1. executar/capturar certificacao same-SHA quando houver runner disponivel;
2. usar o relatorio de bundle da `/` para escolher o proximo corte por bytes reais;
3. continuar a auditoria de consumidores de mapas para promover apenas ganhos reutilizaveis aos SSOTs globais;
4. remover qualquer compatibilidade/allowlist remanescente somente depois de comprovar que nao possui consumidor real.
