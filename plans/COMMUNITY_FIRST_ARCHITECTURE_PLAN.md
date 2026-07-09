# Community First Architecture Plan

Status: ativo
Data: 2026-07-08
Escopo: arquitetura-base versionada do produto
Implementacao: em andamento incremental

## Objetivo

Definir a arquitetura-base do Achegue-se para sustentar o modelo
Community First com entidades independentes, sem criar duplicacao de SSOT,
sem prender empresas/eventos/classificados/servicos dentro de uma comunidade
e sem transformar a home em um portal generico de cidade.

Este plano deve orientar as proximas implementacoes. Ele nao implementa
funcionalidades, nao cria migrations e nao altera runtime.

## Fontes Inspecionadas

- `plans/README.md`
- `docs/STATUS_ATUAL.md`
- `docs/governance/AUTHORITIES.md`
- `scripts/validate-project-taxonomy.ts`
- `scripts/validate-architecture-governance.ts`
- `scripts/lib/architecture-registry.ts`
- `src/config/moduleSlugs.ts`
- `src/config/launchScope.ts`
- `src/core/verticals/config.ts`
- `src/core/location/README.md`
- `src/core/territorial/README.md`
- `src/core/business/README.md`
- `src/core/professional/README.md`
- `src/core/community-experience/services/CommunityExperienceService.ts`
- `src/core/routing/config/territorialRoutePatterns.ts`
- `src/core/routing/utils/territoryUrls.ts`
- `src/core/routing/services/CommunityPublicAliasService.ts`
- `src/core/routing/services/TerritoryCommunityRouteService.ts`
- `src/core/routing/services/CommunityBusinessEntityResolver.ts`
- `src/core/business/services/BusinessUrlService.ts`
- `src/core/search/services/SearchService.ts`
- `src/app/routes/sections/AppLayoutRoutes.tsx`
- `src/app/routes/sections/CommunityTerritoryRoutes.tsx`
- `src/app/routes/territorial/TerritorialModulePages.tsx`
- `src/modules/README.md`
- `src/modules/business/gastronomy/README.md`
- `src/modules/community-feed/README.md`
- `src/modules/community-groups/README.md`
- `src/modules/community-events/README.md`
- `src/modules/community-issues/README.md`
- `src/modules/community-lost-found/README.md`
- Migrations principais de `locations`, `territory_communities`, `community`,
  `business`, `classifieds/professional`, `events/groups/issues`,
  `community_public_aliases` e governanca de grupos.

## Decisao Arquitetural Recomendada

O core domain do Achegue-se deve ser:

**Comunidade Local**

Comunidade Local e a entidade social do produto. Ela e ancorada em um
territorio, possui identidade publica, status, regras, membros, moderacao,
atividade e relacoes com entidades independentes.

O SSOT territorial continua sendo:

**`locations` + `territorial_groups`**

`locations` modela a arvore geografica oficial. `territorial_groups` modela
agrupamentos operacionais de bairros. Nenhum modulo deve criar territorio
paralelo por texto, slug solto ou bairro fake.

Empresas, eventos, classificados, servicos/profissionais, gastronomia, posts e
usuarios nao devem ser "filhos fisicos" da comunidade. Eles devem existir como
entidades canonicas independentes e aparecer em comunidades por territorio,
contexto ou vinculos explicitos.

## Modelo Mental Oficial

```text
Territorio SSOT
  locations
  territorial_groups

Comunidade Local
  territory_communities
  community_public_aliases
  future: community_memberships
  future: community_entity_links

Entidades independentes
  profiles/users
  business_data
  gastronomy_profiles + menu_* + orders
  professional_data
  classifieds
  events
  posts/community_posts
  tourist_points

Experiencias
  Home/descoberta
  Perfil de bairro
  Portal de comunidade
  Busca global
  Listagens territoriais
  Detalhes canonicos de entidade
```

## Entidades Principais Do Dominio

### Territorio

Entidades atuais:

- `locations`
- `location_aliases`
- `addresses`
- `territorial_groups`
- `territorial_group_members`
- `location_boundaries` quando disponivel

SSOT:

- `locations` para pais, estado, cidade, bairro/distrito e caminho geografico.
- `territorial_groups` para grupos territoriais que agregam locations.

Responsabilidade:

- resolver territorio;
- manter hierarquia geografica;
- prover `location_id`, `geographic_path` e membros ativos de grupo;
- nunca representar comunidade social.

Nao pertence a Territorio:

- membros da comunidade;
- regras da comunidade;
- feed, posts, eventos, empresas ou moderacao social;
- "bairro ativo" como experiencia social.

### Comunidade Local

Entidades atuais:

- `territory_communities`
- `community_public_aliases`
- `groups` e `group_members_new` para grupos sociais internos;
- `community_posts`, `community_alerts`, `community_issues`,
  `lost_found_posts` e outros subdominios comunitarios.

SSOT recomendado:

- `territory_communities` deve ser consolidada como a entidade canonica
  `LocalCommunity`.
- `community_public_aliases` deve continuar como SSOT de alias publico curto.

Responsabilidade:

- identidade publica da comunidade;
- status (`active`, `launching`, `waiting_list`, `coming_soon`, `inactive`);
- territorio ancorado (`city_id`, `territory_type`, `territory_id`);
- regras, moderacao, governanca, membros e atividade agregada;
- contexto para exibir empresas, eventos, classificados e servicos.

Nao pertence a Comunidade:

- dados mestres da empresa;
- dados mestres do evento;
- dados mestres do classificado;
- dados mestres do profissional;
- arvore geografica.

Gap atual:

- `territory_communities` existe, mas o conceito de comunidade ainda esta
  parcialmente espalhado entre routing, community-experience, modulos
  `community-*`, grupos sociais e territorio.
- Falta uma entidade explicita de membership da comunidade local. `groups` e
  `group_members_new` nao devem substituir membership da comunidade, pois
  grupos sao subcomunidades/interesses/chat.
- Falta uma tabela/contrato explicito para vincular entidades independentes a
  comunidades.

### Usuarios E Perfis

Entidades atuais:

- `auth.users`
- `profiles`
- `profile_members`
- `user_roles`
- `user_active_profiles`
- `user_residences`
- `profile_username_history`
- `profile_slug_history`

SSOT:

- `auth.users` para autenticacao.
- `profiles` para identidade operacional e publica.
- `user_active_profiles` para perfil ativo.
- `user_residences` para residencia territorial verificada.

Responsabilidade:

- identidade;
- papeis e permissoes;
- perfil ativo;
- residencia e relacao com territorio;
- reputacao e verificacao.

Risco atual:

- usuarios podem ter varias relacoes territoriais, mas membership de comunidade
  local ainda nao esta separada de residencia, grupos sociais ou follows.

### Empresas

Entidades atuais:

- `business_data`
- `business_gallery`
- `business_hours`
- `business_hours_exceptions`
- `business_operation_config`
- `business_claims`
- `business_products`
- `business_services`
- `business_favorites`
- `business_premium_links`
- `reviews`

SSOT:

- `business_data` para identidade de negocio.
- `BusinessService` para dados.
- `BusinessUrlService` para URLs publicas.

Responsabilidade:

- identidade e cadastro da empresa;
- categoria/subcategoria;
- owner via `profile_id`;
- `location_id` principal;
- `address_id` quando houver endereco fisico;
- URLs canonicas independentes da comunidade.

Regra:

- empresa deve existir de forma independente.
- comunidade nao deve duplicar empresa.
- comunidade deve referenciar empresa por vinculo ou por territorio resolvido.

Risco atual:

- `BusinessUrlService` resolve contexto comunitario por alias/territorio, mas
  ainda depende de inferencia por location/group. Para escala, empresas que
  atuam em varias comunidades precisam de vinculo explicito, nao apenas
  `location_id`.

### Gastronomia

Entidades atuais:

- `gastronomy_profiles`
- `menus`
- `menu_categories`
- `menu_items`
- `menu_item_variants`
- `menu_item_addons`
- `menu_item_availability`
- `menu_promotions`
- `orders`
- `order_items`
- `order_timeline_events`
- `delivery_occurrences`

SSOT:

- `business_data` continua SSOT da empresa/restaurante.
- `gastronomy_profiles` e tabelas `menu_*` sao extensoes verticais 1:1/1:N da
  empresa.
- `MenuService`, `GastronomyProfileService`, `OrderService` e
  `GastronomyCheckoutService` concentram operacao.

Responsabilidade:

- cardapio;
- checkout;
- pedidos;
- disponibilidade;
- vertical gastronomico da empresa.

Nao pertence a Gastronomia:

- identidade base da empresa;
- membership de comunidade;
- ranking geral de comunidades.

Risco atual:

- `src/core/verticals/config.ts` declara `gastronomy` e `education` como
  verticais oficiais, enquanto `src/modules/README.md` ainda afirma que apenas
  `gastronomy` e vertical oficial. Isso deve ser reconciliado antes de novas
  verticais.

### Servicos E Profissionais

Entidades atuais:

- `professional_data`
- `professional_stats`
- `professional_favorites`
- `professional_jobs`
- `professional_leads`
- `professional_lead_events`
- `professional_lead_messages`
- `professional_lead_quotes`
- `professional_service_engagements`
- `professional_profile_media`

SSOT:

- `professional_data` para perfil profissional.
- `ProfessionalService` e `ProfessionalUrlService` para dados e URL.

Responsabilidade:

- identidade profissional;
- areas de atendimento;
- leads e propostas;
- engajamentos;
- reputacao profissional.

Regra:

- servico/profissional existe independente da comunidade.
- comunidade mostra servicos por territorio, coverage ou vinculo explicito.

Risco atual:

- a nomenclatura `services`, `professional`, `professionals/services` e
  `business_services` pode induzir duplicacao. O plano deve manter:
  `business_services` = servicos oferecidos por empresa;
  `professional_data` = profissionais/prestadores;
  `professionals/services` = experiencia do produto para servicos
  profissionais.

### Classificados E Vagas

Entidades atuais:

- `classifieds`
- `classified_likes`
- `classified_comments`
- `classified_favorites`
- `classified_reports`
- `vagas`
- `vaga_saved_items`
- `professional_jobs`
- `work-opportunities`

SSOT recomendado:

- `classifieds` para classificados gerais.
- `vagas` para vagas estruturadas/recrutamento formal, mantendo ownership em
  `src/modules/classifieds/jobs` enquanto nao existir um `core/jobs` dedicado.
- `work_opportunities` para oportunidades rapidas e circulacao profissional
  local, com ownership em `src/core/work-opportunities` e
  `src/modules/work-opportunities`.

Responsabilidade:

- anuncios;
- compra/venda;
- favoritos/comentarios/reportes;
- vagas estruturadas como subdominio de classificados/recrutamento;
- oportunidades rapidas como dominio proprio de circulacao profissional local.

Risco atual:

- `classifieds`, `vagas` e `work-opportunities` parecem proximos, mas nao
  devem ser fundidos sem perda de semantica: classificados gerais vendem itens,
  `vagas` publica recrutamento estruturado, e `work_opportunities` publica
  demandas/ofertas rapidas. A integracao entre eles deve ocorrer por busca,
  Home e links comunitarios, nao por copia de dados mestres.

### Eventos

Entidades atuais:

- `events`
- `event_participants`
- `event_reviews`
- `event_review_helpfulness`
- `event_reminders`
- `event_favorites`

SSOT recomendado:

- `events` para evento canonico.
- `src/core/verticals/events` para leitura e mutacoes canonicas, pois
  `src/core/events` e bloqueado pelo SSOT de core como pasta legada.
- Join, leave e check-in usam RPCs atomicas dedicadas via `event-rpc`.

Responsabilidade:

- dados do evento;
- organizador;
- datas;
- local/territorio;
- participantes;
- favoritos, lembretes e reviews.

Regra:

- evento deve ter URL canonica e SEO proprio.
- comunidade pode destacar evento por territorio ou vinculo.

Risco atual:

- eventos aparecem como tabela e modulo comunitario, mas nao ha uma fronteira
  de dominio tao clara quanto business/classifieds/professional. Reativar
  eventos sem contrato canonico aumenta risco de logica espalhada em paginas.

Evidencia parcial:

- `src/core/verticals/events` centraliza leitura publica de `events` via
  `EventReadService`;
- `CommunityEventsRuntimeService` delega listagem, detalhe, paginacao, mapa,
  recentes e contagens ao `core/verticals/events`;
- `EventMutationService` centraliza criacao, atualizacao, remocao,
  participacao e check-in de eventos, mantendo `CommunityEventsRuntimeService`
  como fachada de compatibilidade.
- `event-rpc` chama `join_event_participation`, `leave_event_participation`,
  `check_in_event_participation` e `check_in_event_participation_by_code`,
  evitando insert/delete no cliente seguido de contador separado.

### Posts, Feed E Interacoes Sociais

Entidades atuais:

- `posts`
- `community_posts`
- `comments`
- `post_likes_new`
- `saved_posts_new`
- `community_polls`
- `community_poll_options`
- `user_follows`

SSOT recomendado:

- escolher e formalizar a tabela canonica de publicacao social. Hoje existem
  `posts` e `community_posts`.

Responsabilidade:

- conteudo social;
- comentarios;
- reacoes;
- enquetes;
- salvamentos;
- moderacao de conteudo.

Risco atual:

- `posts` e `community_posts` podem virar duas fontes concorrentes. O plano de
  migracao deve decidir se `community_posts` e uma especializacao real ou se
  deve ser absorvida por `posts` com tipo/canal.

### Busca Global

Entidade atual:

- `SearchService`

SSOT recomendado:

- `core/search` deve ser o orquestrador de busca.
- Para escala, criar um indice denormalizado ou RPC de busca federada por
  dominio, territorio e comunidade.

Responsabilidade:

- consulta federada;
- ranking;
- filtros por territorio;
- resultado por tipo;
- sugestoes e historico local de UI.

Risco atual:

- a primeira busca federada ja consulta communities, businesses,
  professionals, opportunities, classifieds, events e posts publicos por
  services/read models canonicos;
- a Home ja consome descoberta por contrato via `HomeDiscoveryService`, mas a
  busca ainda nao possui indice denormalizado/RPC nem filtro explicito por
  comunidade usando `community_entity_links`.

### Home E Descoberta

Entidade atual:

- nao deve ser entidade de dominio.
- deve viver em `src/app/features/landing` ou camada app equivalente.

Responsabilidade:

- entrada no ecossistema;
- descoberta;
- comunidades em destaque;
- conteudo popular;
- cards de entidades canonicas;
- CTA para comunidades, busca e modulos.

Nao pertence a Home:

- regras de negocio;
- montagem manual de URLs;
- query direta ao Supabase;
- ownership de dados.

## Relacionamentos Recomendados

### Relacionamentos existentes que devem permanecer

```text
locations 1:N locations
locations 1:N addresses
locations 1:N business_data
locations 1:N professional_data
locations 1:N classifieds
locations 1:N events
locations 1:N posts/community_posts
territorial_groups N:N locations
territory_communities N:1 locations(city_id)
territory_communities -> territory_id por territory_type
business_data 1:1 profiles
gastronomy_profiles N:1 business_data
menus N:1 gastronomy_profiles/business
orders N:1 business/restaurante
profiles N:1 auth.users
user_residences N:1 locations
```

### Relacionamentos que faltam para Community First escalar

#### `community_memberships`

Necessario para separar residencia, grupo social e participacao comunitaria.

Campos conceituais:

```text
id
community_id -> territory_communities.id
profile_id -> profiles.id
role: owner | admin | moderator | member
status: active | pending | banned | left
joined_at
verified_by_residence: boolean
metadata
```

#### `community_entity_links`

Necessario para evitar duplicar empresas/eventos/classificados/servicos dentro
das comunidades.

Campos conceituais:

```text
id
community_id -> territory_communities.id
entity_type: business | event | classified | professional | post | tourist_point
entity_id
link_type: primary_territory | serves_area | featured | sponsored | member_submitted | official
status: active | pending | rejected | hidden | expired
created_by_profile_id
approved_by_profile_id
approved_at
starts_at
ends_at
priority
created_at
updated_at
metadata
```

Regras:

- entidade canonica continua no dominio original;
- link apenas declara relacao com comunidade;
- link nao copia dados mestres;
- link pode ter ranking, destaque e moderacao local;
- `entity_type + entity_id` e validado por trigger privado contra a tabela
  canonica e seu estado publico atual;
- acesso direto no app pertence somente a `CommunityEntityLinkRepository`.

#### `community_activity_events`

Opcional, mas recomendado para Home/Feed em escala.

Campos conceituais:

```text
id
community_id
actor_profile_id
verb
entity_type
entity_id
visibility
created_at
metadata
```

Responsabilidade:

- alimentar feed e widgets de descoberta sem fazer joins caros em todas as
  telas.

## Estrutura Tecnica Recomendada

### `src/core`

Deve conter contratos canonicos, services, repositories, policies e utilitarios
de dominio usados por mais de uma experiencia.

Estrutura conceitual recomendada:

```text
src/core/
  location/                 # SSOT geografico atual: locations
  territorial/              # grupos territoriais
  community-experience/     # LocalCommunity/territory_communities
  community/                # posts, feed, grupos sociais, subdominios sociais
  business/                 # business_data, URLs, ownership, base de empresas
  verticals/                # registry de verticais de business
  classifieds/              # classificados e marketplace local
  professional/             # profissionais/servicos
  verticals/events/         # contrato canonico de eventos dentro da taxonomia atual
  search/                   # busca federada/indexada
  routing/                  # URL/routing; nao deve possuir dados de comunidade
  profiles/                 # identidade de perfil
  auth/authorization/       # auth e permissoes
  governance/               # contratos de governanca
```

Observacao:

- Nao e obrigatorio renomear `location` para `territory` agora. O SSOT atual
  esta em `core/location` e deve ser preservado para evitar churn. A
  consolidacao deve ser conceitual primeiro, com facades se necessario.

### `src/modules`

Deve conter bounded contexts de produto e UI de dominio. Nao deve conter SSOT
de entidade compartilhada.

Estrutura recomendada:

```text
src/modules/
  business/
    company/
    gastronomy/
    education/
    promotions/
  classifieds/
    jobs/
  professionals/
    services/
  community-feed/
  community-groups/
  community-alerts/
  community-issues/
  community-lost-found/
  community-events/
  community-recommendations/
  guide/
  mobility/
  profile/
  admin/
  central/
```

Decisao:

- Manter a taxonomia atual ate haver plano especifico de reorganizacao.
- Corrigir documentacao/registry onde houver divergencia com
  `src/core/verticals/config.ts`.

### `src/app`

Deve compor rotas, layouts e experiencias transversais.

Responsabilidade:

- Home/landing;
- onboarding;
- shells;
- roteamento;
- composicao de paginas.

Nao deve conter:

- query direta ao Supabase para dominio;
- regra de negocio;
- montagem manual de URL de entidade;
- ownership de SSOT.

## Backend, Banco, Edge Functions E Interface

### Banco/Supabase

Responsabilidades:

- RLS;
- FK e constraints;
- tabelas canonicas;
- indices por territorio/comunidade/status;
- funcoes RPC para mutacoes sensiveis;
- validacao de membership, residencia e autorizacao;
- triggers somente quando forem regra de integridade, nao logica de UI.

### Edge Functions/RPCs

Responsabilidades:

- mutacoes privilegiadas;
- operacoes com `service_role`;
- agregacoes sensiveis;
- workflows de billing, pedidos, notificacoes e moderacao;
- validacao de permissoes que nao pode ficar no cliente.

### Frontend

Responsabilidades:

- renderizacao;
- estados de UI;
- filtros;
- navegacao;
- cache client-side;
- optimistic UI somente quando rollback for seguro;
- consumo de facades canonicas.

Nao permitido:

- cliente decidir autorizacao real;
- cliente montar payload privilegiado sem RPC/Edge validation;
- cliente duplicar regra de dominio ja existente no backend;
- componente acessar Supabase diretamente fora das fronteiras aprovadas.

## Duplicacoes E Ambiguidades Encontradas

### 1. Comunidade Local vs grupo territorial vs grupo social

Problema:

- `territorial_groups` representa agrupamento geografico.
- `territory_communities` representa experiencia comunitaria territorial.
- `groups` representa grupos sociais internos.

Risco:

- usar "grupo" ou "comunidade" como sinonimos em codigo cria bugs de
  autorizacao, URLs e feed.

Decisao recomendada:

- `territorial_groups`: territorio composto.
- `territory_communities`: comunidade local canonica.
- `groups`: subcomunidades/interesses/chat dentro ou ao redor da comunidade.

### 2. `posts` vs `community_posts`

Problema:

- ha duas tabelas de posts sociais com sobreposicao.

Risco:

- feed duplicado, likes/comentarios inconsistentes, moderacao incompleta.

Decisao recomendada:

- escolher uma tabela canonica antes de ampliar feed.
- se `community_posts` permanecer, documentar como especializacao e criar
  adapter unico de leitura/escrita.

### 3. Eventos sem dominio core claro

Problema:

- `events` existe no banco e ha modulos comunitarios, mas ainda faltava um
  contrato canonico equivalente aos read models consolidados de outros
  dominios.

Risco:

- reativar eventos com regras espalhadas em paginas e rotas.

Decisao recomendada:

- criar contrato canonico de eventos antes de reabrir eventos publicos.

### 4. Busca global incompleta

Status:

- parcialmente resolvido na Fase 5 em 2026-07-08.

Problema:

- `SearchService` declarava categorias que ainda nao buscava de fato.

Risco:

- Home e Comunidades prometem descoberta ampla, mas entregam apenas parte do
  ecossistema.

Decisao recomendada:

- manter a busca federada por dominio como contrato inicial e criar indice
  denormalizado/RPC apenas quando volume, ranking e latencia justificarem.

### 5. Taxonomia de verticais divergente

Status:

- resolvido na Fase 1 em 2026-07-08.

Problema original:

- `src/modules/README.md` declarava apenas `gastronomy` como vertical oficial.
- `src/core/verticals/config.ts` ja declarava `gastronomy` e `education`.

Risco:

- futuras IAs/desenvolvedores podem criar modulo ou pasta no lugar errado.

Decisao aplicada:

- `src/modules/README.md`, `docs/architecture/TAXONOMY_SSOT.md` e
  `scripts/validate-project-taxonomy.ts` agora usam
  `src/core/verticals/config.ts` como SSOT de verticais.

### 6. Inferencia comunitaria por territorio no lugar de vinculo explicito

Problema:

- empresas e outras entidades aparecem em comunidade principalmente por
  `location_id`, grupo territorial ou alias.

Risco:

- empresa que atende varias comunidades, evento regional, classificado com raio
  maior ou patrocinio local ficam dificeis de modelar sem duplicacao.

Decisao recomendada:

- introduzir `community_entity_links` quando a experiencia community-first for
  expandida alem do MVP.

### 7. Roteamento central crescendo demais

Problema:

- `AppLayoutRoutes.tsx` concentra muitas rotas, guards e padroes de launch.

Risco:

- novas superficies aumentam chance de ordem de rota errada, tela pausada
  tardia e regressao territorial.

Decisao recomendada:

- manter no curto prazo por estabilidade, mas extrair registros declarativos
  por dominio conforme novos modulos forem ativados.

## Regras Para Novos Modulos

1. Nenhum novo modulo cria territorio proprio.
2. Nenhum novo modulo duplica entidade canonica existente.
3. Entidade independente deve ter:
   - tabela/SSOT claro;
   - service canonico em `core`;
   - URL policy;
   - ownership de permissao;
   - estrategia de comunidade por link, nao por copia.
4. Funcionalidade dentro de comunidade deve declarar se e:
   - entidade canonica independente;
   - vinculo comunitario;
   - apenas widget/apresentacao.
5. Toda rota publica nova deve declarar:
   - canonical;
   - index/noindex;
   - surface de launch;
   - dependencia territorial;
   - teste E2E minimo.
6. Toda mutacao sensivel deve passar por service/RPC/Edge Function e RLS.
7. Search/Home nao podem consultar tabelas soltas; devem consumir contratos de
   dominio ou indice oficial.

## Plano De Implementacao Incremental

### Fase 0 - Congelar Decisao Arquitetural

Status: concluida em 2026-07-08

Objetivo:

- aprovar este plano como referencia operacional.

Tarefas:

- revisar o plano com foco em dominio, nao UI;
- confirmar nomes oficiais: Comunidade Local, Territorio, Entidade Canonica,
  Vinculo Comunitario;
- decidir se `territory_communities` sera formalmente renomeada apenas no
  dominio TypeScript para `LocalCommunity` ou tambem no banco em uma fase
  futura.

Criterio de pronto:

- plano aceito;
- nenhuma nova funcionalidade community-first implementada fora dessas regras.

### Fase 1 - Registrar Arquitetura Como Contrato Leve

Status: concluida em 2026-07-08

Objetivo:

- tornar a decisao encontravel e verificavel sem criar uma Authority vazia.

Tarefas:

- [x] criar/atualizar doc canonico em `docs/architecture` ou `docs/governance`
  apontando para este plano;
- [x] atualizar `plans/README.md`;
- [x] alinhar `src/modules/README.md` com `src/core/verticals/config.ts`;
- [x] atualizar `scripts/lib/architecture-registry.ts` para refletir
  `community-experience` como SSOT de Comunidade Local;
- [x] adicionar teste/validator pequeno apenas para impedir regressao de taxonomia.

Criterio de pronto:

- docs e validators concordam sobre core domain, territorio e verticais.

Evidencia:

- `docs/architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md` criado como
  contrato arquitetural vivo;
- `scripts/validate-project-taxonomy.ts` agora valida Community First,
  `community-experience`, modulos canonicos e verticais declaradas no SSOT de
  `src/core/verticals/config.ts`;
- `scripts/lib/architecture-registry.ts` registra `community-experience` como
  dominio arquitetural critico.

### Fase 2 - Consolidar Comunidade Local No Core

Status: concluida para contrato backend em 2026-07-08

Objetivo:

- reduzir acesso direto a `territory_communities` espalhado.

Tarefas:

- [x] promover `CommunityExperienceService` ou novo facade equivalente a SSOT de
  leitura de `territory_communities`;
- [x] mover resolucoes de `territory_communities` hoje em routing para repositorio
  ou service canonico;
- [x] manter `core/routing` responsavel por paths, nao por ownership dos dados;
- [x] documentar `territory_communities` como LocalCommunity.

Criterio de pronto:

- `territory_communities` acessada por service/repository canonico;
- routing consome contrato de comunidade, nao tabela direta;
- testes de alias e rotas continuam passando.

Evidencia:

- `src/core/community-experience/repositories/CommunityExperienceRepository.ts`
  criado como owner unico de leitura direta de `territory_communities` e
  `community_public_aliases` no app;
- `CommunityPublicAliasService`, `TerritoryCommunityRouteService` e
  `education.queries.ts` passaram a consumir `CommunityExperienceService`;
- `scripts/validate-project-taxonomy.ts` bloqueia acesso direto a essas tabelas
  fora do repositorio canonico em codigo de producao.

### Fase 3 - Definir Membership Da Comunidade

Status: concluida para contrato backend/RLS e gate de UI em 2026-07-08

Objetivo:

- separar residencia, perfil ativo, grupo social e participacao comunitaria.

Tarefas:

- [x] desenhar migration `community_memberships`;
- [x] definir regras de join: aberto, approval, invite, residencia verificada;
- [x] definir papeis: owner/admin/moderator/member;
- [x] definir RLS de entrada/saida/moderacao;
- [x] evitar RPC publica direta nesta etapa; a superficie mutante futura deve
  passar por broker/Edge Function antes de UI publica;
- [x] atualizar UI somente depois de backend/RLS prontos.

Criterio de pronto:

- membership existe como SSOT;
- interacoes restritas usam membership;
- conteudo publico continua indexavel quando permitido.

Evidencia:

- `supabase/migrations/20260708215101_create_community_memberships_ssot.sql`
  cria `community_memberships` com RLS, grants explicitos, policies e helper
  privado de gestao;
- `CommunityMembershipRepository` e `CommunityMembershipService` sao a fronteira
  canonica do app;
- `validate-project-taxonomy` e `check:ssot` bloqueiam acesso paralelo a
  `community_memberships`.
- `useCommunityAccess` consome `CommunityExperienceService` e
  `CommunityMembershipService` para resolver membership da comunidade persistida
  da rota;
- `CommunityPortalGate` permite solicitar entrada, mostra estados pending,
  rejected e blocked, e nao libera interacoes por residencia isolada quando
  existe `community_memberships`;
- acoes sociais usam membership ativa; alertas/problemas e acoes sensiveis
  continuam exigindo residencia verificada quando aplicavel.

### Fase 4 - Criar Vinculos Comunitarios De Entidades

Status: em andamento

Objetivo:

- permitir que entidades independentes aparecam em uma ou varias comunidades
  sem duplicacao.

Tarefas:

- [x] desenhar `community_entity_links`;
- [x] definir tipos de link e status;
- [x] criar contrato backend/RLS e fachada canonica em `community-experience`;
- [x] criar services por dominio para expor elegibilidade especifica;
- [x] adaptar Home/Comunidade a consumir links quando existirem para
  empresas, profissionais/servicos e classificados;
- [x] manter fallback por territorio durante migracao;
- [x] ampliar consumo para gastronomia dedicada na landing territorial;
- [x] ampliar consumo para eventos e busca global.

Criterio de pronto:

- empresa/evento/classificado/profissional pode aparecer em varias comunidades;
- dados mestres continuam no dominio original;
- moderacao local atua no link, nao na entidade canonica.

Evidencia parcial:

- `supabase/migrations/20260708224334_create_community_entity_links_ssot.sql`
  cria `community_entity_links` com RLS, grants explicitos, policies, helper
  privado de moderacao e trigger privado de validacao;
- `CommunityEntityLinkRepository` e `CommunityEntityLinkService` sao a fronteira
  canonica do app;
- `LandingFeaturedService.getCommunityFeaturedBusinesses`,
  `getCommunityFeaturedServices`, `getCommunityFeaturedGastronomyBusinesses`
  e `getCommunityFeaturedClassifieds` preferem links ativos da comunidade e
  caem para o filtro territorial quando nao ha vinculos;
- Gastronomia dedicada usa `getGastronomyBusinesses`/
  `getGastronomyBusinessesByIds` e exige `gastronomy_profiles` ativo, sem
  heuristica local por texto de categoria na landing territorial;
- `useLandingFeatured`, `TerritorialLandingPage` e `CommunityRightSidebar`
  consomem `community_entity_links` indiretamente por service, sem Supabase
  direto fora do SSOT;
- `CidadeLandingPage`, `NeighborhoodTerritoryHero` e `ProblemasPage` deixam de
  importar `@/core/community/*` diretamente e passam por fachadas explicitas em
  `community-feed` e `community-experience`, preservando o validador de
  fronteira transversal;
- `SearchService` consome `CommunityEntityLinkService` para restringir busca
  em contexto de comunidade por links ativos de businesses, professionals,
  classifieds, events e posts, mantendo fallback territorial quando o tipo nao
  possui vinculos migrados;
- `CommunityEntityLinkEligibilityService` valida a entidade antes de gravar
  pedidos de link comunitario, delegando a regra publica ao dominio dono:
  empresa ativa por `business_data.id`, profissional `public_listed` aceitando
  clientes, classificado ativo, evento `upcoming`/`ongoing`, post publicado e
  visivel, e ponto turistico `published`;
- `CommunityEntityLinkService.requestCommunityLink` nao chama o repositorio
  quando a entidade nao e publicamente elegivel, mantendo a UI fora da decisao
  de integridade;
- `validate-project-taxonomy` e `check:ssot` bloqueiam acesso paralelo a
  `community_entity_links`.

### Fase 5 - Busca Global E Descoberta

Status: em andamento, contrato de busca/Home discovery e filtro comunitario concluido em 2026-07-09

Objetivo:

- transformar busca em contrato real de produto.

Tarefas:

- [x] definir `SearchDocument` canonico;
- [x] incluir businesses, professionals, opportunities, classifieds, events,
  communities e posts publicos;
- [x] adicionar filtros por territorio e tipo;
- [x] adicionar filtro explicito por comunidade quando a busca consumir
  `community_entity_links`;
- [x] decidir por busca federada via services/read models como contrato
  inicial;
- [ ] criar indice denormalizado/RPC de busca quando escala e ranking exigirem;
- [x] atualizar Home para consumir busca/descoberta por contrato.

Criterio de pronto:

- busca global encontra todos os dominios prometidos;
- Home nao tem query manual de dominio;
- resultados respeitam launch scope, privacidade e SEO.

Evidencia parcial:

- `src/core/search/services/SearchService.ts` expoe `SearchDocument` e
  federa leitura por `CommunityExperienceService`, `BusinessService`,
  `ProfessionalService`, `WorkOpportunitiesService`, `ClassifiedService`,
  `EventReadService` e `PostService`;
- `SearchFilters.communityId` ativa filtro por links comunitarios sem expor
  `community_entity_links` para UI; empresas, profissionais, classificados,
  eventos e posts sao recortados pelos links ativos, enquanto oportunidades
  seguem somente por territorio ate haver contrato canonico de vinculo;
- `src/core/search/config/searchConfig.ts` centraliza limites de resultado,
  candidatos comunitarios e leitura de links;
- `src/core/community-experience/repositories/CommunityExperienceRepository.ts`
  expoe `searchPublicCommunities` como leitura canonica de comunidades
  publicas;
- `src/core/classifieds/services/classifieds.queries.ts` expoe
  `searchClassifieds` com `TerritoryFilter` canonico;
- `src/core/posts/services/posts.queries.ts` expoe `searchPublicPosts` para
  conteudo publico publicado e nao removido;
- `src/app/pages/BuscaPage.tsx` renderiza filtros de comunidades, eventos,
  classificados, oportunidades e posts a partir do contrato `SearchDocument`;
- `src/core/search/services/SearchDocumentMapper.ts` centraliza a conversao de
  entidades canonicas para `SearchDocument`, evitando mapeadores duplicados na
  busca e na Home;
- `src/core/landing/services/HomeDiscoveryService.ts` compoe blocos de
  atividade e confianca da Home consumindo services canonicos de landing,
  eventos, oportunidades e classificados, sem query direta em componente;
- `src/app/pages/MainLandingPage.tsx` consome `HomeDiscoveryService` via React
  Query e removeu listas estaticas de atividades/ranking;
- `src/core/search/services/__tests__/SearchService.spec.ts` cobre query curta,
  federacao multi-dominio, filtro por categoria e filtro por comunidade via
  `community_entity_links`;
- `src/core/landing/services/__tests__/HomeDiscoveryService.spec.ts` cobre
  composicao multi-dominio, ordenacao dos destaques e tolerancia a falha
  parcial de um dominio.

### Fase 6 - Eventos E Oportunidades

Status: em andamento

Objetivo:

- reativar modulos pausados apenas com dominio canonico claro.

Tarefas:

- [x] criar/confirmar `core/verticals/events` para leitura publica;
- [x] consolidar fronteira TypeScript de escrita, participacao e check-in em
  `EventMutationService`;
- [x] criar RPCs atomicas dedicadas para join/leave/check-in e contador de
  participantes antes de escala publica ampla;
- [x] revisar/remover helpers legados `increment_event_participants` e
  `decrement_event_participants` apos deploy de `community-rpc`/`event-rpc`;
- [x] definir se `vagas` permanece em `classifieds/jobs` ou vira oportunidades
  canonicas;
- [x] atualizar route registry e launch gates;
- criar testes E2E antes de reabrir superficies.

Criterio de pronto:

- eventos e oportunidades possuem SSOT, URLs, RLS e testes;
- comunidade apenas exibe/vincula, nao duplica.

Evidencia parcial:

- `supabase/functions/community-rpc` e `supabase/functions/event-rpc` foram
  publicados no remoto antes da remocao dos helpers legados;
- `supabase/migrations/20260709011223_drop_legacy_event_counter_rpcs.sql`
  remove `increment_event_participants` e `decrement_event_participants` para
  impedir retorno ao contrato antigo de contador nao atomico.
- `vagas` permanece como recrutamento estruturado em
  `src/modules/classifieds/jobs`, enquanto `work_opportunities` permanece como
  dominio canonico de oportunidades rapidas em `src/core/work-opportunities`;
  eles compartilham a launch surface `jobs`, mas nao sao o mesmo aggregate.
- `src/app/routes/lazyImports.ts` carrega as paginas reais de `vagas` e
  `oportunidades`; `src/app/routes/sections/AppLayoutRoutes.tsx`,
  `src/app/routes/sections/CommunityTerritoryRoutes.tsx` e
  `src/config/launchScope.ts` continuam mantendo todas as superficies publicas
  sob o gate `jobs`.
- `src/app/routes/__tests__/jobsLaunchScope.spec.ts` impede regressao para
  stubs duplicados e confirma que a liberacao publica depende do gate unico.

### Fase 7 - Limpeza De Duplicacoes

Status: pendente

Objetivo:

- remover ambiguidades sem quebrar o produto.

Tarefas:

- decidir `posts` vs `community_posts`;
- reduzir facades duplicadas entre `src/core` e `src/modules`;
- revisar `AppLayoutRoutes.tsx` e extrair registros declarativos por dominio;
- arquivar docs antigos que contradizem o modelo novo;
- adicionar validadores para impedir retorno das duplicacoes.

Criterio de pronto:

- nao ha duas fontes de verdade para a mesma entidade;
- validators passam;
- rotas publicas e E2E continuam verdes.

## Ordem De Prioridade

1. Fase 0 e Fase 1: alinhar contrato e docs.
2. Fase 2: consolidar leitura da Comunidade Local.
3. Fase 3: membership antes de interacoes fechadas.
4. Fase 4: links comunitarios antes de monetizacao community-first ampla.
5. Fase 5: busca/descoberta para sustentar Home.
6. Fase 6: reabrir eventos/oportunidades com SSOT.
7. Fase 7: limpar duplicacoes residuais.

## Definicao De Pronto Do Plano Completo

O plano so deve ser considerado 100% implementado quando:

- Comunidade Local estiver formalmente documentada como core domain.
- `territory_communities` tiver service/repository canonico unico.
- Membership de comunidade estiver separada de residencia e grupos sociais.
- Entidades independentes estiverem ligadas a comunidades sem duplicacao.
- Home e Busca consumirem contratos de dominio, nao queries soltas.
- Eventos e oportunidades tiverem SSOT antes de reativacao publica.
- Docs, validators, tests e rotas concordarem sobre a taxonomia.
- Nenhum novo modulo depender de redirect para corrigir arquitetura.
- `npm run validate:architecture:governance`,
  `npm run validate:taxonomy`, `npm run security:validate`,
  `npm run validate:phase:core` e `npm run verify:deploy` passarem apos as
  fases implementadas.

## Respostas Arquiteturais Fechadas

### Qual e o core domain?

Comunidade Local.

### Qual e o SSOT territorial?

`locations` para geografia oficial e `territorial_groups` para agrupamentos
territoriais.

### Quais entidades devem existir de forma independente?

- `profiles/users`
- `business_data`
- `gastronomy_profiles`, `menus`, `orders`
- `professional_data`
- `classifieds`
- `events`
- `posts/community_posts` apos decisao de canonico
- `tourist_points`

### Quais entidades devem ser vinculos/contextos dentro de comunidades?

- destaque/patrocinio de empresa na comunidade;
- evento destacado em comunidade;
- classificado visivel em comunidade;
- profissional recomendado pela comunidade;
- post distribuido para uma comunidade;
- ranking local;
- moderacao local sobre exibicao.

### Arquitetura-base oficial recomendada

Community First com entidades independentes:

```text
Location/territory e o SSOT geografico.
LocalCommunity e o core domain social.
Business/Event/Classified/Professional/Gastronomy sao entidades canonicas.
CommunityEntityLink liga entidades canonicas a comunidades.
Search/Home sao experiencias derivadas desses contratos.
```

## Fora De Escopo Deste Plano

- criar migrations;
- renomear tabelas;
- reorganizar pastas;
- reativar modulos pausados;
- alterar UX da Home;
- alterar rotas publicas;
- mudar RLS;
- implementar indice denormalizado/RPC de busca.
