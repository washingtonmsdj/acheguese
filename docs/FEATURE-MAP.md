# FEATURE-MAP

Domain status: Feed = STATUS: FROZEN.

> Mapa único de funcionalidades do Achegue-se. Toda funcionalidade precisa ter uma **entrada de navegação**. Toda rota precisa ter uma funcionalidade que a justifica.
>
> Status: ✅ ativo · 🟡 parcial/beta · 🚧 em construção · 🗄 arquivado

---

## 1. Onboarding & Identidade

| Funcionalidade                                  | Status | Onde aparece              | Como o usuário chega                      |
| ----------------------------------------------- | ------ | ------------------------- | ----------------------------------------- |
| Splash / entrada anônima                        | ✅     | `SplashPage`              | `/` (visitante sem território)            |
| Onboarding de território (cidade + bairro)      | ✅     | `OnboardingPage`          | `/onboarding` · CTA "Escolher meu bairro" |
| Cadastro (email + senha, terms, força de senha) | ✅     | `CadastroPage`            | `/cadastro` · header + CTAs de login      |
| Confirmação de cadastro (resend)                | ✅     | `CadastroConfirmacaoPage` | pós-cadastro                              |
| Login (com Turnstile + banner de erro)          | ✅     | `LoginPage`               | `/login`                                  |
| Reset de senha                                  | ✅     | `ResetPasswordPage`       | `/reset-password` · link do login         |
| Aceite de termos                                | ✅     | Rota `/aceitar-termos`    | forçado no primeiro acesso pós-cadastro   |

---

## 2. Território (SSOT de navegação)

| Funcionalidade                             | Status | Onde aparece                            | Como o usuário chega                             |
| ------------------------------------------ | ------ | --------------------------------------- | ------------------------------------------------ |
| Territory Entry (mudar bairro/cidade)      | ✅     | `TerritoryEntryPage`                    | troca territorial → `/?trocar=territorio`        |
| Entrada/resolução territorial              | ✅     | `RootRouteEntry` / `TerritoryEntryPage` | `/`                                              |
| Territory Home (cidade ou bairro/grupo)    | ✅     | `TerritoryHomePage`                     | `/:state/:city[/:territory]`                     |
| Explorar (busca + mapa)                    | ✅     | módulos territoriais de busca/mapa      | `/busca/:state/:city[/:territory]` · `/mapa/...` |
| Territory Feed (timeline completa)         | ✅     | `TerritoryFeedPage`                     | Home → "Ver mais do bairro"                      |
| Territory Unavailable (bairro coming_soon) | ✅     | `TerritoryUnavailablePage`              | redirecionamento automático + `/interesse`       |
| Waitlist de interesse (bairro futuro)      | ✅     | `CommunityInterestPage`                 | banner "Bairro chegando em breve"                |
| National hub                               | ✅     | `NationalHubPage`                       | `/br`, `/brasil`                                 |
| Landing pública de cidade                  | ✅     | `PublicCityLandingPage`                 | SEO — links externos, sitemap                    |

---

## 3. Comunidade (Feed & Posts)

Status do dominio Feed: FROZEN. Documento oficial: `docs/feed/FEED-FREEZE.md`.

| Funcionalidade                              | Status | Onde aparece                                    | Como o usuário chega                                                |
| ------------------------------------------- | ------ | ----------------------------------------------- | ------------------------------------------------------------------- |
| Feed do bairro (timeline unificada)         | ✅     | `CommunityFeed`                                 | Home → resumo de Community → Community territorial                  |
| Publicar post (composer + rascunho AES-GCM) | ✅     | `NovoPostPage` / `CreatePostModal`              | CTA contextual somente com `create_post` permitido                  |
| Rascunho offline com resolução de conflito  | ✅     | `postDraftCrypto` + service                     | reabertura do composer                                              |
| Detalhe do post (modal)                     | ✅     | `PostDetailModal` via `FeedService.getDetail()` | tap no card do feed · URL territorial com `?post=<id>`              |
| Comentários (thread + composer humanizado)  | ✅     | `PostCommentsPanel`                             | dentro do post                                                      |
| Compartilhar post (SSOT Feed)               | ✅     | `useShareFeedItem` / `FeedService.shareItem()`  | ícone dentro do card/detalhe; gera URL territorial com `?post=<id>` |
| Reações / social engagement                 | ✅     | inline no card                                  | tap direto                                                          |
| Aba Comunicação territorial                 | ✅     | `TerritorialCommunityCommunicationPage`         | tabs do bairro                                                      |
| Alertas comunitários                        | ✅     | `/alertas`                                      | menu comunidade                                                     |
| Achados & perdidos                          | ✅     | `/achados-perdidos`, `/achados-perdidos/novo`   | menu comunidade                                                     |
| Direct messages comunitário                 | ✅     | `/mensagens`, `/chat/:id`                       | header/notificações                                                 |

---

## 4. Empresas (comércio local)

| Funcionalidade                | Status | Onde aparece                | Como o usuário chega                                 |
| ----------------------------- | ------ | --------------------------- | ---------------------------------------------------- |
| Landing de empresas do bairro | ✅     | `EmpresasLandingPage`       | `/empresas` · Territory Home → "Passear pelo bairro" |
| Detalhe de empresa            | ✅     | `EmpresaDetailLandingPage`  | tap no card de empresa                               |
| Catálogo de produtos          | ✅     | `/empresas/:id/catalogo`    | dentro da página da empresa                          |
| Cadastro de empresa           | ✅     | `/empresas/cadastrar`       | CTA "Cadastrar minha empresa"                        |
| Dashboard de empresa          | ✅     | `DashboardEmpresaPage`      | área logada como owner                               |
| Editar empresa                | ✅     | `/edit-business/:profileId` | dashboard da empresa                                 |
| Cupons / promoções            | ✅     | `/cupons`, `/promocoes`     | dentro da empresa e feed                             |
| Favoritos de empresa          | ✅     | dentro do perfil            | Perfil → Favoritos                                   |

---

## 5. Classificados

| Funcionalidade              | Status | Onde aparece                        | Como chega      |
| --------------------------- | ------ | ----------------------------------- | --------------- |
| Feed de classificados       | ✅     | `/classificados`                    | menu principal  |
| Novo classificado           | ✅     | `/classificados/novo`               | CTA no feed     |
| Editar classificado         | ✅     | `/classificados/editar/:id`         | próprio anúncio |
| Vendedor (perfil)           | ✅     | `/classificados/vendedor/:sellerId` | tap no autor    |
| Mensageria de classificados | ✅     | inbox territorial                   | notificações    |

---

## 6. Profissionais & Serviços

| Funcionalidade            | Status | Onde chega                             |
| ------------------------- | ------ | -------------------------------------- |
| Oportunidades de trabalho | ✅     | `/oportunidades`, `/oportunidades/:id` |
| Área profissional         | ✅     | `/conta/profissional`                  |
| Vagas / serviços (admin)  | ✅     | admin sub-rotas                        |

---

## 7. Mobilidade

| Funcionalidade              | Status | Rota                                                     |
| --------------------------- | ------ | -------------------------------------------------------- |
| Home mobilidade             | ✅     | `/mobilidade`                                            |
| Passageiro (buscar corrida) | ✅     | `/mobilidade/passageiro`, `/mobilidade/buscando/:rideId` |
| Motorista (turno)           | ✅     | `/mobilidade/motorista`, `/mobilidade/motorista/perfil`  |
| Motoboy                     | ✅     | `/mobilidade/motoboy`                                    |
| Histórico                   | ✅     | `/mobilidade/historico`                                  |
| Contatos de emergência      | ✅     | `/mobilidade/contatos-emergencia`                        |

---

## 8. Perfil & Conta

| Funcionalidade                             | Status | Rota                                                                                            |
| ------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------- |
| Conta privada multi-perfil                 | ✅     | `/conta`, `/conta/*`                                                                            |
| Editar perfil (com `profileId`)            | ✅     | `/conta/editar`, `/conta/editar/:profileId`                                                     |
| Configurações / privacidade / notificações | ✅     | `/conta/perfil/configuracoes`, `/conta/preferencias`, `/conta/enderecos`, `/conta/notificacoes` |
| Aliases legados de perfil                  | ✅     | `/perfil/*` → `/conta/*`                                                                        |
| DPO / LGPD                                 | ✅     | `/dpo`, `/privacidade`, `/termos`                                                               |
| Segurança da conta                         | ✅     | `/conta/seguranca`                                                                              |

---

## 9. Busca

| Funcionalidade           | Status | Rota                                   |
| ------------------------ | ------ | -------------------------------------- |
| Busca federada no bairro | ✅     | `/buscar` (canônico), `/busca` (alias) |

---

## 10. Notificações

| Funcionalidade          | Status | Rota                              |
| ----------------------- | ------ | --------------------------------- |
| Central de notificações | ✅     | `/notificacoes`, `/notifications` |
| Preferências            | ✅     | `NotificationPreferencesPage`     |

---

## 11. Admin & Central operacional

Todas em `/admin/*` e `/central/*` (RBAC obrigatório):

- Coverage matrix · usuarios · roles · reivindicações · verificações · moderação · pedidos · promoções · planos · pontos-embarque · reports-passageiros · motoristas · motoboy-operacoes · realtime-dashboard · territory-management · territory-content · territorial-groups · SSOT · setup · analytics · **community-interest** (waitlist)

Chegada: menu admin (visível só para roles apropriados).

---

## 12. Institucional

| Funcionalidade              | Rota                  |
| --------------------------- | --------------------- |
| Sobre                       | `/about`              |
| Contato                     | `/contato`            |
| Status público              | `/status`             |
| Preços                      | `/pricing`, `/planos` |
| Educação (landing)          | `/educacao`           |
| Gamificação                 | `/gamificacao`        |
| AI: Virtual try-on          | `/ai/virtual-try-on`  |
| Launch paused (kill-switch) | `LaunchPausedPage`    |

---

## Rotas órfãs / duplicadas identificadas

- **`/busca` × `/buscar`** — manter `/buscar` como canônico, `/busca` é alias legado.
- **`/notificacoes` × `/notifications`** — manter `/notificacoes` (pt-BR).
- **`/conta/*` × `/perfil/*`** — `/conta/*` é o namespace privado canônico; `/perfil/*` existe somente por compatibilidade.
- **`/empresas` × `/empresas-landing`** — `/empresas` é canônico.
- **`/inicio` × `/`** — `/` resolve território; `/inicio` mantém o hub nacional legado. A Home canônica está em `/:uf/:cidade[/:territorio]`.

## Funcionalidades sem entrada visível na UI

- **`/ai/virtual-try-on`** — sem link em menu; acessível apenas via URL direta. **Ação:** decidir se promove no perfil da empresa ou remove.
- **`/offline-settings`** — sem CTA principal; hoje só via link técnico. **Ação:** mover para dentro de "Preferências".
- **`/gamificacao`** — sem entrada estável. **Ação:** confirmar se roadmap pretende expor ou arquivar.

Toda funcionalidade acima com "sem entrada" é **débito de navegação** e deve ser resolvida antes do go-live.
