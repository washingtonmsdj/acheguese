# HOME-INVENTORY

> **MVP enxuto — decisão de release 2026-09-21:** os únicos domínios públicos de produto são **Comunidade básica, Empresas e Classificados**. Home, Conta, Território e Busca são infraestrutura de acesso. Permanecem pausados para pós-MVP: `billing=false`, `gastronomy=false`, `services=false`, `touristPoints=false`, `map=false`, `nearby=false`, `education=false`, `jobs=false`, `events=false`, `communityEventsPreview=false`, `communication=false`, `mobility=false`, `coupons=false`, `gamification=false` e `communityCommunication=false`. O código desses módulos é preservado; as superfícies públicas ficam isoladas por `launchScope.ts`.

> Sprint **HOME.SPEC.1** — inventário congelado da Territory Home (`src/app/pages/TerritoryHomePage.tsx`) e das funcionalidades do Achegue-se.
>
> Escopo: **somente leitura**. Sem código, sem wireframe, sem decisão de layout. Base de referência para a especificação oficial da Home.
>
> Fontes primárias consultadas: `TerritoryHomePage.tsx`, `docs/SCREEN-MAP.md`, `docs/FEATURE-MAP.md`, `src/config/moduleSlugs.ts`, `src/config/territory.ts`, `src/core/navigation/BottomNav.tsx`, `src/app/routes/AppRoutes.tsx`.

> Corte MVP atual: Analytics público não é candidato à Home enquanto `publicAnalytics=false`.

---

## 1. Inventário da Territory Home atual

Arquivo: `src/app/pages/TerritoryHomePage.tsx` (534 linhas). Rotas que renderizam: `/`, `/inicio`, `/comunidade/:uf/:city/:hood`.

Hooks/serviços vivos:
- `useActiveTerritory()` — território ativo (nome, cidade, estado).
- `useSessionContext()` — usuário logado (para badge do sino).
- `useUnifiedNotifications()` — contador `unreadCount` (dado real).
- `LAUNCH_URLS` de `@/config/territory` — mapa de destinos por vertical (dado real derivado do launch scope).
- `getCategoryTokens()` — tokens semânticos por categoria (`--category-*`).

### Bloco 1 — Header de território (sticky)
| Campo | Valor |
|---|---|
| Objetivo | Fixar "onde estou" e dar acesso a trocar de bairro / abrir notificações. |
| Componentes | `<header sticky>`, `MapPin`, `ChevronDown`, `Bell` (lucide), `Link` (react-router). |
| Dados | `territoryName` (derivado de `activeLocation` ou params), `cityLine` (city+UF), `user`, `unreadCount`. |
| Origem | `useActiveTerritory`, `useParams`, `useSessionContext`, `useUnifiedNotifications`. |
| Navega para | `/onboarding` (trocar bairro), `/notificacoes` (logado) ou `/login` (visitante). |
| Dependências | Session, notifications, roteamento, tokens `--category-alert*`. |
| Dados reais? | **Reais** (território, sessão, contador de notificações). |

### Bloco 2 — Busca do bairro
| Campo | Valor |
|---|---|
| Objetivo | Entrada única de busca contextual ao território. |
| Componentes | `<form role="search">`, `<input type=search>`, `Search`. |
| Dados | Query digitada (`q`). |
| Origem | Input do usuário. |
| Navega para | `LAUNCH_URLS.search` (`/busca/...`) com `?q=`. |
| Dependências | `LAUNCH_URLS.search`, `useNavigate`. |
| Dados reais? | **Real** (submit navega para a busca federada existente). |

### Bloco 3 — "Hoje na {território}"
| Campo | Valor |
|---|---|
| Objetivo | Mostrar 1 destaque + 2 chips do que importa agora (alerta / evento / discussão). |
| Componentes | `<section>`, cards `Link`, ícones `AlertTriangle`/`Calendar`/`MessageCircle`, tokens de categoria. |
| Dados | Array literal `today[]` com 3 itens fixos (alerta interdição, feira orgânica, pergunta de eletricista). |
| Origem | **Mock inline** (const `today`). |
| Navega para | `LAUNCH_URLS.map`, `LAUNCH_URLS.events`, `LAUNCH_URLS.community`. |
| Dependências | `getCategoryTokens`, `LAUNCH_URLS`. |
| Dados reais? | **Mock**. Não há hook consumindo alerts/events/posts do bairro aqui. |

### Bloco 4 — "Vale conferir" (Highlights)
| Campo | Valor |
|---|---|
| Objetivo | 3 cards editoriais mistos: post da comunidade + empresa + evento. |
| Componentes | Cards `Link` heterogêneos (post, empresa, evento), `Star`, `Calendar`, `MessageCircle`, `CheckCircle2`. |
| Dados | Array literal `highlights[]` (autor Juliana, Mercado Bom Dia, Feira local). |
| Origem | **Mock inline**. |
| Navega para | `LAUNCH_URLS.community` / `LAUNCH_URLS.business` / `LAUNCH_URLS.events`. |
| Dependências | Tokens semânticos, `LAUNCH_URLS`. |
| Dados reais? | **Mock**. Não usa `useLandingFeatured`, `useCommunityFeed`, `useAlerts` etc. |

### Bloco 5 — "O que você quer fazer?" (Ações rápidas)
| Campo | Valor |
|---|---|
| Objetivo | Atalhos em chips para procurar, ver mapa, comer agora, como chegar. |
| Componentes | Lista de chips `Link` com ícones (`Search`, `Navigation`, `UtensilsCrossed`, `Car`). |
| Dados | Array literal `quickActions[]` (4 itens). |
| Origem | **Estático** (não é dado de negócio; é IA de navegação). |
| Navega para | `LAUNCH_URLS.search`, `.map`, `.gastronomy`, `.map`. |
| Dependências | `LAUNCH_URLS`, tokens de categoria. |
| Dados reais? | **Estático** (destinos são reais). |

### Bloco 6 — "Passear pelo bairro" (Explore verticais)
| Campo | Valor |
|---|---|
| Objetivo | Chip-row horizontal com verticais do produto. |
| Componentes | `<ul>` snap-x, chips `Link`. |
| Dados | Lista inline: Gastronomia, Mobilidade, Empresas, Serviços, Imóveis, Eventos, Classificados. Filtro `href !== '#'`. |
| Origem | **Estático**. |
| Navega para | Rotas de módulo em `LAUNCH_URLS`. |
| Dependências | `LAUNCH_URLS`. |
| Dados reais? | **Estático**; "Imóveis" reaproveita `LAUNCH_URLS.business` (rota provisória). |

### O que a Home **não** possui hoje
- Bottom nav (renderizada por layout externo, não pela Home).
- Nenhum consumo de dados reais de posts, alertas, eventos, empresas, mensagens, favoritos ou perfil.
- Nenhum estado (loading / erro / vazio / offline / visitante-em-viagem / cidade-não-suportada) além do fallback textual de `territoryName = "Seu bairro"`.
- Nenhum bloco de perfil, mensagens diretas, mobilidade solicitada, achados & perdidos, recomendações, enquetes, comunicação oficial.

---

## 2. Inventário de funcionalidades do Achegue-se (candidatas à Home)

Legenda: **Pronto** = rota + página em produção · **Parcial** = rota existe mas conteúdo/dados limitados · **Ausente** = rota placeholder ou `LaunchPausedPage`.

### 2.1 Núcleo territorial / comunidade
| Feature | Implementada? | Rota | Página | Pronta? | Faz sentido na Home? | Tela principal se não for Home |
|---|---|---|---|---|---|---|
| Feed do bairro | Sim | `/comunidade/:uf/:city/:hood/feed` | `ComunidadePage` | **Pronto** | **Sim** (resumo dos últimos posts). | — |
| Timeline / Home do bairro | Sim | `/`, `/inicio`, `/comunidade/:uf/:city/:hood` | `TerritoryHomePage` | Pronto (mocks) | **É a própria Home.** | — |
| Detalhe de post | Sim | `/p/:slug/*` | `PostPage` + modal | Pronto | Não (é destino, não bloco). | Home → card → PostPage. |
| Publicar post | Sim | `/novo-post` | `NovoPostPage` | Pronto (rascunhos + Turnstile) | **Sim** como CTA/FAB, não bloco. | Bottom nav + FAB. |
| Comentários / reações | Sim | dentro do post | `PostCommentsPanel` | Pronto | Não. | PostPage. |
| Cidade / descoberta | Sim | `/:uf/:city`, Busca e Mapa territoriais | `TerritoryHomePage` + `BuscaPage` + `MapaPageV4` | Pronto por owner | Home é o contexto; Busca/Mapa aprofundam. | Header → trocar território / Explorar. |
| Entrada territorial | Sim | `/`, `/?trocar=territorio` | `TerritoryEntryPage` | Pronto | Não (é resolução anterior à Home). | Troca territorial. |
| Waitlist bairro em breve | Sim | `/interesse` | `CommunityInterestPage` | Pronto | Só se território ativo for `coming_soon`. | Rota dedicada. |

### 2.2 Comunidade — módulos transversais
| Feature | Impl.? | Rota | Pronta? | Home? | Tela principal se não |
|---|---|---|---|---|---|
| Alertas do bairro | Preservado, pausado no MVP | `/alertas` | `LaunchPausedPage` (`communityAlerts=false`) | Não enquanto pausado. | `/alertas`. |
| Problemas do bairro | Preservado, pausado no MVP | `/problemas` | `LaunchPausedPage` (`communityIssues=false`) | Não enquanto pausado. | `/problemas`. |
| Achados & Perdidos | Preservado, pausado no MVP | `/achados-perdidos` (+ `/novo`, `/:id`) | `LaunchPausedPage` (`communityLostFound=false`) | Não enquanto pausado. | `/achados-perdidos`. |
| Mensagens diretas | Sim | `/mensagens`, `/chat/:id` | Pronto | Só como indicador no header (contador). | `/mensagens`. |
| Comunicação territorial | Preservado, pausado no MVP | `/comunicacao` (+ agente/empresa/solicitar) | `LaunchPausedPage` (`communication=false`) | Não enquanto pausado. | `/comunicacao`. |
| Busca federada | Sim | `/buscar` (alias `/busca`) | Pronto | **Sim** (barra de busca). | `/buscar`. |
| Recomendações | Parcial | dentro da comunidade | Parcial | Não obrigatório. | Feed. |
| Perguntas / Enquetes | Parcial | tipo de post | Parcial | Não. | Feed. |

### 2.3 Empresas / Comércio
| Feature | Impl.? | Rota | Pronta? | Home? | Tela principal se não |
|---|---|---|---|---|---|
| Landing empresas | Sim | `/empresas` | Pronto | **Sim** (destaques). | `/empresas`. |
| Catálogo empresa | Sim | `/empresas/:id/catalogo` | Pronto | Não (detalhe). | Landing empresa. |
| Site premium empresa | Sim | `/p/:slug/*` | Pronto | Não. | `/p/:slug`. |
| Cadastro empresa | Sim | `/empresas/cadastrar` | Pronto | Talvez (CTA "cadastre sua empresa"). | `/empresas/cadastrar`. |
| Dashboard empresa | Sim | `/dashboard-empresa` | Pronto | Não (perfil dono). | `/perfil`. |
| Cupons / Promoções | Preservado, pausado no MVP | `/cupons`, `/promocoes` | `LaunchPausedPage` (`coupons=false`) | Não enquanto pausado. | `/cupons`. |
| Gastronomia | Preservado, pausado pós-MVP | via `LAUNCH_URLS.gastronomy` | `LaunchPausedPage` (`gastronomy=false`) | Não. | Pós-MVP. |

### 2.4 Classificados / Serviços / Vagas
| Feature | Impl.? | Rota | Pronta? | Home? |
|---|---|---|---|---|
| Classificados | Sim | `/classificados` (+ CRUD) | Pronto | Chip em "Explore". |
| Vendedor | Sim | `/vendedor/:sellerId` | Pronto | Não. |
| Oportunidades / vagas rápidas | Preservado, pausado pós-MVP | `/oportunidades` | `LaunchPausedPage` (`jobs=false`) | Não. |
| Serviços profissionais | Preservado, pausado pós-MVP | `/servicos` | `LaunchPausedPage` (`services=false`) | Não. |

### 2.5 Mobilidade
| Feature | Impl.? | Rota | Pronta? | Home? |
|---|---|---|---|---|
| Home mobilidade | Preservado, pausado no MVP | `/mobilidade` | `LaunchPausedPage` (`mobility=false`) | Não enquanto pausado. |
| Passageiro / motorista / motoboy | Preservado, pausado no MVP | `/mobilidade/*` | `LaunchPausedPage` (`mobility=false`) | Não. |
| Histórico | Preservado, pausado no MVP | `/mobilidade/historico` | `LaunchPausedPage` (`mobility=false`) | Não. |
| Contatos de emergência | Preservado, pausado no MVP | `/mobilidade/contatos-emergencia` | `LaunchPausedPage` (`mobility=false`) | Não. |

### 2.6 Perfil, conta, notificações
| Feature | Impl.? | Rota | Pronta? | Home? |
|---|---|---|---|---|
| Perfil multi-perfil | Sim | `/perfil`, `/perfil/*` | Pronto | Só como acesso via bottom nav. |
| Endereços / preferências / notif do usuário | Sim | `/perfil/*` | Pronto | Não. |
| Privacidade / segurança | Sim | `/conta/*` | Pronto | Não. |
| Central de notificações | Sim | `/notificacoes` | Pronto | **Sim** (badge no header). |
| Favoritos | Parcial | espalhado | Parcial | Talvez atalho. Sem rota consolidada. |

### 2.7 Autenticação e institucional
| Feature | Impl.? | Rota | Pronta? | Home? |
|---|---|---|---|---|
| Login / cadastro / reset / confirmação | Sim | `/login`, `/cadastro`, `/cadastro/confirmacao`, `/reset-password`, `/aceitar-termos` | Pronto | Só via header quando visitante. |
| Sobre / contato / status / privacidade / termos | Sim | `/about`, `/contato`, `/status`, `/dpo`, `/privacidade`, `/termos` | Pronto | Não. |
| Billing / preços | Preservado, mas pausado no MVP | `/planos`, `/checkout/*`, `/settings/subscription` | `LaunchPausedPage` com `billing=false` | Não. |
| Educação | Preservado, pausado no MVP | `/educacao` | `LaunchPausedPage` (`education=false`) | Não enquanto pausado. |
| Gamificação | Preservado, pausado no MVP | `/gamificacao` | `LaunchPausedPage` (`gamification=false`) | Não. |
| AI virtual try-on | Parcial | `/ai/virtual-try-on` | Parcial | Não. |
| Offline settings | Parcial | `/offline-settings` | Parcial | Não. |
| Launch paused | Sim | `LaunchPausedPage` | Pronto | Aparece dentro de rotas de módulos pausados. |

### 2.8 Descoberta / mapa
| Feature | Impl.? | Rota | Pronta? | Home? |
|---|---|---|---|---|
| Mapa territorial | Parcial | `LAUNCH_URLS.map` | Parcial | Sim como ação rápida ("Perto de mim"). |
| Perto de mim | Sim | ação sobre mapa/busca | Pronto | **Sim**. |
| Nacional hub (SEO) | Sim | `/br`, `/brasil` | Pronto | Não. |
| Landings públicas cidade | Sim | `/:state/:city` | Pronto | Não (é caminho de entrada). |

### 2.9 Eventos
| Feature | Impl.? | Rota | Pronta? | Home? |
|---|---|---|---|---|
| Módulo eventos (home, favoritos, calendário, mapa, detalhe) | **Pausado** | `/eventos/*` | Serve `LaunchPausedPage` | Só como card "em breve". |

### 2.10 Admin / Central
| Feature | Impl.? | Rota | Pronta? | Home? |
|---|---|---|---|---|
| Admin / Central | Sim | `/admin/*`, `/central/*` | Pronto (RBAC) | Nunca. Sempre menu admin. |

---

## 3. Reutilizável imediato (dados/hook já prontos, hoje ainda não plugados na Home)
- `useLandingFeatured(filter)` — retorna `businesses`, `services`, `gastronomy`, `classifieds`, `stats` por território (fonte real para "Vale conferir" e "Explore").
- `useAlerts({ city, neighborhood, status })` — fonte real para "Hoje" quando o item for alerta.
- `useUnifiedNotifications()` — já em uso no header.
- `useActiveTerritory()` — já em uso.
- `useCommunityFeed` (via módulo `core/community`) — fonte para últimos posts do bairro.
- `useSessionContext()` — estados de visitante vs morador.
- `PostCard` / `BusinessCard` / `EmptyState` / `TerritoryFeedHeader` / `contentCategories` — componentes SSOT prontos para reuso.
- `LAUNCH_URLS` — destinos por vertical.

## 4. Incompleto (aparece na Home mas não tem lastro de dado)
- **"Hoje"** — 3 itens são mock; precisa plugar `useAlerts`, `useLandingFeatured` (eventos) e `useCommunityFeed`.
- **"Vale conferir"** — 3 itens mock; substituir por `useLandingFeatured` + `useCommunityFeed`.
- **Estados da Home** — não há tratamento explícito para: visitante logado sem território, morador sem posts hoje, cidade não suportada (`coming_soon`), visitante em viagem (território diferente do salvo), offline.
- **Mobilidade** — `LAUNCH_URLS.map` pode não existir em todos os ambientes; código já filtra `href === '#'`, mas Home não sinaliza indisponibilidade.
- **Eventos** — módulo está em `LaunchPaused`; qualquer bloco de eventos na Home deve refletir "em breve".
- **Favoritos** — não há hook/rota consolidada; menção na Home exigiria feature nova (fora de escopo).

## 5. NUNCA deveria aparecer na Home
- Admin / Central (`/admin/*`, `/central/*`).
- Dashboards de empresa (`/dashboard-empresa`, `/edit-business/:profileId`).
- Fluxos de mobilidade internos (passageiro, motorista, motoboy operações, contatos SOS).
- Detalhe de post (`/p/:slug`) — é destino, não bloco.
- Páginas institucionais (`/about`, `/termos`, `/privacidade`, `/dpo`, `/status`) e Billing pausado (`/planos`, `/checkout/*`, `/settings/subscription`).
- Auth (`/login`, `/cadastro`, `/reset-password`, `/aceitar-termos`) — só acessados via header/CTA quando visitante.
- Configurações de perfil (`/perfil/*`, `/conta/*`).
- Rotas alias legadas (`/busca`, `/notifications`, `/empresas-landing`, `/conta/*`).
- AI Virtual Try-On, Offline Settings, Gamificação (sem UI estável).

## 6. OBRIGATÓRIO na Home (baseado no que já foi decidido em DECISIONS/UX)
1. **Território fixo** (header sticky) — identidade + trocar bairro + sino.
2. **Busca contextual** — entrada rápida ao `/buscar`.
3. **Hoje no território** — alertas, eventos próximos, posts quentes (dados reais).
4. **Vale conferir / Destaques** — posts + empresas + eventos do bairro (dados reais).
5. **Ações rápidas** — chips: procurar, perto de mim, comer agora, como chegar.
6. **Explore verticais** — chip-row para módulos ativos (Gastronomia, Empresas, Serviços, Classificados, Mobilidade, Eventos em-breve).
7. **Estados oficiais** — visitante, morador, cidade não suportada (`coming_soon` → `/interesse`), visitante em viagem, offline, sem-conteúdo-hoje.

---

**Fim do inventário.** Próximo passo (fora desta sprint): usar este documento para redigir a especificação oficial da Territory Home (`HOME-SPEC.md`) com decisão de blocos, ordem, dados e estados.
