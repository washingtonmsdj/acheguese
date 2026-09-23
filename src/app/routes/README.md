# Sistema de rotas

Este diretório define a fronteira canônica de navegação do Achegue-se. A regra principal é simples: **cada URL tem um único owner**. Não redeclare a mesma rota em `AppRoutes` e `AppLayoutRoutes`.

## Estrutura atual

```text
src/app/routes/
├── AppRoutes.tsx                         # árvore raiz
├── RootRouteEntry.tsx                    # resolução da entrada `/`
├── activeLazyImports.ts                  # imports alcançáveis pelo AppLayout do MVP
├── lazyImports.ts                        # implementação preservada pós-MVP; fora do shell ativo
├── adminLazyImports.ts                   # imports da árvore administrativa
├── sections/
│   ├── AppLayoutRoutes.tsx               # rotas que vivem no layout principal
│   ├── AppLayoutRouteRegistry.tsx        # descritores territoriais ativos (Business + Map)
│   ├── CommunityTerritoryRoutes.tsx      # implementação pós-MVP preservada; não montada no shell
│   ├── CentralRoutes.tsx                 # operação privada `/central/*`
│   └── AdminRoutes.tsx                   # administração `/admin/*`
└── README.md
```

## Owners

### `AppRoutes.tsx`

É o owner das superfícies públicas **sem** `AppLayoutSidebar` e das subárvores independentes:

- `/`;
- `/q/:token`;
- `/status`;
- Conta e acesso (`AUTH_PATHS`): Login, Cadastro, Confirmação, Primeiro acesso, Termos OAuth e Recuperação;
- `/indicar-comunidade`, `/como-funciona`, `/sobre`, `/contato`, `/onboarding`;
- `/empresas/:id/catalogo`;
- `/p/:slug/*` e páginas do mini-site premium;
- `/central/*`;
- `/admin/*`;
- fallback `/*` para `AppLayoutRoutes`.

Essas páginas usam `lazy()` diretamente em `AppRoutes`. **Não** devem voltar para `lazyImports.ts`.

### `AppLayoutRoutes.tsx`

É o owner **somente** das superfícies ativas no lifecycle do MVP e da infraestrutura necessária ao shell:

- conta/perfis/notificações;
- Business/Empresas;
- Mensagens (provider Business);
- Mapa, Perto de mim e Busca;
- território ativo e páginas legais.

A inclusão é derivada diretamente de `lifecycleRegistry.ts`. Módulos `paused` não recebem `<Route>`, não usam `LaunchPausedPage` e não entram por `launchElement()`. URL pública sem owner ativo cai no `NotFound` canônico.

### `activeLazyImports.ts`

É o barrel exclusivo do `AppLayoutRoutes` do MVP. Só contém owners de Business, capabilities horizontais ativas e infraestrutura pública necessária. É proibido importar owners de módulos `paused`, `LaunchPausedPage` ou factories de placeholder.

### `lazyImports.ts`

Permanece temporariamente como inventário de implementações preservadas pós-MVP e para contratos históricos de módulos. **Não é importado pelo shell ativo.** Quando um módulo for reativado formalmente, seus owners devem ser migrados para a fronteira ativa após certificação; nunca por exceção local.

## Conta e acesso

Caminhos de autenticação vêm de `src/core/auth/constants/authFlow.ts`:

```ts
AUTH_PATHS.login
AUTH_PATHS.signup
AUTH_PATHS.signupConfirmation
AUTH_PATHS.firstAccess
AUTH_PATHS.termsAcceptance
AUTH_PATHS.passwordReset
```

Não introduza literais duplicados para esses caminhos em novas árvores. Estado transitório de autenticação pertence a `authJourney`, não à configuração de rotas.

## Rotas territoriais

Rotas públicas territoriais devem ser construídas pelos helpers canônicos de `core/routing/config/territorialRoutePatterns` e pelos registries do diretório `sections/`.

Princípios:

- vitrines territoriais ativas pertencem somente a Business e Map no MVP;
- padrões preservados de Serviços/Community/etc. não constituem rotas públicas enquanto seus módulos estiverem `paused`;
- detalhe público de empresa mantém sua URL canônica territorial;
- `/p/:slug/*` é o mini-site premium e não substitui a URL pública canônica da empresa;
- rotas operacionais ficam em `/central`;
- identidade/configuração pessoal fica em `/conta`;
- aliases só permanecem quando há contrato explícito e teste de regressão.

## Como adicionar uma rota

1. Defina primeiro o owner: raiz, AppLayout, Central ou Admin.
2. Se for root-owned, faça o `lazy()` em `AppRoutes.tsx`.
3. Se pertencer ao AppLayout, a superfície precisa estar `active` no lifecycle; então adicione o owner a `activeLazyImports.ts` e registre a rota/descriptor canônico. Não conecte módulo `paused`.
4. Para autenticação, reutilize `AUTH_PATHS`/builders.
5. Para território, reutilize os builders canônicos; não concatene padrões paralelos manualmente.
6. Adicione um contrato quando a rota puder colidir com fallback territorial, alias ou outra árvore.

## Invariantes protegidos

`tests/regression/auth-route-ownership.test.ts` protege especificamente a fronteira Conta/acesso e páginas root-owned. A suíte de arquitetura também cobre registries territoriais e taxonomia do projeto.

Uma mudança de rota não está concluída se:

- a mesma URL existir em duas árvores;
- uma página root-owned continuar exportada inutilmente por `lazyImports.ts`;
- um módulo `paused` tiver rota, fallback ou import alcançável pelo shell público ativo;
- um redirect de autenticação for montado fora dos builders canônicos;
- um alias legado for mantido sem consumidor/contrato atual.

## Validação

```bash
npm run typecheck
npm run lint
npm run test
```

Para Conta e acesso, o workflow `Auth Concept Regression` adiciona os contratos específicos de jornada, ownership de rotas e Playwright responsivo.
