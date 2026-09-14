# G175 — Public Root Launch SSOT and Map Accessibility

Data: 2026-09-14  
Status: implementado em `main`; runner/build/deploy ainda não certificados

## Objetivo

Retomar a melhoria da página pública `/` após G174 e remover divergências que ainda faziam a entrada manter valores de lançamento e fallback de mapa fora dos owners canônicos. A rodada também fecha um estado de acessibilidade incorreto quando o mapa entra no fallback por timeout.

Baseline documental: G174.

## Problemas confirmados

### Contexto de lançamento duplicado na página

`src/app/pages/TerritoryEntryPage.tsx` ainda mantinha fallbacks locais para:

- estado `ba`;
- cidade `salvador`;
- slug `complexo-do-nordeste-de-amaralina`;
- nome `Complexo do Nordeste de Amaralina`.

Ao mesmo tempo, CTA/rotas usam `LAUNCH_URLS`, calculadas a partir de `TERRITORY_CONFIG`. Isso criava dois owners conceituais para a mesma decisão de lançamento.

### Fallback geográfico duplicado no mapa da `/`

`TerritoryEntryMapRuntime.tsx` possuía `SALVADOR_VIEWPORT` com latitude/longitude hardcoded, embora `src/shared/config/mapDefaults.ts` já seja o SSOT global de defaults de mapa.

O mesmo componente também fixava `Salvador · BA` e mensagens com `Complexo`, apesar de já receber cidade/território resolvidos.

### `aria-busy` nunca encerrava após timeout do mapa

Quando MapLibre não respondia antes do timeout, o fallback visual final era exibido, mas a região continuava com `aria-busy=true` porque `mapReady` permanecia falso. Para tecnologia assistiva, a superfície continuava indefinidamente em estado de carregamento mesmo já tendo uma resposta final.

## Correções

### `/` passa a consumir o owner de launch sem fallback paralelo

`TerritoryEntryPage.tsx` agora deriva diretamente de `TERRITORY_CONFIG`:

- `state`;
- `city`;
- `community.slug`;
- `community.name`;
- rótulo cidade/UF.

A navegação continua usando `LAUNCH_URLS.community` e o `LastTerritoryStore` recebe `TERRITORY_CONFIG.launch.community.path`.

O fallback territorial versionado continua sendo usado para fornecer a geometria/dados públicos de lançamento sem depender do banco, mas ele não redefine mais qual é o contexto de launch.

### Mapa da `/` usa defaults e dados resolvidos

`TerritoryEntryMapRuntime.tsx` agora usa `MAP_DEFAULT_COORDINATES` como fallback geográfico final, removendo `SALVADOR_VIEWPORT` e os pares de coordenadas locais.

O rótulo de cidade/UF é derivado do `Location` recebido. Mensagens de indisponibilidade usam `territoryLabel` em vez de texto fixo do Complexo.

### Estado acessível de carregamento encerrado corretamente

Foi introduzido `mapRegionBusy`:

- durante carregamento real, `aria-busy=true`;
- após `mapUnavailable=true`, o fallback final é considerado estado resolvido e `aria-busy=false`;
- se o mapa carregar depois, o fluxo existente continua podendo recuperar a superfície.

## Regressão

Criado e ampliado:

`tests/regression/public/root-entry-launch-ssot.test.ts`

O ratchet impede:

- retorno de `ba`, `salvador` ou slug do Complexo como fallback local dentro de `TerritoryEntryPage`;
- retorno de `SALVADOR_VIEWPORT` e das coordenadas `-12.95/-38.48` no runtime da `/`;
- retorno do rótulo fixo `<small>Salvador · BA</small>`;
- retorno da expressão antiga de `aria-busy` que permanecia ativa depois do timeout.

## Commits desta rodada

- `123662c37a42ee03ea5289681e23b6f942a3fa16` — `Keep public root launch context on routing SSOT`;
- `d67574539c05ac0f38b1e5bad8b61d7b2f1eed93` — `Remove public root map launch hardcodes`;
- `343d28212d3f0fee276aa27987cfc66f74d585e1` — `Guard public root launch territory SSOT`;
- `e1425a37d8623999c461c254d3c5fe4aaf4c9847` — `Derive public root launch labels from routing config`;
- `bd550f804cf3d909fc02e04219906fc759f8bf34` — `Settle public root map accessibility after timeout`;
- `56535be420c14a392073d7a939f110fd73bea1e3` — `Cover public root launch labels and settled map state`.

Commits concorrentes de autenticação/OAuth foram preservados na `main`; não houve force-push nem reescrita de histórico.

## Validação disponível

Status remoto consultado no SHA `56535be420c14a392073d7a939f110fd73bea1e3`:

- Vercel: `failure` apontando para `build-rate-limit`;
- portanto o status não prova falha de source/build e também não constitui aprovação;
- esta conversa continua sem runner capaz de executar Vitest/typecheck/build no checkout final.

Consequentemente, G175 é um fechamento estrutural no source, não uma certificação executável.

## Observação encontrada para a próxima rodada

`src/index.css` ainda contém historicamente um `@import` de Google Fonts. Hoje `postcss.config.cjs` remove esse import antes do CSS final e `main.tsx` agenda a fonte depois da prioridade do mapa. O runtime final está protegido pelo transform, mas o source ainda depende desse saneamento de build. A próxima limpeza deve avaliar remover a declaração histórica da fonte no próprio source e então aposentar o plugin `strip-duplicate-google-font-import`, sem alterar a política de carregamento tardio da `/`.

## Próximo gate

1. executar o novo ratchet em runner real;
2. continuar auditoria da `/` por dependências e workarounds que ainda existam apenas para limpar source legado em build;
3. preservar a prioridade map-first já definida em G172;
4. obter typecheck/build/deploy same-SHA quando o provider voltar a aceitar builds.
