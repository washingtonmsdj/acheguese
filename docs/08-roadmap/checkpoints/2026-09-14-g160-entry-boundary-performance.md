# G160 — entrada oficial do Complexo + performance do caminho inicial

**Data:** 2026-09-14  
**Baseline anterior:** `10f41a7139f7a38d3ce3fdf66c52c3323335ab90` (G159)  
**Source HEAD antes deste checkpoint:** `84edbda57746a8960b2329c0e6ddb2bab77aa1fc`  
**Git compare:** `ahead_by=26`, `behind_by=0` em relação ao G159.

## Escopo concluído

### 1. Boundary do Complexo deixou de usar desenho inventado

- removido o `fallback_boundary_rings` manual do Nordeste de Amaralina;
- fallback público do grupo agora representa os quatro membros reais:
  - Nordeste de Amaralina — GeoSalvador `OBJECTID 112`;
  - Santa Cruz — `OBJECTID 142`;
  - Vale das Pedrinhas — `OBJECTID 163`;
  - Chapada do Rio Vermelho — `OBJECTID 54`;
- fonte oficial: GeoSalvador `bairros_app_dados_2010_e_2022`;
- a entrada não renderiza boundary parcial do grupo como se fosse o Complexo inteiro;
- se qualquer membro não tiver geometria disponível, nenhum contorno incompleto é mostrado.

### 2. Resolução territorial correta na entrada

- `TerritoryEntryPage` resolve o `TerritorialGroup` canônico do Complexo em vez de procurar o Complexo como `Location`;
- fallback territorial continua fail-safe, mas não fabrica geometria;
- os quatro membros do grupo são preservados no caminho de fallback.

### 3. Caminho inicial de renderização ficou mais leve

- `AppLayoutRoutes` deixou de ser importado de forma eager pelo caminho `/`;
- `/` é resolvido diretamente antes da grande árvore interna de rotas;
- `PreLaunchLandingPage` passou a ser lazy e não entra no bundle normal com lockdown desligado;
- repositório de locations, módulo territorial e fallback territorial são carregados por `import()` somente depois do primeiro paint/idle;
- a resolução de cidade/grupo é agendada com `scheduleBrowserIdleWork`.

### 4. Mapa pesado saiu do bundle e da CPU inicial

- `TerritoryEntryMap.tsx` agora é apenas wrapper leve de viewport + idle;
- boundary, MapProvider e MapLibre foram movidos para `TerritoryEntryMapRuntime.tsx`;
- runtime só é solicitado quando o mapa está próximo da viewport (`rootMargin: 240px`) e o browser concede idle, com timeout de segurança;
- `MapLibreAdapter` continua lazy dentro do runtime;
- consultas de boundary só começam quando o runtime realmente monta;
- mapa de entrada continua `interactive={false}`, sem clustering, sem marcador de usuário e sem controles desnecessários.

### 5. Imagem da comunidade deixou de competir com o primeiro paint

- `loading="lazy"`;
- `decoding="async"`;
- `fetchPriority="low"`;
- regressão limita `hero-complexo-nordeste.jpg` a no máximo `450_000` bytes enquanto não houver substituto WebP/AVIF menor.

## Regressões adicionadas/fortalecidas

- `tests/regression/public/territory-entry-map-group-boundary.test.ts`;
- `tests/regression/public/territory-entry-official-complex-boundary.test.ts`;
- `tests/regression/public/root-entry-community-first.test.ts`.

O contrato de regressão agora impede:

- reintrodução de boundary aproximado manual;
- fallback do Complexo com apenas um bairro;
- renderização de boundary parcial;
- MapLibre/boundary no wrapper inicial;
- imports eager do repositório territorial/Supabase na entrada;
- retorno do `AppLayoutRoutes` ao caminho crítico de `/`;
- retorno do prelaunch ao bundle normal;
- crescimento silencioso da imagem principal além do orçamento atual.

## Estado de certificação

**Não declarar build/test/deploy verde para este SHA ainda.**

O status externo do Vercel para `84edbda57746a8960b2329c0e6ddb2bab77aa1fc` permanece `failure` com URL indicando `upgradeToPro=build-rate-limit`. Isso é bloqueio do provider e não prova falha nem sucesso do source.

Os testes/regressões acima foram commitados, mas não foram executados por um runner verde nesta sessão.

## Próximo passo recomendado

Quando houver runner disponível:

1. executar unit/regression/architecture;
2. executar typecheck + build de produção;
3. medir a rota `/` com Lighthouse/Web Vitals em mobile throttled;
4. registrar pelo menos LCP, INP, CLS, JS transferido no carregamento inicial e main-thread blocking;
5. substituir `hero-complexo-nordeste.jpg` por WebP/AVIF menor se a medição ainda apontar imagem como custo relevante;
6. só então definir budget formal de performance do MVP.
