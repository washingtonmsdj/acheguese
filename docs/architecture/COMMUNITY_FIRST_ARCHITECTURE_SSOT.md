# Community First Architecture SSOT

Data de referencia: 2026-07-09

Este documento e o contrato arquitetural vivo para a arquitetura Community
First do Achegue-se. O plano detalhado de implementacao incremental permanece
em `plans/COMMUNITY_FIRST_ARCHITECTURE_PLAN.md`.

## Decisao Oficial

O core domain do Achegue-se e:

**Comunidade Local**

Comunidade Local e a entidade social ancorada em um territorio canonico. Ela
organiza descoberta, contexto, pertencimento, interacoes e distribuicao local
de entidades independentes, como empresas, gastronomia, servicos,
classificados, eventos e conteudo.

## SSOTs Canonicos

### Territorio

SSOT:

- `locations`
- `territorial_groups`
- `src/core/location`
- `src/core/territorial`

Responsabilidade:

- representar pais, estado, cidade, bairro, distrito e grupos territoriais;
- resolver escopo geografico;
- servir como base para filtros, URLs territoriais e residencia.

Territorio nao e comunidade. Territorio e a base geografica; Comunidade Local
e o produto social construido sobre essa base.

### Comunidade Local

SSOT atual:

- `territory_communities`
- `community_public_aliases`
- `community_memberships`
- `community_entity_links`
- `src/core/community-experience`
- `src/core/community-experience/repositories/CommunityExperienceRepository.ts`
- `src/core/community-experience/repositories/CommunityMembershipRepository.ts`
- `src/core/community-experience/repositories/CommunityEntityLinkRepository.ts`

Responsabilidade:

- representar a comunidade local routeavel e exibivel;
- resolver perfil publico, status de lancamento, copy, alias e metadados de
  experiencia;
- expor a fachada canonica para leitura da comunidade local.

`src/core/community-experience/repositories/CommunityExperienceRepository.ts`
e o unico owner de leitura direta de `territory_communities` e
`community_public_aliases` no app. `CommunityExperienceService` e a fachada
canonica consumida por routing e modulos.

`src/core/community-experience/repositories/CommunityMembershipRepository.ts`
e o unico owner de acesso direto a `community_memberships` no app. Membership
representa participacao na Comunidade Local; nao substitui residencia,
perfil ativo, grupo social ou roles globais.

`src/core/community-experience/repositories/CommunityEntityLinkRepository.ts`
e o unico owner de acesso direto a `community_entity_links` no app. Esse
contrato vincula entidades canonicas a uma ou mais comunidades sem copiar dados
mestres. Moderacao, destaque e ranking local pertencem ao link; identidade,
status publico e conteudo principal continuam no dominio original.

`CommunityEntityLinkEligibilityService` e o gate canonico antes de solicitar
novo vinculo comunitario. Ele nao acessa tabelas de entidades diretamente;
delega a elegibilidade ao dominio dono. A regra atual exige empresa ativa por
`business_data.id`, profissional `public_listed` aceitando clientes,
classificado ativo, evento `upcoming`/`ongoing`, post publicado e nao oculto,
e ponto turistico `published`. Componentes de UI nao podem gravar ou aprovar
vinculos baseados apenas em estado visual.

Descoberta publica e Home/Comunidade devem consumir esses vinculos
indiretamente por services. `LandingFeaturedService` pode compor os links ativos
da comunidade com os dados publicos dos dominios canonicos para blocos de
empresas, servicos/profissionais e classificados, mantendo fallback territorial
quando uma comunidade ainda nao tem vinculos ativos.

A superficie publica de overview da comunidade e
`src/core/community/components/page/CommunityOverviewSurface.tsx`. Ela e a
composicao de UI para `/comunidade/:alias` e para a landing territorial em modo
comunidade; nao e SSOT de dados. Essa superficie deve consumir:

- identidade/perfil por `community-experience`;
- territorio por `TerritoryFilter` canonico;
- indicadores e empresas por `LandingFeaturedService`;
- anuncios por `core/business/promotions`;
- feed publico por contratos de comunidade/feed existentes.

Blocos visuais do concept que ainda nao possuem contrato publico completo
devem existir como estados seguros, nao como dados simulados. Exemplos
vigentes: membros em destaque aguardam contrato de consentimento/agregado
publico; albuns aguardam politica de midia e moderacao; eventos aparecem como
bloco local enquanto a launch surface publica de `events` estiver desligada.
Navegacao para esses blocos pode usar ancora local, mas nao deve promover rota
pausada nem inventar contadores.

Rotas publicas de comunidade nao devem herdar chrome operacional global
(`AppSidebar`, `AppTopbar` ou bottom nav) nem banners de transicao legados. O
alias `/comunidade/:alias` ja e a superficie publica canonica da Comunidade
Local; links para o territorio publico devem aparecer como navegacao contextual
quando fizerem sentido, nao como faixa obrigatoria no topo da pagina.

`src/core/community/access/useCommunityAccess.ts` e o gate central de
permissoes da experiencia comunitaria. Ele pode consumir
`CommunityExperienceService` e `CommunityMembershipService` para resolver a
membership da comunidade persistida da rota, mas nao pode acessar
`community_memberships` diretamente.

Identidade, membership e autorizacao da Comunidade Local sao consumidas pela
API publica de `src/core/community-experience/access`. Composicoes visuais
especificas da Comunidade pertencem a `src/core/community`; consumidores
externos podem importar apenas os entrypoints explicitamente aprovados por
`scripts/validate-community-transversal-boundaries.ts`. Posts, comentarios,
reacoes e ranking continuam pertencendo aos owners transversais `core/posts`,
`core/comments`, `core/social` e `core/feed`. Nao existe facade paralela em
`src/core/community-feed`.

### Entidades Independentes

Estas entidades existem por identidade propria e podem se vincular a uma ou
mais comunidades sem copiar seus dados mestres:

- Empresas: `business_data`, `src/core/business`
- Gastronomia: `gastronomy_profiles`, `menu_*`, `orders`,
  `src/core/verticals/gastronomy`, `src/modules/business/gastronomy`
  - descoberta publica deve usar `gastronomy_profiles` ativo e read model
    canonico de gastronomia, nao inferencia por texto de categoria.
- Servicos/profissionais: `professional_data`, `src/core/professional`,
  `src/modules/professionals/services`
- Classificados: `classifieds`, `src/core/classifieds`,
  `src/modules/classifieds`
- Eventos: `events`, `src/core/verticals/events` para leitura publica,
  runtime, escrita, participacao e check-in canonicos via `EventReadService`,
  `EventRuntimeService` e `EventMutationService`; join, leave e check-in usam
  `event-rpc` com RPCs atomicas dedicadas. Os helpers antigos de contador
  `increment_event_participants` e `decrement_event_participants` nao fazem
  parte do contrato canonico.
- Oportunidades rapidas: `work_opportunities`,
  `src/core/work-opportunities` e `src/modules/work-opportunities` para
  demandas/ofertas locais de ciclo curto, disponibilidade profissional e
  circulacao rapida de trabalho. Nao sao o owner de vagas estruturadas.
- Vagas estruturadas: `vagas`, `vaga_saved_items` e
  `src/modules/classifieds/jobs` para recrutamento formal, candidatura,
  favoritos e paginas publicas de emprego. Permanecem sob a launch surface
  `jobs` e nao devem ser fundidas com `work_opportunities` sem uma migracao
  explicita para um futuro `core/jobs`.
- Usuarios/perfis: `profiles`, `src/core/profiles`, `src/modules/profile`
- Posts/feed: `posts`, `src/core/posts`, `src/core/comments`, `src/core/social`,
  `src/core/feed` e as composicoes de UI em `src/core/community/components/feed`.
  `src/modules/community-feed` documenta o bounded context de produto, sem
  duplicar implementacao. `community_questions` e
  `question_answers` pertencem ao bounded context de Q&A. `community_posts`
  nao e runtime SSOT e nao deve ser consultada fora de migrations historicas ou
  tipos gerados ate a remocao definitiva do schema legado.

### Busca E Descoberta

SSOT operacional:

- `src/core/search`
- `src/core/search/services/SearchService.ts`
- `src/core/search/services/SearchDocumentMapper.ts`
- `src/core/landing/services/HomeDiscoveryService.ts`

Responsabilidade:

- expor `SearchDocument` como contrato canonico de resultado para UI/Home;
- orquestrar busca federada entre services/read models dos dominios donos;
- centralizar mapeadores de entidades para `SearchDocument`, para que busca,
  Home e futuras superficies de descoberta nao dupliquem formatacao, URLs,
  tipos e metadados;
- preservar arrays especificos de dominio apenas como compatibilidade de UI;
- aplicar filtros por tipo e `TerritoryFilter` canonico quando o dominio
  consultado suportar esse filtro.
- aplicar filtro por `communityId` dentro de `SearchService`, consumindo
  `CommunityEntityLinkService` para recortar businesses, professionals,
  classifieds, events e posts por links ativos da comunidade, sem expor
  `community_entity_links` para componentes de UI.
- respeitar `src/config/launchScope.ts`: buckets pausados, como `events` e
  `jobs`, nao devem ser consultados, sugeridos ou usados para buscar vinculos
  comunitarios ate a surface publica ser habilitada.
- falhar fechado em busca comunitaria para buckets dependentes de
  `community_entity_links`: ausencia ou falha de leitura de vinculo nao pode
  virar fallback para resultado amplo fora da comunidade.

`SearchService` nao e dono de empresas, comunidades, eventos, classificados,
profissionais, oportunidades ou posts. Ele deve compor resultados consumindo
os services canonicos de cada dominio. A primeira etapa oficial e busca
federada via services/read models; indice denormalizado ou RPC de busca so deve
ser criado quando houver necessidade real de ranking, latencia ou volume.

Quando existir contexto de Comunidade Local, `SearchFilters.communityId` e o
contrato publico do core/search. A busca pode consultar links comunitarios
ativos por service canonico para tipos ja modelados em `community_entity_links`;
tipos ainda sem vinculo canonico, como oportunidades rapidas, continuam
dependentes do filtro territorial ate a fase de modelagem correspondente.

Oportunidades rapidas e vagas estruturadas compartilham a launch surface
`jobs`, mas possuem aggregates diferentes. `SearchService` pode federar
`work_opportunities` pelo `WorkOpportunitiesService`; vagas estruturadas so
devem entrar na busca global por um adapter explicito do dominio de jobs, sem
consultas diretas de UI e sem tratar `vagas` como alias de
`work_opportunities`.

Rotas publicas de busca:

- `/busca` e `/busca/:state/:city[/district]` sao a superficie federada de
  descoberta publica multi-dominio, usando `BuscaPage`, `useGlobalSearch` e
  `SearchService`.
- Navegacao publica generica, `useAppUrls.search` e JSON-LD `SearchAction`
  devem apontar para `/busca`, nao para `/buscar`.
- `BuscaPage` deve renderizar resultados federados por dominio a partir de
  `SearchDocument`, sem recriar mapeadores nem consultar dominios diretamente.
  Blocos genericos como "outros resultados" nao devem esconder entidades
  canonicas quando o contrato ja informa o tipo do documento.
- `/buscar` e `/buscar/:state/:city[/district]` permanecem como superficie de
  busca inteligente por linguagem natural, focada em empresas e servicos no
  estado atual. Ela nao substitui o SSOT federado de descoberta e nao deve ser
  usada como destino generico de navegacao/SEO.

`HomeDiscoveryService` e o contrato de descoberta da Home. Ele pode compor
cards de atividade, confianca, comunidades, ranking, sugestoes, anuncios e
indicadores a partir de services canonicos, mas nao pode consultar tabelas de
dominio diretamente nem recriar regras de URLs, territorio ou visibilidade.
Leitura publica de Comunidade Local deve passar por
`CommunityExperienceService`, cujo repository e o owner de
`territory_communities` e `community_public_aliases`. Componentes como
`MainLandingPage` devem consumir esse contrato por dados ja normalizados,
mantendo a Home como superficie de apresentacao e nao como dominio.

Componentes publicos de navegacao nao podem importar hooks ou services do
bounded context `core/admin`. Branding publico deve usar asset/contrato publico
explicito; leitura e escrita de `site_settings` por
`admin-site-settings-rpc` pertencem somente ao modulo admin.

Quando uma secao do concept ainda nao tiver agregado publico canonico em escala
-- por exemplo membros ativos ou indicadores operacionais agregados -- o
fallback de lancamento deve ficar explicitamente dentro de
`HomeDiscoveryService` e documentado como editorial. Esse fallback nao pode
virar segunda fonte de verdade nem consultar dados privados como
`community_memberships` no browser.

Indicadores numericos da barra final da Home so podem vir de agregados
publicos canonicos. O contrato atual aceita `businesses`, `services` e
`classifieds` a partir de `LandingFeaturedService.getTerritoryStats`,
`events` a partir de `eventsReadService.getEventsPage(...).totalCount` quando a
surface esta habilitada, e `rating` a partir das avaliacoes publicas de
`trustDocuments`. `members`, `safety` e `responses` nao pertencem ao runtime da
Home enquanto nao houver read model ou RPC publica aprovada para esses sinais.
Pela mesma regra, cards de comunidade nao devem mostrar contagem de membros ou
crescimento percentual editorial. Sem agregado publico aprovado, usam labels
neutras (`Comunidade ativa`, `Ativa`).

Ranking da Home pertence a `HomeCommunityRankingService`. A regra v1 usa
ordem/destaque editorial e sinais publicos de `community_entity_links` ativos
(`link_type`, `entity_type` e `priority`). Sinais privados de membership,
residencia, perfil ou PII so podem entrar no ranking por agregado publico
seguro ou RPC/read model aprovado.

Anuncios patrocinados pertencem a `src/core/business/promotions`. A Home e
outros consumidores devem usar `AdDeliveryService`/`useAdDelivery`, nunca
consultar `ad_campaigns` diretamente. O schema operacional atual expoe
`advertiser_name`, `description`, `cta_label`, `priority`, `starts_at`,
`ends_at`, `territory_ref_id` e `territory_type`.

O contrato de ownership de anuncio pertence a migration
`supabase/migrations/20260709234225_harden_ad_campaign_self_service_contract.sql`.
Campanhas de empresa usam `owner_business_id -> business_data.id`; portanto
`business_data` segue sendo o SSOT de identidade empresarial. Leitura publica
de anuncios so deve entregar campanhas `active`, `approved`, com
`billing_status` em `authorized`/`paid` e dentro da janela
`starts_at`/`ends_at`. Targeting usa `location_id` canonico com escopos
`city`, `district` ou `neighborhood`; nao usa string livre de cidade/bairro.
Donos e gestores autenticados so podem criar ou editar campanhas da propria
empresa em estado nao aprovado. Aprovacao, ativacao,
billing, prioridade e futuras metricas de click/impressao sao responsabilidades
de backend/admin, nao de componentes de Home ou browser com permissao ampla.
O contrato TypeScript do modulo deve refletir esses nomes canonicos
(`description`, `cta_label`, `owner_business_id`) e nao reintroduzir aliases do
schema antigo (`content`, `cta_text`, `owner_entity_type`).

Solicitacao de campanha por empresa deve passar por
`AdCampaignRequestService`, que chama a RPC autenticada
`public.request_ad_campaign(payload jsonb)`. Essa RPC e `SECURITY INVOKER`,
mantem RLS do usuario, valida ownership por `business_data.profile_id` ou
`profile_members`, e cria campanha + targets em uma unica transacao. A tela da
Central `/central/empresas/:businessId/anuncios` e apenas a interface desse
contrato; ela nao aprova, ativa, define prioridade ou contabiliza metricas.

Operacao administrativa de anuncios tambem pertence a
`src/core/business/promotions`. A superficie `/admin/anuncios` deve chamar
`AdCampaignAdminService`, que lista campanhas e executa alteracoes de estado
pela RPC `public.admin_update_ad_campaign_state(p_campaign_id, p_payload)`.
Essa RPC deve permanecer `SECURITY INVOKER`, com RLS ativa, checagem de
`private.is_admin_from_roles`, validacao de transicoes e auditoria em
`ad_campaign_admin_actions`. A UI admin nao pode atualizar livremente
`ad_campaigns`, nem reimplementar no componente as regras de aprovacao,
billing, ativacao e prioridade.

Na Home, `sponsoredItems` significa apenas campanha patrocinada real retornada
por `adDeliveryService`. Conteudo organico de empresas, profissionais,
classificados ou fallback editorial nao pode receber selo `Patrocinado`. Sem
campanha elegivel, o painel de anuncios deve renderizar estado vazio.

A Home Community First e a porta publica de descoberta do ecossistema. Ela pode
organizar hero, comunidades em destaque, atividades, modulos locais, ranking,
sugestoes e anuncios, mas essas secoes devem ser derivadas de contratos de
landing/search/routing ou de configuracao editorial explicita de lancamento.
Ela nao deve virar SSOT de comunidade, empresa, evento, classificado,
gastronomia, servico, territorio, perfil ou permissao.

O layout responsivo da Home, incluindo variacoes mobile-first, header compacto,
hero visual e trilhos horizontais de descoberta, pertence a camada de
apresentacao. Ajustes visuais podem evoluir sem alterar o dominio, desde que
continuem consumindo os contratos canonicos e nao reintroduzam queries diretas
ou regras de negocio no componente.

Estados de sessao exibidos na Home seguem a mesma regra. Contador de
notificacoes deve vir do dominio canonico `core/notifications`; avatar e nome
devem vir da sessao/perfil ativo em `core/session`. A Home nao pode exibir
contador fixo, avatar editorial ou qualquer indicio de usuario logado quando a
sessao real nao existe.

## Relacionamento Oficial

O modelo oficial e:

```text
Territorio canonico
  -> Comunidade Local
      -> vinculos de entidades independentes
      -> membresia e interacao comunitaria
      -> rankings, destaques e descoberta local
```

Regras:

- entidades independentes nao devem nascer duplicadas dentro de comunidades;
- comunidade guarda contexto, vinculo, status, destaque e moderacao;
- dados mestres permanecem no dominio dono da entidade;
- filtros territoriais usam ids canonicos, nao nomes livres de cidade/bairro;
- URLs publicas usam os servicos canonicos de routing/public identity.
- contratos reutilizados por multiplos modulos devem viver em `src/core`; `core`
  nao deve importar nem reexportar implementacao de `src/modules`.

## Fronteiras De Dominio

### `src/core/community-experience`

Dono da identidade da Comunidade Local.

Pode:

- ler `territory_communities`;
- ler `community_memberships`;
- ler `community_entity_links`;
- ler alias publico quando a fachada for consolidada;
- compor dados territoriais canonicos para experiencia publica.

Nao deve:

- virar feed social;
- concentrar empresas, eventos, classificados, gastronomia ou servicos;
- duplicar regras de outros dominios.

### `src/modules/community-*`

Bounded contexts de produto para experiencias comunitarias.

Podem:

- renderizar telas e fluxos de feed, alertas, grupos, problemas, eventos,
  achados/perdidos e recomendacoes;
- consumir services canonicos de `src/core`.

Nao devem:

- acessar Supabase diretamente fora de service/repository aprovado;
- redefinir entidade Comunidade Local;
- recriar URL, territorio ou membership por conta propria.
- expor implementacao para `src/core`; se outro modulo precisar reutilizar,
  promova o contrato para um owner real em `core`.

### `src/app`

Composicao, roteamento e shells.

Pode:

- montar paginas;
- aplicar guards de lancamento;
- combinar modulos.
- concentrar rotas territoriais repetidas em registries declarativos, como
  `AppLayoutRouteRegistry`, para preservar ordem publica sem espalhar
  declaracoes por dominio no shell.

Nao deve:

- ser SSOT de dominio;
- conter regra de negocio persistente;
- consultar tabela canonica diretamente para substituir service de dominio.
- manter listas paralelas de rotas publicas quando um registry canonico ja
  existe para aquele grupo.

## Verticais Oficiais

O SSOT de verticais empresariais e `src/core/verticals/config.ts`.

Estado oficial atual:

- `gastronomy`
- `education`

`business` e dominio horizontal base, nao vertical.

## Regras Para Novos Modulos

Um novo modulo so pode ser criado quando tiver:

- entidade ou capacidade claramente nomeada;
- tabela/SSOT claro quando houver persistencia;
- service canonico em `src/core` quando compartilhar regra;
- rota canonica quando for publico;
- ownership de admin quando houver moderacao/operacao;
- risco e validacao definidos quando tocar seguranca, dados pessoais, RLS,
  storage, pagamentos ou autorizacao.

## Guards Obrigatorios

Mudancas nessa arquitetura devem passar por:

- `npm run validate:taxonomy`
- `npm run validate:architecture:governance`
- `npm run validate:ssot`
- `npm run validate:docs-structure`
- `npm run validate:docs-live-links`

## Fonte De Continuidade

Plano executavel:

- `plans/COMMUNITY_FIRST_ARCHITECTURE_PLAN.md`

Este documento registra a decisao e os invariantes. O plano registra fases,
checklists, riscos e definicao de pronto.
