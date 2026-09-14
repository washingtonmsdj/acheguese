# Checkpoint G159 — raiz do MVP e contexto territorial da navegação

Data: 2026-09-14

## Objetivo

Fechar duas regressões de jornada que permaneceram após G157/G158:

1. `/` ainda podia pular a nova entrada community-first por causa de território salvo ou território do perfil;
2. ao sair de uma rota territorial para Conta/Atividade, a navegação canônica perdia o Complexo e recuava apenas para Salvador.

A correção preserva a primeira tela do MVP e, ao mesmo tempo, mantém o contexto territorial depois que a pessoa efetivamente entrou no produto.

## Entregue

### Raiz `/`

- `RootRouteEntry` não redireciona mais por `lastTerritoryStore`, `homeDistrict` ou `homeCity`.
- Fora do `VITE_PRELAUNCH_LOCKDOWN`, `/` sempre renderiza `TerritoryEntryPage`.
- `/?trocar=territorio` permanece compatível e chega à mesma entrada; enquanto houver uma única comunidade lançada, não existe seletor paralelo.
- Adicionada regressão que impede o retorno de redirect silencioso na raiz.

### Contexto interno da navegação

- `territoryNavigationModes` ganhou `fallbackBaseUrl` opcional e validado.
- A URL territorial corrente continua tendo precedência sobre qualquer fallback lembrado.
- Em rotas sem território, o registry pode usar o último `baseUrl` territorial válido.
- Se não houver contexto lembrado válido, o fallback usado pelos renderers do MVP é `TERRITORY_CONFIG.launch.community.path`.
- `TerritoryAdaptiveNavigation` e `BottomNav` assinam `LastTerritoryStore` e passam o mesmo contexto ao registry.
- Assim, ao entrar em Conta/Atividade e voltar para Hoje/Explorar/Community, a pessoa retorna ao Complexo em vez de cair em Salvador inteira.
- Esse uso de `LastTerritoryStore` é interno à navegação e não volta a controlar a renderização de `/`.

### Launch gates

Foi auditado `AppLayoutRoutes`:

- Educação e Mobilidade pausadas não são apenas escondidas da navegação;
- `DIRECT_PAUSED_ROUTES` e `launchElement(...)` interceptam URL direta e renderizam `LaunchPausedPage` quando o surface gate está `false`;
- não foi criado gate duplicado em páginas individuais.

### Documentação

- `docs/06-navigation/NAVIGATION-MAPPING.md` foi alinhado à entrada community-first e ao registry dos cinco modos.
- Removidas instruções antigas que diziam para `/` resolver localização/cidade/bairro e redirecionar automaticamente visitante recorrente.
- Documentada a separação entre:
  - entrada pública do MVP;
  - contexto territorial interno;
  - launch gates por navegação e por URL direta.

## Commits desta etapa

1. `a96345cba21cf4aa95eeddea1ee7d27826916b7e` — `fix(entry): keep root on community-first MVP`
2. `c31007cd1e845d9065e43d4a40a3c090588e6ade` — `test(entry): prevent silent root redirects`
3. `a74bdaa987410ed688044e06124ac674364c3856` — `fix(nav): preserve remembered territory context`
4. `4657907cefaa35931f0656cf01f64d37cb7e8db4` — `fix(nav): retain complex context outside territory routes`
5. `c4dd911a72881b97f1aed4178c5c4d9514c61a33` — `fix(nav): keep bottom nav in remembered territory`
6. `34d92ab6f28b7822f4a30b5b75e72f8f53484aeb` — `test(nav): preserve territory across account activity routes`
7. `0f9c64528c0038f30212cb1caf69e8cd226da62c` — `docs(nav): align mapping with community-first root`

## Estado Git

Comparação entre o ponteiro de G158 (`f2c34d2d587a5c8e142f7b3c177f5f939388b890`) e o último commit funcional desta etapa (`0f9c64528c0038f30212cb1caf69e8cd226da62c`):

- `ahead_by=7`;
- `behind_by=0`;
- sem merge paralelo;
- sem force-push.

## Provider gate

O check Vercel do SHA `0f9c64528c0038f30212cb1caf69e8cd226da62c` retornou `failure` com URL explícita de `build-rate-limit`.

Isso significa:

- provider bloqueado por limite de build;
- não é evidência de falha de source;
- não é certificação verde;
- os testes adicionados continuam aguardando execução em runner disponível para prova de runtime.

## Próxima frente

Continuar a revisão das superfícies públicas ativas do Complexo, priorizando:

1. CTAs e links que possam perder o território atual;
2. previews/concept mocks que precisem permanecer estritamente DEV-only;
3. dados de demonstração ou hardcodes que possam escapar para Production;
4. páginas de Negócios, Serviços, Gastronomia e Classificados, mantendo owners existentes;
5. Community e ações autenticadas sob `CommunityAccessPolicy`.

Método permanece:

`conceito visual → owner real → dados reais → actions reais → launch gates → estados reais → responsividade → regressão`.
