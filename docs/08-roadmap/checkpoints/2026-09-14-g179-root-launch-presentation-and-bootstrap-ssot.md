# G179 — Root Launch Presentation and Bootstrap SSOT

Data: 2026-09-14  
Status: implementado em `main`; runner/build/deploy ainda não certificados

## Objetivo

Continuar a entrada pública `/` fiel ao concept, mas sem permitir que apresentação de lançamento, preferências de acessibilidade ou estado de prelaunch virem autoridades paralelas espalhadas pelo bootstrap.

Baseline: G178.

## Apresentação curta do território de lançamento

O nome territorial canônico continua `Complexo do Nordeste de Amaralina`.

Para a copy compacta aprovada do concept, o fallback territorial passou a declarar metadata de apresentação separada:

- `public_label: "Complexo"`;
- `public_article: "o"`.

`getPublicTerritoryGroupPresentation()` expõe essa apresentação sem renomear o domínio.

`TerritoryEntryPage.tsx` usa esse contrato para formar dinamicamente:

- `Explorar o Complexo`;
- `O Complexo é só o começo...`;
- `Começamos pelo Complexo...`.

Os textos renderizados permanecem iguais ao concept atual, mas as três frases não carregam mais o literal de lançamento no JSX. Uma troca futura do grupo não exige procurar e editar copies espalhadas.

Os labels dos quatro bairros continuam vindo de `launchTerritory.group.members`, com `Chapada do Rio Vermelho` preservado como nome geográfico e `Chapada` somente como label público explícito.

## Preferências de acessibilidade com owner único

Antes deste corte, `AppRuntime` e `AccessibilityProvider` possuíam implementações concorrentes para:

- `accessibility-high-contrast`;
- `accessibility-font-size`;
- parsing dos valores persistidos;
- aplicação das classes no `body`.

Foi criado `src/shared/accessibility/preferences.ts` como owner puro e dependency-light.

Ele centraliza:

- tipos de preferência;
- chaves de storage;
- leitura e normalização;
- aplicação de classes;
- persistência de alto contraste;
- persistência de tamanho de fonte.

`AppRuntime` continua aplicando a preferência em `useLayoutEffect`, preservando o primeiro paint da `/` sem carregar o `AccessibilityProvider` e sem duplicar storage/parser/classes.

`AccessibilityProvider` continua sendo owner do contexto e das ações React, mas passa a usar o mesmo contrato persistido.

`tests/architecture/accessibility-preferences-ssot.test.ts` faz varredura de `src/**/*.ts(x)` e impede que as chaves de storage reapareçam fora do owner.

## Prelaunch lockdown consolidado no rollout público

`VITE_PRELAUNCH_LOCKDOWN` era interpretado independentemente por quatro consumidores:

1. `AppRuntime`;
2. `RootRouteEntry`;
3. `AppRoutes`;
4. `ConsentBanner`.

Isso permitia drift na decisão sobre qual runtime/rota/overlay deveria estar ativo.

`src/app/config/launchScope.ts`, que já é o owner de `PUBLIC_LAUNCH_SURFACES`, agora também interpreta a env e exporta `PRELAUNCH_LOCKDOWN_ENABLED`.

Os quatro consumidores foram migrados para esse único valor. Nenhum deles interpreta a env diretamente.

`PUBLIC_LAUNCH_SURFACES.mobility=false` foi preservado sem alteração.

## Consentimento alinhado ao Auth SSOT

Durante a migração foi identificado outro drift em `ConsentBanner`: a detecção de superfícies de autenticação repetia paths como `/login`, `/cadastro`, `/cadastro/confirmacao`, `/aceitar-termos` e `/reset-password`.

O banner agora usa `AUTH_PATHS` para esses destinos. `/onboarding` permanece literal porque não pertence ao mesmo contrato de paths de Auth.

## Regressões versionadas

- `src/shared/accessibility/__tests__/preferences.test.ts` cobre leitura, normalização, aplicação de classes e persistência;
- `tests/architecture/accessibility-preferences-ssot.test.ts` protege ownership de storage/classes e mantém o owner sem React;
- `tests/regression/public/root-entry-bootstrap-performance.test.ts` exige que o runtime lean consuma o owner compartilhado;
- `src/core/routing/utils/__tests__/publicTerritoryFallbacks.test.ts` protege nome canônico e apresentação curta do grupo;
- `tests/regression/public/root-entry-launch-ssot.test.ts` impede o retorno das copies literais do Complexo ao JSX;
- `tests/regression/public/root-entry-community-first.test.ts` foi atualizado para exigir lockdown via `launchScope.ts` mantendo `PreLaunchLandingPage` lazy;
- `tests/architecture/public-launch-scope-ssot.test.ts` permite `VITE_PRELAUNCH_LOCKDOWN` somente em `launchScope.ts`, exige os quatro consumidores canônicos e mantém o banner de consentimento em `AUTH_PATHS`.

## CSS source-aware continua pendente

O censo de `strip-dead-entry-legacy-selectors` confirmou que os principais prefixes podados não têm caller React atual e existem somente no CSS-fonte, no plugin e em seu teste.

Mesmo assim, `src/index.css` é grande e a API disponível nesta conversa exige substituir o conteúdo inteiro. Sem checkout/runner local autenticado, remover blocos ou regras mistas via texto truncado seria uma edição insegura.

Portanto:

- o plugin de poda **não foi removido**;
- nenhum alias `--territory-raised` foi criado;
- nenhuma regra ativa foi apagada às cegas;
- os hovers ativos da `/` já usam `bg-territory-raised`, que resolve para `--territory-surface-raised` pelo Tailwind.

A aposentadoria do plugin só acontece depois que o CSS morto for removido fisicamente do source com transformação source-aware verificável.

## Commits principais desta etapa

Apresentação territorial:

- `ba506110ad374537c07946286c91ffe36ed7a48c` — expõe apresentação curta do grupo sem alterar nome territorial;
- `3cb3e9ab2c80e45a26813471731510799ff7f22c` — deriva copy curta da `/` da apresentação territorial;
- `6a3405ccce26ce9757457a3e2a3b0b0928943504` — testa apresentação de grupo mantendo nome canônico;
- `838f2fa3d1aad8b25b713e71ede28cfa082ad514` — ratchet das copies da raiz.

Acessibilidade:

- `3469c24bf77333faccf23b668ee9b829c4e14a3d` — owner de preferências;
- `566291bd4243bc60991967e0d185672e1ef6d8b0` — runtime lean no owner compartilhado;
- `73b34bfc35e15a4958f4240f8c8a0295392aab20` — Provider no mesmo owner;
- `948b6a28e87dc28e255d8e17047aeb28a8617cbb` — regressão do bootstrap;
- `a733157c0875033beeab7cba8cfb1a7036cf8178` — testes unitários;
- `9f585a3f53d168f50c76c89c7fca4632278a89ba` — ratchet arquitetural;
- `a217ead4c97bbc908d6c76cc19598786ec0d3a45` — `CURRENT_RULES` 5.3.

Rollout/prelaunch:

- `66b3ea0507110bfaafeb35394a7b706363e26431` — `launchScope.ts` passa a possuir o lockdown;
- `e4015a9ac7ac9e530321b84e9fa96b6be762f95a` — `AppRuntime` consome o owner;
- `dafd49a7b2c30410fdd263a0d0b94746d6a8685c` — `RootRouteEntry` consome o owner;
- `213492a571622c5a62da93b93380e65e799d1cab` — `ConsentBanner` usa launch scope + Auth paths;
- `56cc6f67a3c9b33a724e4e22b1967c515fb30bf3` — `AppRoutes` consome o owner;
- `1cec7522185d5298d8cd04648cefb22d1b504775` — regressão community-first reconciliada;
- `b9a501afe3a6c70860d52d76f59ce95a1094e5f3` — ratchet do launch scope.

Commits concorrentes continuaram sendo preservados. Nenhum force-push foi usado.

## Validação disponível

Não existe checkout/runner local autenticado nesta conversa para executar o SHA final.

Portanto este checkpoint **não** declara Vitest, typecheck, build, E2E, captura visual ou deploy aprovados. Os testes estão versionados e aguardam execução em runner.

Falha Vercel por `build-rate-limit` continua sendo condição externa do provider, não prova de compilação reprovada nem certificação positiva.

## Próximos cortes

1. continuar o censo do caminho `AppRuntime → RootRouteEntry → TerritoryEntryPage → TerritoryEntryMap` por imports/owners desnecessários antes do primeiro mapa;
2. remover CSS morto da primeira versão da `/` com transformação source-aware verificável e só então aposentar `strip-dead-entry-legacy-selectors`;
3. eliminar os dois literais redundantes de Plus Jakarta Sans do CSS-base durante a mesma limpeza;
4. executar regressões, typecheck, build e captura visual no mesmo SHA quando houver runner;
5. manter Mobilidade `PUBLIC_LAUNCH_SURFACES.mobility=false` até cumprir o DoD real do mesmo SHA.
