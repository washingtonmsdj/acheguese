# G178 — Root Typography and Launch Member SSOT

Data: 2026-09-14  
Status: implementado em `main`; runner/build/deploy ainda não certificados

## Objetivo

Continuar a fidelidade da entrada pública `/` ao concept sem criar uma segunda autoridade visual ou territorial.

Este corte fecha dois drifts detectados depois de G177:

1. a família Plus Jakarta Sans estava aprovada e aplicada no runtime, mas CSS territorial podia cair em `ui-sans-serif` porque `--font-heading` não possuía owner executável explícito; além disso, o concept usa peso 800 em display/wordmark enquanto a URL remota baixava somente até 700;
2. a `/` declarava manualmente os quatro bairros do Complexo, duplicando os membros já presentes no grupo territorial versionado.

Baseline: G177.

## Tipografia reconciliada com o concept aprovado

O histórico do projeto confirma que `d9ffa63a2fca4d75e2d06e00b34899c5c336d1ba` (`feat(home): align Achegue-se visual identity with concept`) migrou deliberadamente a identidade para **Plus Jakarta Sans**.

O commit de concept `6df845b67fc3c1ed01193cf72936a4cb876e3325` também introduziu deliberadamente peso **800** no wordmark e em headings da entrada pública. Portanto não era correto rebaixar esses elementos para 700 apenas porque a URL da fonte não carregava 800.

### Owner executável

`tailwind.config.ts` agora concentra o stack tipográfico executável:

- `ACHEGUE_SE_FONT_FAMILY = "Plus Jakarta Sans"`;
- `font-sans`, `font-display` e `font-heading` usam o mesmo stack;
- o plugin tipográfico emite `--font-heading` e `--font-sans` para CSS territorial que usa custom properties.

Com isso, selectors como `.entry-wordmark`, `.entry-hero h1` e demais surfaces que usam `var(--font-heading, ui-sans-serif)` deixam de cair silenciosamente na fonte de sistema quando o CSS compilado inclui os tokens do Tailwind.

### Peso 800 real

`index.html` passou a solicitar Plus Jakarta Sans em `400;500;600;700;800`, tanto no metadata usado pelo bootstrap adiado quanto no fallback `<noscript>`.

O caminho continua `display=optional` e continua sendo promovido por `src/main.tsx` somente depois da prioridade do primeiro mapa. O peso adicional não reintroduz `@import` remoto no CSS crítico.

Assim, o browser não precisa sintetizar o peso 800 usado pelo concept.

### Documentação visual reconciliada

`docs/04-design/DESIGN-TOKENS.md` deixou de indicar DM Sans + Space Grotesk e agora registra Plus Jakarta Sans como a única família aprovada. O peso 800 é permitido apenas em display/wordmark/heading quando o concept versionado o exige.

`docs/04-design/ACHEGUE-SE-VISUAL-IDENTITY.md` também documenta o peso 800 real para essas exceções de marca.

## Lista de bairros saiu do JSX da `/`

Antes deste corte, `TerritoryEntryPage.tsx` continha quatro strings locais:

- Nordeste de Amaralina;
- Santa Cruz;
- Vale das Pedrinhas;
- Chapada.

Os mesmos membros já pertenciam ao `TerritorialGroupWithMembers` retornado por `resolvePublicTerritoryFallback()`.

A página agora deriva `launchCommunityMembers` de `launchTerritory.group.members` e renderiza essa coleção. Se o grupo territorial mudar no owner versionado, a entrada pública acompanha sem manter uma segunda lista.

A página não inventa uma lista substituta quando o grupo não resolve.

## Rótulo público sem corromper o nome geográfico

O nome canônico do quarto bairro continua **Chapada do Rio Vermelho**.

Para preservar a fidelidade do concept, que exibe **Chapada** no chip compacto, `publicTerritoryFallbacks.ts` passou a aceitar `metadata.public_label` somente como rótulo de apresentação pública.

`getPublicTerritoryLocationLabel(location)` retorna:

- `metadata.public_label` quando explicitamente definido;
- caso contrário, `location.name`.

Isso mantém geografia e apresentação separadas: nenhuma renomeação do domínio foi feita para satisfazer a copy visual.

## Regressões versionadas

`tests/regression/public/root-entry-launch-ssot.test.ts` agora exige que:

- a lista venha de `launchTerritory.group.members`;
- a página use `getPublicTerritoryLocationLabel(member)`;
- os quatro `<span>` hardcoded não reapareçam no JSX;
- o fallback mantenha `Chapada do Rio Vermelho` como nome canônico e `Chapada` apenas como `publicLabel`.

Novo `src/core/routing/utils/__tests__/publicTerritoryFallbacks.test.ts` verifica:

- ordem e nomes canônicos dos quatro membros;
- ordem e labels públicos usados pela entrada;
- fallback para `location.name` quando não existe `public_label`.

`tests/architecture/design-typography-ssot.test.ts` e `tests/regression/public/root-entry-font-source-boundary.test.ts` protegem o owner tipográfico e o carregamento real do peso 800.

## Commits principais

Tipografia:

- `ce7930b213dbcd8ecdac365d4e7b48bedc009043` — `Unify Achegue-se typography font owner`;
- `4ee5728383c05b01fa3182a3cc32c0e2f7da9bbf` — `Reconcile design token typography with approved concept`;
- `190ea8cefd6dd874206dfab8b3db11b26f36a88d` — `Guard approved typography SSOT`;
- `12fe61e155b35e4d51684abf998b8a5a8053c28f` — `Load real Plus Jakarta 800 weight for concept typography`;
- `2065f47e6115495acedb86401860a58320318ab9` — `Guard real 800 concept font weight`;
- `9df39b95e83c85aff8c779394e173ca5f5f12367` — `Document approved 800 display typography weight`;
- `08a2eaa8e509d749814d147303b74a381f95b658` — `Allow approved 800 display weight in design tokens`;
- `1d7c80304aedd37f0819c58527ea45170821b64b` — `Guard typography documentation and 800 font loading`.

Território da `/`:

- `d2d031119f970de7f03d85f61b90e2fffbe8faf6` — adiciona label público opcional sem alterar o nome geográfico;
- `0eb8dbae81e0dc7b01d910d22e814870c8854f84` — `Render launch neighborhoods from territorial group SSOT`;
- `fb8d7eb3b2a40c27269de5be4d1a0475a80ac57e` — `Guard launch neighborhood list through territorial SSOT`;
- `37de5c5f5a4e5a437ac217753840ce0ac30ffeca` — `Test public territory labels without changing geographic names`.

Commits concorrentes de Auth continuaram entrando na `main` e foram preservados. Nenhum force-push foi usado.

## Auditoria adicional encontrada

O censo de tokens encontrou um débito separado em `src/index.css`: algumas regras CSS diretas antigas usam `hsl(var(--territory-raised))`, enquanto o token canônico é `--territory-surface-raised`.

Isso é diferente das classes Tailwind `bg-territory-raised`, que estão corretas: em `tailwind.config.ts`, `territory.raised` mapeia para `hsl(var(--territory-surface-raised))`.

Não foi criado alias `--territory-raised` e não foi adicionado plugin compensatório. A correção deve acontecer removendo/substituindo as regras-fonte antigas durante a limpeza source-aware do grande `src/index.css`, junto da aposentadoria de `strip-dead-entry-legacy-selectors`.

Também restam dois literais idênticos de `Plus Jakarta Sans` no CSS-base (`body` e headings). Eles não mudam a família executada, mas devem sair quando essa mesma limpeza puder ser feita de forma segura sobre o arquivo-fonte completo.

## Validação disponível

Esta conversa não possui checkout/runner local autenticado do repositório para executar o SHA final.

Portanto este checkpoint **não** declara Vitest, typecheck, build, E2E ou deploy aprovados. Os testes acima estão versionados como regressão, mas aguardam execução em runner.

Falha remota por `build-rate-limit` do Vercel continua sendo indisponibilidade/quota do provider, não prova de compilação reprovada e tampouco certificação positiva.

## Próximos cortes

1. fazer a limpeza source-aware dos seletores antigos da `/` em `src/index.css`, incluindo as referências diretas inválidas a `--territory-raised`, preservando regras mistas ativas;
2. aposentar `strip-dead-entry-legacy-selectors` somente depois que o CSS-fonte não depender mais dessa poda;
3. remover os dois literais remanescentes de Plus Jakarta Sans do CSS-base quando o arquivo for limpo, mantendo `tailwind.config.ts` como owner executável;
4. continuar o censo da `/` por dados/copy de lançamento que ainda possam estar duplicados fora de `TERRITORY_CONFIG`, `LAUNCH_URLS` e do território resolvido;
5. executar regressões, typecheck, build e captura visual no mesmo SHA quando houver runner.
