# SCREEN-MAP

Domain status: Feed = STATUS: FROZEN.

> Mapa único de telas/rotas. Nomenclatura canônica: `Territory*Page`. Nomes antigos permanecem como aliases (ver [`06-navigation/NAVIGATION-MAPPING.md`](./06-navigation/NAVIGATION-MAPPING.md)).
>
> Status: ✅ ativo · 🟡 parcial · 🗄 legado (a remover) · ↪ redireciona

## Núcleo Territory (SSOT)

| Rota                                       | Página (canônica)                                               | Objetivo                                                                                                                    | Responsável        | Jornada                     | Status | Legado / sucessora                             |
| ------------------------------------------ | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------------------- | ------ | ---------------------------------------------- |
| `/`                                        | `RootRouteEntry` → redirect territorial \| `TerritoryEntryPage` | Entrada/resolução territorial. Se há território salvo, redireciona; sem contexto, permite escolher e explorar publicamente. | app/routes         | Primeira visita · Retorno   | ✅     | implementação canônica; não é Home de conteúdo |
| `/onboarding`                              | `OnboardingPage`                                                | Escolher cidade + bairro                                                                                                    | app/pages          | Primeira visita             | ✅     | —                                              |
| `/inicio`                                  | `NationalHubPage`                                               | Hub nacional legado                                                                                                         | app/pages          | Entrada ampla               | ✅     | não é alias da Home                            |
| `/:state/:city`                            | `TerritoryHomePage`                                             | Home territorial ampla da cidade                                                                                            | routes/territorial | Entrada pública · retorno   | ✅     | Home canônica de cidade                        |
| `/:state/:city/:territory`                 | `TerritoryHomePage`                                             | Home territorial prioritária de bairro/grupo                                                                                | routes/territorial | Deep-link · retorno         | ✅     | Home canônica local                            |
| `/comunidade/:uf/:city[/:territory]`       | `ComunidadePage`                                                | Participação comunitária do território                                                                                      | routes/territorial | Home → Community            | ✅     | Community não é a Home                         |
| `/comunidade/:uf/:city/:hood/feed`         | `TerritoryFeedPage`                                             | Timeline completa do bairro                                                                                                 | app/pages          | Home → "Ver mais"           | ✅     | ex-`ComunidadeFeedPage`                        |
| `/comunidade/:uf/:city/:hood?post=:postId` | `PostDetailModal` via `postService.getPublicPostById()`         | Deep-link territorial de post                                                                                               | Feed               | Tap no card / share / busca | ✅     | query param canonico                           |
| `/p/:slug/*`                               | `PremiumBusinessSiteRoute`                                      | Mini-site premium de empresa                                                                                                | business           | Link premium                | ✅     | nao pertence ao Feed                           |
| `/interesse`                               | `CommunityInterestPage`                                         | Waitlist para bairro coming_soon                                                                                            | community          | Bairro indisponível         | ✅     | —                                              |
| `/br`, `/brasil`                           | `NationalHubPage`                                               | Hub país (SEO + escolha de UF)                                                                                              | app/pages          | SEO / entrada externa       | ✅     | —                                              |
| `/:state`                                  | rota de entrada estadual                                        | Entrada ampla/SEO do estado                                                                                                 | app/routes         | Google / links              | ✅     | `/:state/:city` já é Territory Home            |
| `/territory/unavailable`                   | `TerritoryUnavailablePage`                                      | Território sem cobertura                                                                                                    | app/pages          | Redirect                    | ✅     | —                                              |

## Comunidade — módulos transversais

| Rota                                        | Página                  | Objetivo           | Status |
| ------------------------------------------- | ----------------------- | ------------------ | ------ |
| `/novo-post`                                | `NovoPostPage`          | Publicar no bairro | ✅     |
| `/alertas`                                  | Community alerts        | Alertas do bairro  | ✅     |
| `/achados-perdidos` (+ `/novo`, `/:id`)     | Lost & found            | Achados/perdidos   | ✅     |
| `/mensagens`, `/chat/:conversationId`       | DM comunitária          | Conversas 1:1      | ✅     |
| `/comunicacao` (+ agente/empresa/solicitar) | Comunicação territorial | Canais oficiais    | ✅     |
| `/buscar`                                   | `BuscarPage`            | Busca federada     | ✅     |
| `/busca`                                    | ↪ `/buscar`             | alias              | 🗄     |

## Empresas

| Rota                                   | Página                 | Objetivo            | Status |
| -------------------------------------- | ---------------------- | ------------------- | ------ |
| `/empresas`                            | `EmpresasLandingPage`  | Comércio do bairro  | ✅     |
| `/empresas/:id/catalogo`               | Catálogo               | Produtos da empresa | ✅     |
| `/empresas/cadastrar`                  | Cadastro               | Owner cria empresa  | ✅     |
| `/empresas-landing`                    | ↪ `/empresas`          | alias               | 🗄     |
| `/dashboard-empresa`                   | `DashboardEmpresaPage` | Owner dashboard     | ✅     |
| `/edit-business/:profileId`            | Editor                 | Owner edita         | ✅     |
| `/cupons`, `/cupons/:id`, `/promocoes` | Cupons/promos          | Ofertas             | ✅     |

## Classificados · Profissionais · Serviços

| Rota                                                            | Objetivo               | Status |
| --------------------------------------------------------------- | ---------------------- | ------ |
| `/classificados`, `/novo`, `/editar/:id`, `/vendedor/:sellerId` | CRUD classificados     | ✅     |
| `/oportunidades`, `/oportunidades/:id`                          | Vagas rápidas          | ✅     |
| `/servicos` (admin sub-rota)                                    | Serviços profissionais | ✅     |

## Mobilidade

| Rota                                          | Objetivo        | Status |
| --------------------------------------------- | --------------- | ------ |
| `/mobilidade`                                 | Home mobilidade | ✅     |
| `/mobilidade/passageiro`, `/buscando/:rideId` | Passageiro      | ✅     |
| `/mobilidade/motorista`, `/perfil`            | Motorista       | ✅     |
| `/mobilidade/motoboy`                         | Motoboy         | ✅     |
| `/mobilidade/historico`                       | Histórico       | ✅     |
| `/mobilidade/contatos-emergencia`             | Contatos SOS    | ✅     |

## Perfil & Conta

| Rota canônica                 | Alias legado                | Objetivo                                           | Status |
| ----------------------------- | --------------------------- | -------------------------------------------------- | ------ |
| `/conta`, `/conta/*`          | `/perfil`, `/perfil/*`      | Área pessoal multi-perfil no shell Território Vivo | ✅     |
| `/conta/editar/:profileId`    | `/perfil/editar/:profileId` | Editar identidade                                  | ✅     |
| `/conta/perfil/configuracoes` | `/perfil/configuracoes`     | Configurar perfil                                  | ✅     |
| `/conta/enderecos`            | `/perfil/enderecos`         | Endereços privados e território                    | ✅     |
| `/conta/notificacoes`         | `/perfil/notificacoes`      | Notificações do usuário                            | ✅     |
| `/conta/preferencias`         | `/perfil/preferencias`      | Preferências                                       | ✅     |
| `/conta/privacidade`          | —                           | Privacidade LGPD                                   | ✅     |
| `/conta/seguranca`            | —                           | Segurança                                          | ✅     |
| `/conta/profissional`         | —                           | Perfil profissional                                | ✅     |

## Autenticação & Institucional

| Rota                                                                                      | Objetivo             | Status                             |
| ----------------------------------------------------------------------------------------- | -------------------- | ---------------------------------- |
| `/login`, `/cadastro`, `/cadastro/confirmacao`, `/reset-password`, `/aceitar-termos`      | Auth                 | ✅                                 |
| `/about`, `/contato`, `/status`, `/pricing`, `/planos`, `/dpo`, `/privacidade`, `/termos` | Institucional        | ✅                                 |
| `/educacao`                                                                               | Landing Educação     | ✅                                 |
| `/gamificacao`                                                                            | Gamificação          | 🟡 sem entrada estável na UI       |
| `/ai/virtual-try-on`                                                                      | AI feature           | 🟡 sem entrada visível             |
| `/offline-settings`                                                                       | Config offline       | 🟡 sem CTA — mover p/ Preferências |
| `/notificacoes`                                                                           | Central notificações | ✅                                 |
| `/notifications`                                                                          | alias en-US          | 🗄                                 |
| `LaunchPausedPage`                                                                        | Kill-switch          | ✅                                 |

## Admin / Central

Prefixo `/admin/*` e `/central/*` (RBAC). Sub-rotas:

`analytics · usuarios · roles · reivindicacoes · verificacoes · moderacao · pedidos · promocoes · planos · pontos-embarque · reports-passageiros · motoristas · motoboy · motoboy-operacoes · realtime-dashboard · territorial-groups · territory-management · territory-content · locations · ssot · setup · vagas · servicos · community-interest · operacoes · produto/:productSlug`

Responsável: `modules/admin` e `modules/central`. Jornada: acessado por menu admin (visível apenas para roles com permissão via `has_role`).

## Regras

1. Toda rota nova exige entrada nesta tabela **antes** do merge.
2. Toda página com status 🟡 "sem entrada" é débito de navegação e deve ser resolvida ou removida.
3. Aliases legados (`/perfil/*`, `/busca`, `/empresas-landing`, `/notifications`) só existem por compatibilidade; novos links privados devem usar `/conta/*`.
4. Nomes de arquivo canônicos: `Territory*Page`. Ver [`06-navigation/NAVIGATION-MAPPING.md`](./06-navigation/NAVIGATION-MAPPING.md) para o mapeamento antigo → novo.
