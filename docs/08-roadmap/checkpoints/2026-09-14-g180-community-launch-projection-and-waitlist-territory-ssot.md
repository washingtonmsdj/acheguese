# G180 — Community Launch Projection and Waitlist Territory SSOT

Data: 2026-09-14  
Status: implementado em `main`; runner/build/deploy ainda não certificados

## Objetivo

Eliminar uma segunda lista de territórios de lançamento que ainda existia no domínio Community e corrigir os paths incorretos produzidos pela waitlist de prelaunch.

Baseline: G179.

## Runtime passivo de mapa voltou para `mapDefaults`

`src/core/maps/components/v3/MapLibrePassiveRuntime.tsx` ainda possuía dois fallbacks locais:

- `DEFAULT_CENTER = [-51.9253, -14.235]`;
- `DEFAULT_ZOOM = 13`.

Esses valores duplicavam `src/shared/config/mapDefaults.ts`.

O runtime passivo agora consome:

- `MAP_DEFAULT_CENTER_LNGLAT`;
- `MAP_DEFAULT_ZOOM`.

O ratchet `tests/architecture/boundary-map-defaults-ssot.test.ts` foi ampliado para impedir o retorno desses defaults locais.

## Community launch deixou de manter segunda lista territorial

`src/core/community/config/communityLaunch.ts` declarava manualmente:

- os quatro bairros do primeiro cluster;
- o slug do grupo `complexo-do-nordeste-de-amaralina`;
- um slug incorreto `chapada` para Chapada do Rio Vermelho.

O schema/migrations e o fallback territorial canônico usam `chapada-do-rio-vermelho`.

O arquivo Community foi convertido em uma **projeção derivada**:

1. lê `TERRITORY_CONFIG.launch`;
2. resolve o território via `resolvePublicTerritoryFallback()`;
3. usa `configuredLaunchGroup.members`;
4. projeta labels públicos por `getPublicTerritoryLocationLabel()`;
5. deriva o slug do grupo do próprio território/configuração.

Assim, `communityLaunch.ts` não possui mais nenhum slug de bairro nem o slug literal do grupo.

Os exports `SALVADOR_COMMUNITY_LAUNCH_*` permanecem temporariamente como API nominal dos callers existentes, mas não são mais owners de dados. A remoção/renomeação desses nomes exige migrar os callers grandes sem reescrever arquivos truncados às cegas; não foi criado novo bridge.

## Chapada corrigida no rollout Community

A projeção agora produz:

- label público: `Chapada`;
- slug geográfico: `chapada-do-rio-vermelho`.

O teste de `communityLaunch` exige esse contrato e verifica explicitamente que `chapada` **não** é mantido como alias oculto.

`tests/architecture/community-launch-config-import-ratchet.test.ts` também impede que a lista estática ou os slugs literais voltem para `communityLaunch.ts`.

## Waitlist de prelaunch corrigida

`PreLaunchWaitlist.tsx` tinha dois bugs reais de path:

- selecionar `Chapada` fazia `slugifyTerritory("Chapada")` e enviava `/ba/salvador/chapada`;
- selecionar `Complexo Nordeste de Amaralina` gerava `/ba/salvador/complexo-nordeste-de-amaralina`, sem o `do` do slug canônico.

A causa era armazenar **label** no `<select>` e derivar identidade territorial por slugify na submissão.

Agora cada opção possui `{ label, slug }`:

- o grupo usa `TERRITORY_CONFIG.launch.community.name/slug`;
- os quatro membros vêm da projeção Community derivada do grupo territorial;
- bairros adicionais da lista continuam recebendo slug localmente porque são opções de interesse fora do grupo de lançamento, não identidades copiadas do cluster.

O estado do formulário armazena `territorySlug`, não o label.

Na submissão:

- a mensagem usa `selectedTerritory.label`;
- `communitySlug` deriva de `TERRITORY_CONFIG.launch.city`;
- `territoryPath` usa `${LAUNCH_CITY_PATH}/${selectedTerritory.slug}`.

Não existe mais `/ba/salvador/${territorySlug}` hardcoded nem `slugifyTerritory(selectedBairro)`.

## Regressões

`src/app/pages/PreLaunchWaitlist.spec.tsx` agora cobre:

- Santa Cruz em `/ba/salvador/santa-cruz`;
- Chapada em `/ba/salvador/chapada-do-rio-vermelho`;
- grupo em `/ba/salvador/complexo-do-nordeste-de-amaralina`;
- label humano preservado na mensagem;
- contato WhatsApp e retry anteriores.

`tests/architecture/public-launch-scope-ssot.test.ts` exige que a waitlist use `LAUNCH_CITY_PATH`, `TERRITORY_CONFIG` e o slug canônico da opção e proíbe os padrões antigos.

## Regras globais

`docs/03-architecture/CURRENT_RULES.md` avançou para 5.4:

- `launchScope.ts` é owner do rollout público e de `VITE_PRELAUNCH_LOCKDOWN`;
- Community launch é projeção sobre território/configuração, nunca segunda lista;
- membros e slugs vêm do owner territorial;
- runtime passivo também usa `mapDefaults` para fallback geográfico.

## Commits principais

- `170213ed97718c6db85082682f6d7c21c0cb72bb` — fallback do runtime passivo via `mapDefaults`;
- `ad676dd772173d44730969ed8489a8ead8d6ba0d` — ratchet de center/zoom passivo;
- `8ad78d23d6fd866e62a131b3feb097d2bbc3e1cb` — Community launch derivado do território;
- `4e351a4f79c43b4f0e382ea1d84283e0d45b4296` — regressão com slug canônico da Chapada;
- `a98e3531c212053233f48f62408db6ee31f29138` — ratchet contra lista/slugs paralelos;
- `11150c3768614bd1b5e90c8cb71498576c2ce557` — `CURRENT_RULES` 5.4;
- `d064eefecc2e609fe359264ed55dd0d13405aae9` — waitlist envia identidade territorial canônica;
- `f854c054f4996a816847b9954a7a07f284088801` — regressões de Chapada/grupo;
- `a23d04805b1c9ebed8d1d9adce9cca09a9cc48ae` — ratchet estrutural da waitlist.

Commits concorrentes foram preservados e nenhum force-push foi usado.

## Validação disponível

Não há checkout/runner local autenticado nesta conversa para executar o SHA final.

Portanto este checkpoint **não** declara Vitest, typecheck, build, E2E, captura visual ou deploy aprovados. Os testes estão versionados e aguardam execução em runner.

Falha Vercel por `build-rate-limit` continua sendo condição externa do provider, não resultado de compilação.

## Próximos cortes

1. migrar com segurança os nomes públicos `SALVADOR_COMMUNITY_LAUNCH_*` para nomenclatura genérica quando os callers grandes puderem ser editados sem risco, sem criar aliases permanentes;
2. continuar a auditoria do caminho de primeiro paint da `/` por fallbacks e dependências duplicadas;
3. remover CSS morto de `src/index.css` com transformação source-aware verificável e só então aposentar `strip-dead-entry-legacy-selectors`;
4. remover os literais redundantes de Plus Jakarta Sans durante a mesma limpeza do CSS;
5. executar regressões, typecheck, build e captura visual no mesmo SHA quando houver runner;
6. manter `PUBLIC_LAUNCH_SURFACES.mobility=false` até cumprir o DoD real do mesmo SHA.
