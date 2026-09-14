# Checkpoint G158 — Home, Explorar e navegação alinhados ao MVP

Data: 2026-09-14

## Objetivo

Continuar a integração visual do conceito do Codex sobre a `main` sem transportar regressões funcionais. Esta etapa fecha vazamentos de superfícies pausadas, restaura o SSOT dos cinco modos de navegação e alinha a documentação da Home ao lançamento community-first definido em G157.

## Entregue

### Home do território

- `TerritoryHomePage` deixou de aplicar launch gate somente a Gastronomia.
- Todos os atalhos rápidos agora declaram sua `LaunchSurfaceKey` e passam por `isLaunchSurfaceEnabled(...)`.
- Mobilidade e Educação deixam de aparecer enquanto `PUBLIC_LAUNCH_SURFACES.mobility=false` e `education=false`.
- A grade desktop deixou de reservar seis colunas fixas; usa distribuição adaptativa para a quantidade real de ações habilitadas.
- Adicionada regressão específica para o launch scope da Home.

### Explorar / Busca

- `BuscaPage` já consumia `SearchService` via `useGlobalSearch` e já gateava Eventos/Oportunidades por `launchScope`.
- Corrigido link desktop de Educação que estava hardcoded fora do gate.
- Teste de `BuscaPage` agora prova que Eventos, Oportunidades e Educação pausados não aparecem.
- O `concept-mock` continua restrito a `import.meta.env.DEV`; Production segue usando dados e owners reais.

### Navegação Território Vivo

- `TerritoryAdaptiveNavigation` voltou a consumir `buildTerritoryNavigationModes(...)` e `isTerritoryNavigationModeActive(...)`, em vez de manter uma segunda autoridade local.
- Mobile, tablet e desktop passam a usar o mesmo registry canônico de cinco modos:
  - Hoje;
  - Explorar;
  - Community;
  - Atividade;
  - Conta/Entrar.
- Removida da navegação adaptativa a recriação local de `Publicar` e `Conversas` como modos globais.
- `Publicar` volta a ser uma ação contextual, sujeita à policy de Community, e não um destino global disponível apenas por estar autenticado.
- O rodapé desktop deixou de sugerir uma seleção territorial inexistente no MVP; agora retorna à entrada pública.
- Teste arquitetural foi endurecido para impedir nova divergência entre renderers e o SSOT.

### Documentação

- `docs/05-ux/HOME-SPEC.md` avançou para 4.4 e agora registra explicitamente:
  - `/` como entrada direta para o Complexo do Nordeste de Amaralina no MVP;
  - ausência de busca por cidade e geolocalização na primeira tela;
  - conta separada da ativação territorial;
  - indicação de comunidade como interesse em expansão, não criação automática;
  - Mobilidade e Educação pausadas;
  - owners reais e launch gates como requisito da Home e de Explorar;
  - seleção territorial na raiz somente quando houver mais de uma comunidade efetivamente lançada.

## Commits desta etapa

1. `e8a9e03cd704475dcb4957ca93103fa61c1af1fb` — `fix(home): honor launch scope in quick actions`
2. `48f9c252029cc50d03482e9af66099c46de8b8f5` — `test(home): guard launch-scoped quick actions`
3. `f7e3dee3a9c19c5d70dfc5ae39d8866e867733fa` — `fix(search): hide paused education entry`
4. `cd445ee35bb894a43afc88d29071acfd2f5b7790` — `test(search): cover paused education entry`
5. `837a41a592467f3c3393b57947eb38d0281055a6` — `docs(home): align SSOT with community-first MVP`
6. `3e42d51e20fffd0d4074930e7a2093990b7af87e` — `fix(nav): restore canonical territory navigation modes`
7. `b0e28b7cef264cc2d24fb11b9853641657561d3f` — `test(nav): prevent adaptive navigation drift`

## Auditoria dos owners

Nenhum owner paralelo foi criado.

- Home continua usando `useTerritoryHomeData` e owners de domínio existentes.
- Eventos da Home já são condicionados a `isLaunchSurfaceEnabled("events")`.
- Oportunidades da Home já são condicionadas a `isLaunchSurfaceEnabled("jobs")`.
- Busca continua federada por `SearchService`/`searchProviders`.
- Providers de Eventos e Oportunidades já possuem os mesmos gates no core.
- Navegação volta a usar `src/core/navigation/territoryNavigationModes.ts` como autoridade.

## Estado Git

Comparação entre G157 (`a3d11b68ae8259ba9e7f5dac2536801f03959edf`) e o último commit funcional desta etapa (`b0e28b7cef264cc2d24fb11b9853641657561d3f`):

- `ahead_by=7`;
- `behind_by=0`;
- sem merge paralelo ou force-push.

## Provider gate

O check Vercel do SHA `b0e28b7cef264cc2d24fb11b9853641657561d3f` retornou `failure` com destino explícito `upgradeToPro=build-rate-limit`.

Portanto:

- isso é bloqueio/rate-limit do provider;
- não prova falha de build ou source;
- também não constitui certificação verde;
- os testes adicionados/alterados nesta etapa ainda precisam de execução por um runner disponível antes de declarar o checkpoint totalmente validado em runtime.

## Próxima frente

Continuar tela a tela, mantendo o mesmo método:

`conceito visual → owner real → dados reais → actions reais → launch gates → estados reais → responsividade → regressão`

Prioridade seguinte: revisar as superfícies do Complexo que ainda misturam conceito visual com contratos antigos, começando pelos módulos públicos ativos e pelos CTAs que podem expor ações sem policy ou destinos pausados.
