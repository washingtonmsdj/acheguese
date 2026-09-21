# Community Architecture — contrato pós-MVP

Data de referencia original: 2026-07-09  
Status de produto: **PAUSED no MVP desde 2026-09-21**

> Este documento preserva o contrato interno da capability Community para uma futura reativacao.
> Ele **nao** e autoridade de lifecycle publico. A ativacao pertence exclusivamente a
> `src/app/config/productModuleRegistry.ts`, onde Community permanece `paused`.

O plano detalhado de implementacao incremental permanece preservado em
`docs/10-archive/plans/COMMUNITY_FIRST_ARCHITECTURE_PLAN.md`.

## Decisao Oficial do modulo

O core domain **da capability Community** e:

**Comunidade Local**

Comunidade Local e a entidade social ancorada em um territorio canonico. Quando
o modulo for certificado e reativado, ela podera organizar pertencimento,
interacoes e distribuicao local de entidades independentes. Enquanto o lifecycle
estiver `paused`, este contrato nao autoriza Home, Feed, discovery, navegacao,
prefetch ou queries publicas de Community.

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

### Estado publico da Community

`CommunitySurfacePolicy` combina duas fontes que possuem responsabilidades
diferentes:

- `territory_communities.status` define se existe uma identidade Community
  persistida e se ela esta `active`, `coming_soon`, `launching` ou
  `waiting_list`;
- `module_rollouts` define se o modulo Community esta operacionalmente
  habilitado para o escopo territorial resolvido.

Uma Community so e `active` quando o perfil persistido esta `active` **e** o
rollout efetivo esta ativo. Rollout herdado de cidade ou de grupo nao fabrica
identidade Community. Perfil `coming_soon`/`launching`/`waiting_list` exibe o
estado de interesse permitido pelo contrato existente. Ausencia de perfil,
perfil inativo ou erro de resolucao produzem estado seguro e explicito, nunca
feed, membros, contadores ou identidade sinteticos.

Blocos visuais do concept que ainda nao possuem contrato publico completo
devem existir como estados seguros, nao como dados simulados. Exemplos
vigentes: membros em destaque aguardam contrato de consentimento/agregado
publico; albuns aguardam politica de midia e moderacao; eventos aparecem como
bloco local enquanto a launch surface publica de `events` estiver desligada.
Navegacao para esses blocos pode usar ancora local, mas nao deve promover rota
pausada nem inventar contadores.

Rotas publicas de comunidade herdam somente a navegacao territorial adaptativa
do sistema Territorio Vivo: bottom navigation no mobile, rail no tablet e
sidebar + contexto no desktop. Elas nao devem montar `AppSidebar`, `AppTopbar`,
`BottomNav` legado, banners de transicao ou um segundo shell interno. O alias
`/comunidade/:alias` e a superficie publica canonica da Comunidade Local;
`/feed`, `?view=groups`, `?view=discussions` e `/grupos` permanecem no mesmo
contexto e preservam query params/deep-links. Links para a Home territorial e
Explorar sao navegacao contextual, nao uma faixa duplicada.

`Publicar` e o composer aparecem somente quando `CommunityAccessPolicy`
autoriza `create_post`. Visitante publico recebe convite para participar; uma
fixture visual jamais substitui sessao ou policy e so pode ser habilitada em
`DEV`.

`src/core/community/access/useCommunityAccess.ts` e o gate central de
permissoes da experiencia comunitaria. Ele pode consumir
`CommunityExperienceService` e `CommunityMembershipService` para resolver a
membership da comunidade persistida da rota, mas nao pode acessar
`community_memberships` diretamente.

Consumidores fora do bounded context legado de `src/core/community` devem
importar a fachada publica de acesso por `src/core/community-experience/access`.
Superficies de feed/descoberta comunitaria fora desse bounded context devem
usar fachadas explicitas em `src/core/community-feed`, nao caminhos diretos de
`src/core/community/*`.

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
- Posts/feed: `posts`, `src/core/posts`, `src/core/feed` e
  `src/modules/community-feed` para feed social, publicacoes comunitarias,
  moderacao, busca e metricas de perfil. `community_questions` e
  `question_answers` pertencem ao bounded context de Q&A. `community_posts`
  nao e runtime SSOT e nao deve ser consultada fora de migrations historicas ou
  tipos gerados ate a remocao definitiva do schema legado.

### Busca E Descoberta

Search permanece um bounded context preservado para pós-MVP:

- `src/core/search`;
- `SearchService`;
- `SearchDocumentMapper`;
- `searchProviders`.

No MVP de 2026-09-21, `search` está `paused` no
`src/app/config/productModuleRegistry.ts`. Portanto Busca não participa da
Home, navegação, prefetch ativo ou discovery público.

Quando for reativado, Search continua sendo um orquestrador: ele consome ports
dos domínios donos e não passa a possuir Business, Community, Events,
Classifieds, Professional ou Jobs.

A antiga agregação de Home por `HomeDiscoveryService` e
`HomeCommunityRankingService` foi aposentada. `TerritoryHomePage` não é uma
plataforma paralela de discovery: no MVP ela apresenta somente os módulos
efetivamente ativos — Empresas, Mapa e Perto de mim — usando URLs e contratos
canônicos.

A Home não fabrica ranking, atividade, métricas sociais, eventos, vagas,
serviços ou conteúdo editorial para preencher ausência de dados. Módulos
pausados não são consultados apenas para montar cards escondidos.

Comunidade e Search podem voltar depois do MVP pelos próprios owners e pelo
lifecycle canônico. A reativação não deve restaurar agregadores monolíticos da
Home nem acesso cruzado direto a tabelas de outros domínios.

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

Plano concluido preservado como historico de implementacao:

- `docs/10-archive/plans/COMMUNITY_FIRST_ARCHITECTURE_PLAN.md`

Este documento registra a decisao e os invariantes. O plano arquivado registra
fases, checklists, riscos e definicao de pronto da implementacao concluida.
