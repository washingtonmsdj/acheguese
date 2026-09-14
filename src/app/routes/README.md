# Sistema de rotas

Este diretório define a fronteira canônica de navegação do Achegue-se. A regra principal é simples: **cada URL tem um único owner**. Não redeclare a mesma rota em `AppRoutes` e `AppLayoutRoutes`.

## Estrutura atual

```text
src/app/routes/
├── AppRoutes.tsx                         # árvore raiz
├── RootRouteEntry.tsx                    # resolução da entrada `/`
├── lazyImports.ts                        # páginas pertencentes ao AppLayout
├── adminLazyImports.ts                   # imports da árvore administrativa
├── sections/
│   ├── AppLayoutRoutes.tsx               # rotas que vivem no layout principal
│   ├── AppLayoutRouteRegistry.tsx        # descritores territoriais/domínio
│   ├── CommunityTerritoryRoutes.tsx      # portal/comunidade territorial
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
- `/splash`;
- Conta e acesso (`AUTH_PATHS`): Login, Cadastro, Confirmação, Primeiro acesso, Termos OAuth e Recuperação;
- `/indicar-comunidade`, `/como-funciona`, `/sobre`, `/contato`, `/onboarding`;
- `/empresas/:id/catalogo`;
- `/p/:slug/*` e páginas do mini-site premium;
- `/central/*`;
- `/admin/*`;
- fallback `/*` para `AppLayoutRoutes`.

Essas páginas usam `lazy()` diretamente em `AppRoutes`. **Não** devem voltar para `lazyImports.ts`.

### `AppLayoutRoutes.tsx`

É o owner das superfícies que pertencem à aplicação principal e/ou ao `AppLayoutSidebar`, incluindo:

- `/inicio`;
- conta privada (`/conta/*`);
- mensagens, mapa, busca e módulos públicos;
- vitrines territoriais;
- eventos, vagas, educação, comunicação e outras superfícies sujeitas ao launch scope;
- aliases de perfil mantidos apenas quando ainda fazem parte do contrato público atual.

Rotas sujeitas a lançamento usam `isLaunchSurfaceEnabled()` / `launchElement()`. A árvore raiz não deve interceptá-las com um placeholder permanente.

### `lazyImports.ts`

É um barrel exclusivo da árvore de `AppLayoutRoutes` e seus registries. Não contém novamente Login, Cadastro, Recuperação, Splash, Status, QR, páginas institucionais root-owned, catálogo público sem layout ou mini-site premium.

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

- vitrines de módulo (`/empresas/...`, `/servicos/...`) são públicas/SEO;
- `/comunidade/:communitySlug/...` representa experiência social/local;
- detalhe público de empresa mantém sua URL canônica territorial;
- `/p/:slug/*` é o mini-site premium e não substitui a URL pública canônica da empresa;
- rotas operacionais ficam em `/central`;
- identidade/configuração pessoal fica em `/conta`;
- aliases só permanecem quando há contrato explícito e teste de regressão.

## Como adicionar uma rota

1. Defina primeiro o owner: raiz, AppLayout, Central ou Admin.
2. Se for root-owned, faça o `lazy()` em `AppRoutes.tsx`.
3. Se pertencer ao AppLayout, adicione o import a `lazyImports.ts` apenas se necessário e registre a rota em `AppLayoutRoutes`/registry apropriado.
4. Para autenticação, reutilize `AUTH_PATHS`/builders.
5. Para território, reutilize os builders canônicos; não concatene padrões paralelos manualmente.
6. Adicione um contrato quando a rota puder colidir com fallback territorial, alias ou outra árvore.

## Invariantes protegidos

`tests/regression/auth-route-ownership.test.ts` protege especificamente a fronteira Conta/acesso e páginas root-owned. A suíte de arquitetura também cobre registries territoriais e taxonomia do projeto.

Uma mudança de rota não está concluída se:

- a mesma URL existir em duas árvores;
- uma página root-owned continuar exportada inutilmente por `lazyImports.ts`;
- uma superfície launch-gated for bloqueada incondicionalmente acima do seu owner;
- um redirect de autenticação for montado fora dos builders canônicos;
- um alias legado for mantido sem consumidor/contrato atual.

## Validação

```bash
npm run typecheck
npm run lint
npm run test
```

Para Conta e acesso, o workflow `Auth Concept Regression` adiciona os contratos específicos de jornada, ownership de rotas e Playwright responsivo.
