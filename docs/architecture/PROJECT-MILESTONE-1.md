# PROJECT-MILESTONE-1.md

Data: 2026-07-26

Status: marco arquitetural consolidado do projeto apos Territory e Feed Freeze. Feed STATUS: FROZEN.

Regra de escopo: este documento apenas registra o estado arquitetural atual. Nao implementa codigo, nao altera arquitetura, nao altera banco, nao altera contratos e nao modifica documentos existentes.

## 1. Base do marco

Documentos de referencia principais:

- `docs/domain/TERRITORY-GOVERNANCE.md`
- `docs/domain/TERRITORY-ROADMAP.md`
- `docs/domain/TERRITORY-DATA-QUALITY-V2.md`
- `docs/domain/TERRITORY-FREEZE-AUDIT.md`
- `docs/domain/SALVADOR-IMPLEMENTATION-1-REPORT.md`
- `docs/feed/FEED-GOVERNANCE.md`
- `docs/feed/FEED-MILESTONE-1.md`
- `docs/feed/FEED-MILESTONE-1-HARDENING.md`
- `docs/feed/FEED-FREEZE-AUDIT.md`
- `docs/feed/FEED-FREEZE-AUDIT-2.md`
- `docs/feed/FEED-FREEZE.md`
- `docs/feed/FEED-FREEZE-CHANGELOG.md`
- `docs/architecture/SSOT_REGISTRY.md`
- `docs/03-architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md`
- `docs/03-architecture/COMMUNITY_PORTAL_PUBLIC_ENTITY_SSOT.md`
- `docs/07-modules/SEARCH_SSOT.md`
- `docs/07-modules/BUSINESS_FAVORITES_SSOT.md`
- `docs/07-modules/GASTRONOMY_CONSOLIDATION_SSOT.md`
- `docs/07-modules/NOTIFICATION_PREFERENCES_SSOT.md`
- `docs/07-modules/COMMUNITY_DIRECT_MESSAGING_SSOT.md`
- `docs/07-modules/CLASSIFIED_MESSAGING_SSOT.md`

Evidencias historicas preservadas, sem autoridade operacional pos-Freeze:

- `docs/feed/FEED-ROADMAP.md`
- `docs/feed/FEED-EXECUTION-PLAN.md`

## 2. Estado executivo

O projeto possui dois dominios com governanca arquitetural recente e explicita:

1. Territory, como fundacao geografica, de URL, filtro territorial, boundary, rollout territorial e qualidade territorial.
2. Feed, como dominio oficialmente congelado para timeline, detalhe, criacao, edicao, exclusao, poll vote, comentarios, reacoes, saves, share, reports, URL canonica, Search de posts e leitura social de `ride_share`.

Os demais dominios possuem SSOTs tecnicos, documentos de modulo ou contratos parciais, mas ainda nao possuem governanca completa, roadmap oficial, milestone e freeze no mesmo nivel de Territory e Feed.

## 3. Estado por dominio

### 3.1 Territory

| Campo | Estado |
| --- | --- |
| Governanca | Formalizada em `TERRITORY-GOVERNANCE.md`. Territory e o dominio dono de hierarquia geografica, URL territorial, `ResolvedTerritory`, `TerritoryFilter`, boundaries, `TerritoryGroup`, metadata territorial e regras de navegabilidade. |
| SSOT | `locations`, `territorial_groups`, `location_boundaries`, `src/core/location`, `src/core/territorial`, `BoundaryService`, `territoryUrls` e contratos derivados de `ResolvedTerritory`/`TerritoryFilter`. |
| Roadmap | Formalizado em `TERRITORY-ROADMAP.md`, com P0/P1/P2/P3. |
| Milestone | Consolidado como dominio-base do produto. Nao ha um arquivo unico de milestone equivalente ao Feed Milestone 1, mas a governanca, readiness de Salvador e Data Quality V2 compoem o marco atual. |
| Freeze | Parcial. A arquitetura esta consolidada, mas `TERRITORY-FREEZE-AUDIT.md` registrou bloqueios antes de Freeze completo. Salvador tambem ainda depende da sprint exclusiva de importacao dos boundaries restantes. |
| Dependencias | Depende de banco/Supabase, dados oficiais territoriais e pipeline de boundaries. E dependencia obrigatoria para todos os dominios publicos. |
| Proxima Sprint | Boundary/data readiness de Salvador e enforcement operacional do modelo `TERRITORY-DATA-QUALITY-V2`, sem alterar a arquitetura congelada. |

### 3.2 Feed

| Campo | Estado |
| --- | --- |
| Governanca | Formalizada em `FEED-GOVERNANCE.md`. Feed e o boundary publico de timeline, detalhe, criacao, comentarios, compartilhamento, denuncias, reacoes e superficies sociais relacionadas. |
| SSOT | `FeedService`, `FeedRepository`, `FeedContext`, `FeedTarget`, `feedQueryKeys`, `useFeedContext`, `useFeedTimeline`, `useFeedItemDetail`, `useCreateFeedItem` e adapters autorizados. `PostService` e colaborador interno, nao porta publica. |
| Roadmap | Estado operacional pos-Freeze formalizado em `FEED-FREEZE.md` e `FEED-FREEZE-CHANGELOG.md`. `FEED-ROADMAP.md` e `FEED-EXECUTION-PLAN.md` permanecem apenas como evidencia historica das sprints executadas. |
| Milestone | `FEED-MILESTONE-1.md`, `FEED-MILESTONE-1-HARDENING.md`, `FEED-FREEZE-AUDIT-2.md` e `FEED-FREEZE.md` concluidos. |
| Freeze | STATUS: FROZEN. O dominio Feed esta oficialmente congelado; evolucoes futuras devem preservar GOVERNANCE, SSOT, boundaries e contratos publicos ou passar por ADR/DECISION especifica. |
| Dependencias | Territory, Community AccessPolicy, Rollout, Posts, Comments, Engagement, Mobility para `ride_share`, Search de posts e Notifications futuras. |
| Proxima Sprint | Nenhuma sprint funcional obrigatoria para Freeze. Proximas alteracoes devem seguir os criterios de `FEED-FREEZE.md`. |

### 3.3 Community

| Campo | Estado |
| --- | --- |
| Governanca | Parcial. `COMMUNITY_FIRST_ARCHITECTURE_SSOT.md` define Comunidade Local como produto social sobre Territory, mas ainda nao ha documento `COMMUNITY-GOVERNANCE.md` equivalente ao Feed. |
| SSOT | `territory_communities`, `community_public_aliases`, `community_memberships`, `community_entity_links`, `src/core/community-experience`, `CommunityExperienceService`, `CommunityMembershipRepository`, `CommunityEntityLinkRepository` e `CommunityAccessPolicy`. |
| Roadmap | Nao ha roadmap consolidado de Community neste marco. A evolucao social publica depende parcialmente do roadmap do Feed. |
| Milestone | Sem milestone proprio consolidado. |
| Freeze | Nao congelado como dominio completo. Possui contratos importantes, mas ainda sem Freeze macro. |
| Dependencias | Territory, Feed, Profiles/Auth, Community AccessPolicy, entity links, Moderation, Notifications e Messaging. |
| Proxima Sprint | Community governance/audit apos estabilizar comentarios do Feed, para separar superficie comunitaria, membresia, entidade vinculada e interacao social. |

### 3.4 Business

| Campo | Estado |
| --- | --- |
| Governanca | Parcial. Ha SSOTs de modulo como `BUSINESS_FAVORITES_SSOT.md` e decisao de Gastronomia dentro de Business, mas nao ha governanca macro oficial do dominio Business. |
| SSOT | `business_data`, `src/core/business`, `BusinessService`, `BusinessFavoriteService`, `BusinessFavoriteStore`, `src/modules/business/gastronomy` para vertical de Gastronomia. |
| Roadmap | Nao ha roadmap oficial consolidado do dominio Business neste marco. |
| Milestone | Sem milestone macro. Existem consolidacoes pontuais: favoritos de empresa e gastronomia. |
| Freeze | Parcial por subdominio; nao congelado como Business completo. |
| Dependencias | Territory para localizacao/URLs, Search para descoberta, Reviews/Favorites, Promotions, Gastronomy, Community entity links e, opcionalmente, Feed para distribuicao social. |
| Proxima Sprint | Business governance/audit para separar identidade empresarial, vertical gastronomia, anuncios, favoritos, reviews e discovery. |

### 3.5 Services

| Campo | Estado |
| --- | --- |
| Governanca | Nao formalizada como dominio autonomo neste marco. Ha SSOT tecnico de Professional no registry e referencias de servicos/profissionais em Community First. |
| SSOT | `professional_data`, `src/core/professional`, `ProfessionalService`, `src/modules/professionals/services` e contratos relacionados de prestadores. |
| Roadmap | Nao ha roadmap oficial consolidado. |
| Milestone | Sem milestone proprio. |
| Freeze | Nao congelado. |
| Dependencias | Territory, Profiles/Auth, Business quando houver entidade empresarial associada, Search, Community entity links, Notifications e Messaging. |
| Proxima Sprint | Services/Professional audit e governance antes de qualquer Freeze ou expansao publica ampla. |

### 3.6 Events

| Campo | Estado |
| --- | --- |
| Governanca | Parcial por contrato citado em Community First. Ainda nao ha `EVENTS-GOVERNANCE.md`. |
| SSOT | `events`, `src/core/verticals/events`, `EventReadService`, `EventRuntimeService`, `EventMutationService` e RPCs atomicas de participacao/check-in. |
| Roadmap | Nao ha roadmap oficial consolidado de Events neste marco. |
| Milestone | Sem milestone proprio. |
| Freeze | Nao congelado. |
| Dependencias | Territory, Community entity links, Search, Notifications, Profiles/Auth e, futuramente, Feed para divulgacao/interacao social quando aplicavel. |
| Proxima Sprint | Events governance/audit, com foco em leitura publica, participacao, check-in, rollout, URLs e busca. |

### 3.7 Mobility

| Campo | Estado |
| --- | --- |
| Governanca | Parcial. Existe documentacao ativa de Motoboy e ADR de SSOT para ride requests, mas nao ha governanca macro de Mobility. |
| SSOT | `src/core/mobility`, `src/modules/mobility`, tipos de chat/dispatch, contratos de ride requests e, para leitura social de `ride_share`, `FeedService.listRideShareItems()`. |
| Roadmap | Nao ha roadmap oficial consolidado de Mobility neste marco. |
| Milestone | Sem milestone proprio. O trecho social de `ride_share` foi consolidado no Feed Freeze a partir de P0.E. |
| Freeze | Parcial e limitado. A parte social migrada pelo Feed falha fechado; o dominio Mobility completo nao esta congelado. |
| Dependencias | Territory, Feed para `ride_share` publico/social, Profiles/Auth, Notifications, Messaging/Realtime, Routing/Geocoding e operadores de mobilidade. |
| Proxima Sprint | Mobility governance/audit para separar corrida, entrega, chat, dispatch, posts sociais e rollout territorial. |

### 3.8 Search

| Campo | Estado |
| --- | --- |
| Governanca | Parcial. `SEARCH_SSOT.md` define SearchService como orquestrador federado, mas nao ha roadmap/milestone macro do dominio Search. |
| SSOT | `src/core/search`, `SearchService`, `SearchDocumentMapper`, `searchProviders`, `useGlobalSearch` e `HomeDiscoveryService` para discovery de Home. |
| Roadmap | Nao ha roadmap proprio consolidado. A busca de posts com destino canonico territorial esta congelada no Feed; o dominio Search macro ainda depende de governanca propria. |
| Milestone | Sem milestone proprio. |
| Freeze | Nao congelado. |
| Dependencias | Territory, Community entity links, Business, Services/Professional, Events, Classifieds, Work Opportunities, Feed/Posts e launch gates. |
| Proxima Sprint | Search governance/audit apos Feed Freeze, para congelar o dominio Search macro sem reabrir o boundary de posts do Feed. |

### 3.9 Notifications

| Campo | Estado |
| --- | --- |
| Governanca | Parcial. `NOTIFICATION_PREFERENCES_SSOT.md` consolida preferencias, mas nao cobre todo o dominio de notificacoes. |
| SSOT | `src/core/notifications`, `NotificationPreferencesService`, RPCs de preferencias e tipos em `src/core/notifications/types.ts`. |
| Roadmap | Nao ha roadmap oficial consolidado. |
| Milestone | Sem milestone proprio. |
| Freeze | Parcial para preferencias; nao congelado como dominio de notificacoes completo. |
| Dependencias | Auth/User, Profiles, Feed para eventos sociais, Messaging, Mobility, Business/Events e Realtime/Push. |
| Proxima Sprint | Notifications governance/audit para separar preferencias, delivery, templates, links territoriais, transactional obrigatorio e integracoes de dominio. |

### 3.10 Messaging

| Campo | Estado |
| --- | --- |
| Governanca | Parcial. Existem SSOTs para Community Direct Messaging e Classified Messaging, mas nao ha governanca macro de Messaging. |
| SSOT | `src/core/messaging`, `MessagingService`, `CommunityDirectMessagingService`, contratos estruturais de inbox/thread, RPCs server-owned e Realtime filtrado. |
| Roadmap | Nao ha roadmap oficial consolidado. |
| Milestone | Sem milestone macro. Community DM possui contrato forte proprio. |
| Freeze | Parcial por agregado; nao congelado como dominio Messaging completo. |
| Dependencias | Profiles/Auth, Community, Posts/Feed quando conversa nasce de post, Classifieds quando conversa nasce de anuncio, Realtime, Notifications, Moderation e Privacy. |
| Proxima Sprint | Messaging governance/audit para unificar fronteiras entre Community DM, Classified Messaging, chat de Mobility e futuras inboxes sem criar chat universal indevido. |

### 3.11 AI

| Campo | Estado |
| --- | --- |
| Governanca | Nao formalizada como dominio de produto neste marco. Existe documentacao de regras de agente e plano AI arquivado, mas nao ha governanca ativa de AI. |
| SSOT | Sem SSOT ativo de dominio AI identificado. Existem diretorios `src/core/ai` e `src/modules/ai`, mas o ownership arquitetural nao esta congelado. |
| Roadmap | Nao ha roadmap oficial consolidado ativo. |
| Milestone | Sem milestone proprio. |
| Freeze | Nao congelado. |
| Dependencias | Security/Governance, dados canonicos dos dominios, Search, Feed, Messaging, Notifications, consentimento, privacidade e observabilidade. |
| Proxima Sprint | AI domain definition/audit antes de qualquer feature publica baseada em IA. |

## 4. Dominios considerados estaveis

Estaveis no nivel de boundary arquitetural:

- Territory: estavel como fundacao arquitetural e governanca de dados territoriais. Nao deve ser interpretado como Freeze operacional completo de todos os dados, boundaries e cidades.
- Feed: STATUS: FROZEN. Estavel como dominio social publico congelado para timeline, detalhe, criacao, edicao, exclusao, poll vote, comentarios, reacoes, saves, share, reports, URL canonica, Search de posts, leitura social de `ride_share`, cache territorial e falha fechada.

Nao devem ser declarados estaveis como dominio macro neste marco:

- Community
- Business
- Services
- Events
- Mobility
- Search
- Notifications
- Messaging
- AI

Observacao: alguns subdominios possuem SSOT forte e evidencias proprias, como Business Favorites, Gastronomy Consolidation, Notification Preferences e Community Direct Messaging. Isso nao equivale a Freeze do dominio pai.

## 5. Dominios que ainda dependem do Feed

Dependencia direta:

- Community: depende do Feed para timeline/postagens publicas, detalhe social e futuras interacoes de comentarios/reacoes/share.
- Mobility: depende do Feed para leitura e criacao social de `ride_share` ja migradas.
- Search: depende do Feed para resultados de posts com destino territorial seguro.
- Notifications: depende do Feed para eventos sociais e links de posts/comentarios/notificacoes futuras.

Dependencia indireta ou opcional:

- Messaging: depende do Feed quando a conversa e iniciada a partir de post da comunidade; outros agregados de messaging permanecem independentes.
- Events: pode depender do Feed para distribuicao social, comentarios/reacoes/share e notificacoes de posts relacionados, mas o core de eventos permanece independente.
- Business: pode depender do Feed para distribuicao social/promocao comunitaria, mas identidade, favoritos, reviews, gastronomia e anuncios nao dependem estruturalmente do Feed.
- Services: pode depender do Feed para divulgacao social e oportunidades relacionadas, mas cadastro/descoberta de profissionais nao devem depender estruturalmente do Feed.
- AI: dependencia futura possivel para resumo, recomendacao, ranking ou moderacao assistida; ainda sem contrato oficial.

Sem dependencia do Feed:

- Territory: Feed depende de Territory; Territory nao depende de Feed.

## 6. Diagrama textual de dependencias oficiais

Legenda: `A -> B` significa que A consome ou depende de B.

```text
Territory
  -> banco territorial oficial
  -> fontes oficiais e boundaries

Community
  -> Territory
  -> Profiles/Auth
  -> Community AccessPolicy
  -> Community entity links

Feed
  -> Territory
  -> Community AccessPolicy
  -> Rollout
  -> Posts
  -> Comments
  -> Engagement

Business
  -> Territory
  -> Profiles/Auth
  -> Reviews
  -> Favorites
  -> Promotions
  -> Community entity links

Services
  -> Territory
  -> Profiles/Auth
  -> Professional
  -> Search
  -> Community entity links

Events
  -> Territory
  -> Profiles/Auth
  -> Community entity links
  -> Notifications
  -> Search

Mobility
  -> Territory
  -> Profiles/Auth
  -> Routing/Geocoding
  -> Messaging/Realtime
  -> Notifications
  -> Feed, somente para camada social ride_share

Search
  -> Territory
  -> Community entity links
  -> Business
  -> Services/Professional
  -> Events
  -> Classifieds
  -> Work Opportunities
  -> Feed/Posts

Notifications
  -> Auth/User
  -> Profiles
  -> Feed
  -> Messaging
  -> Mobility
  -> Business
  -> Events

Messaging
  -> Profiles/Auth
  -> Community
  -> Feed/Posts, quando iniciado por post
  -> Classifieds, quando iniciado por classificado
  -> Mobility, quando chat de corrida
  -> Realtime
  -> Notifications
  -> Moderation/Privacy

AI
  -> Security/Governance
  -> Search
  -> Feed
  -> Messaging
  -> Notifications
  -> dados canonicos dos dominios owners
```

## 7. Regras consolidadas do projeto apos este marco

1. Territory permanece a fundacao obrigatoria para qualquer superficie publica territorial.
2. Feed e a porta publica obrigatoria para os fluxos sociais ja migrados.
3. Community nao substitui Territory; Community e o produto social ancorado em Territory.
4. Search nao e dono de entidade; Search compoe read models dos dominios donos.
5. Business, Services, Events, Mobility, Notifications e Messaging nao podem usar Feed como atalho para regras que pertencem aos seus proprios dominios.
6. Nenhum dominio deve consultar tabelas protegidas diretamente em UI quando houver service owner.
7. Nenhum dominio pode declarar Freeze apenas por existir SSOT tecnico.
8. Nenhum lancamento oficial de Territory pode ocorrer apenas por score; deve passar por gates, ausencia de blockers e aprovacao de governanca/produto.
9. Nenhuma feature publica social deve reintroduzir leitura global, fallback territorial silencioso ou cache visivel quando o contexto territorial falhar.
10. Proximas sprints devem preservar os boundaries de Territory e Feed STATUS: FROZEN.

## 8. Conclusao oficial

Project Milestone 1 consolida o estado arquitetural do projeto em duas camadas:

1. Fundacao territorial: Territory governa localizacao, resolucao, filtros, URL, boundaries, rollout territorial e qualidade territorial.
2. Fundacao social publica: Feed STATUS: FROZEN governa os fluxos sociais publicos congelados e exige ADR/DECISION para qualquer alteracao que nao preserve GOVERNANCE, SSOT, boundaries e contratos publicos.

O projeto ainda nao possui Freeze geral. O proximo avanco arquitetural deve continuar por sprints de dominio, sem misturar SSOT tecnico pontual com governanca macro.
