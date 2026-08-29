# Plano - Home real, anuncios, ranking e SSOT

Status: concluido em 2026-07-10
Owner tecnico: Codex  
Escopo: Home publica do Achegue-se, discovery local, ranking de comunidades, anuncios patrocinados, cards de atividade e indicadores.

## Objetivo

Tudo que aparece na Home deve existir como contrato real do produto, com origem canônica, regra documentada, seguranca coerente e fallback apenas como estado vazio controlado. A Home nao pode vender uma capacidade inexistente, nem consultar tabelas com schema divergente, nem duplicar regras que ja existem no dominio.

## Invariantes obrigatorias

- A Home e uma camada de discovery, nao a fonte da verdade.
- Comunidades usam `territory_communities` e rotas comunitarias canonicas.
- Vinculos entre comunidades e entidades usam `community_entity_links`.
- Empresas usam `business_data` e servicos de `core/business`.
- Gastronomia continua sendo especializacao de empresas, nao entidade territorial paralela.
- Classificados usam `classifieds` e URL publica canonica.
- Servicos profissionais usam o dominio de professionals/services.
- Anuncios usam um unico caminho canonico em `core/business/promotions`.
- Operacao admin de anuncios tambem passa por `core/business/promotions`; `modules/admin`
  e apenas superficie operacional.
- Nenhuma chave `service_role` pode existir no frontend.
- Consultas publicas devem depender de RLS e campos publicos; dados privados de membership, perfil, contato e PII nao entram na Home sem agregado seguro.
- Fallback editorial so pode ser usado quando nao houver dado real suficiente e deve permanecer localizado no Home Discovery.

## Estado encontrado

- `HomeDiscoveryService` ja centraliza boa parte da Home e usa dominios reais para comunidades, empresas, servicos e classificados.
- `communityRanking` ainda era apenas a lista de comunidades cortada por ordem editorial, sem regra de ranking explicita.
- `communityActivities` ainda vinha de fallback estatico.
- `sponsoredItems` vinha de documentos confiaveis de empresas/servicos, mas nao do modulo real de anuncios.
- `events` e `jobs` estao desativados em `src/config/launchScope.ts`, mas o discovery da Home ainda podia consultar eventos e oportunidades.
- O modulo de anuncios existia, mas o repositoio principal esperava colunas antigas (`owner_entity_type`, `content`, `cta_text`) enquanto o schema gerado atual expoe `advertiser_name`, `description`, `cta_label`, `priority`, `starts_at`, `ends_at`, `territory_ref_id` e `territory_type`.
- O banco ainda nao tinha uma migration canonica no repositorio para ownership de campanha por `business_data`. Arquivos SQL antigos em `src/core/business/promotions/sql` descreviam outro schema e RLS inseguro/amplo, portanto nao podiam continuar como fonte paralela.
- `SponsoredAdsRuntimeService` duplicava acesso direto ao Supabase fora de `core/business/promotions`.

## Arquitetura alvo por bloco da Home

### Comunidades em destaque

Fonte: `CommunityExperienceService.listPublicCommunitiesForDiscovery`.  
Regra: comunidades ativas, com prioridade editorial e fallback controlado para lancamento.  
DoD:
- Nao consultar tabela diretamente na pagina.
- Preservar rota canonica por alias comunitario.
- Fallback nao pode duplicar comunidade real.

### O que esta acontecendo perto de voce

Fonte primaria: documentos publicos dos dominios habilitados no launch scope.  
Fontes atuais: classificados, empresas/servicos; eventos e vagas apenas quando `events`/`jobs` estiverem habilitados.  
DoD:
- Respeitar `launchScope`.
- Nao mostrar evento/vaga dinamico se a surface estiver pausada.
- Fallback editorial deve ser removivel sem quebrar layout.

### Atividades nas comunidades

Fonte alvo: feed publico/moderado de comunidade e entidades vinculadas via `community_entity_links`.  
Regra: somente posts/camadas publicas aprovadas; interacoes privadas nao entram.  
DoD:
- Trocar fallback fixo por dados publicos quando houver contrato seguro.
- Filtrar intents/surfaces desativadas com `isLaunchCommunityPostEnabled`.
- Nao vazar PII de autores.

### Encontre o que precisa na sua comunidade

Fonte: registro de modulos e `launchScope`.  
DoD:
- Tile exibido precisa apontar para modulo pronto ou surface habilitada.
- Eventos, vagas e outros modulos pausados nao devem parecer lancados sem contrato.

### Ranking das comunidades

Fonte alvo: `territory_communities` + sinais publicos/agregados.  
Regra v1 sem nova migration:
- Peso editorial: `is_featured` e `sort_order`.
- Peso de ecossistema: links ativos em `community_entity_links`, ponderados por `link_type`, `entity_type` e `priority`.
- Desempate estavel por nome/id.
Regra futura:
- Agregados seguros para membros ativos, posts aprovados, empresas vinculadas, eventos habilitados e moderacao.
DoD:
- Regra deve estar em servico de ranking, nao espalhada na UI.
- Nao usar `community_memberships` diretamente na Home.
- Explicar no codigo/docs o que entra no ranking.

### Anuncios de empresas locais

Fonte: `core/business/promotions`.  
Regra:
- Campanhas ativas, no placement correto, dentro de janela `starts_at`/`ends_at`.
- Campanhas publicas tambem precisam estar `review_status = 'approved'` e
  `billing_status` em `authorized`/`paid`.
- Targeting por `location_id` com escopo `city`, `district` ou
  `neighborhood`, nunca por string de bairro/cidade.
- Empresa anunciante usa `owner_business_id -> business_data.id`; `business_data` continua sendo o SSOT da identidade da empresa.
- Donos/gestores podem criar/editar campanhas apenas em estado nao aprovado; aprovacao, ativacao, billing e prioridade ficam fora do browser.
- Admins alteram revisao, billing, ativacao e prioridade por RPC canonica
  `admin_update_ad_campaign_state`, com RLS ativa e auditoria.
- Fallback generico apenas quando nao houver target elegivel.
DoD:
- Remover consulta direta duplicada a `ad_campaigns`.
- Alinhar repository ao schema Supabase gerado atual.
- Home deve consumir campanha real antes de fallback de destaque.
- Escrita de campanha deve respeitar RLS por ownership de empresa.
- Click/impressao nao deve vir direto do browser sem contrato seguro.
- Campanha `active` deve ser impossivel sem `review_status = 'approved'` e
  `billing_status` em `authorized`/`paid`.

### Indicadores da Home

Fonte: agregados publicos e dominios reais.  
DoD:
- Empresas, classificados, servicos e avaliacao devem vir de dados reais quando disponiveis.
- Membros ativos, seguranca e respostas rapidas nao podem aparecer como indicador numerico da Home sem agregado publico real ou read model/RPC aprovado.

## Ordem de execucao

1. [x] Criar este plano e manter status atualizado.
2. [x] Fazer `HomeDiscoveryService` respeitar `launchScope` para eventos e vagas.
3. [x] Corrigir `core/business/promotions` para o schema atual de `ad_campaigns`.
4. [x] Fazer `SponsoredAdsRuntimeService` delegar para `useAdDelivery`, removendo duplicacao de Supabase.
5. [x] Adicionar uma camada de ranking de comunidades em `core/landing/services`.
6. [x] Integrar ranking no `HomeDiscoveryService`.
7. [x] Preparar Home para receber campanha real com `imageUrl` externo de anuncio.
8. [x] Substituir atividades puramente estaticas por leitura primaria de `postService.getTopPosts`.
9. [x] Atualizar docs de arquitetura/status.
10. [x] Rodar validadores finais de arquitetura/seguranca, typecheck e build.
11. [x] Criar migration canonica para ownership/RLS de campanhas patrocinadas.
12. [x] Remover SQL legado duplicado de `src/core/business/promotions/sql`.
13. [x] Remover aliases TypeScript legados de anuncios (`owner_entity_type`, `content`, `cta_text`).
14. [x] Criar fluxo de solicitacao de campanha em `/central/empresas/:businessId/anuncios`.
15. [x] Validar migration, security authority, typecheck e build apos hardening.
16. [x] Criar operacao admin real para revisar, validar billing, ativar/pausar e priorizar campanhas.
17. [x] Registrar auditoria de mudancas operacionais em anuncios.
18. [x] Aplicar e revalidar a migration admin de anuncios no Supabase remoto.
19. [x] Remover indicadores numericos sem fonte real da Home e travar a regra em teste.
20. [x] Remover contagens e percentuais editoriais dos cards de comunidade ate existir agregado publico aprovado.
21. [x] Garantir que o bloco de anuncios da Home exiba apenas campanhas patrocinadas reais.
22. [x] Remover estado falso do header da Home para notificacoes e perfil.
23. [x] Reativar o gate de copy publica territorial para a Home/landing atual.
24. [x] Alinhar a busca territorial usada pela Home ao contrato federado de `SearchService`.
25. [x] Fazer busca global respeitar `launchScope` e falhar fechado em escopo de comunidade sem vinculo canonico.
26. [x] Ajustar UI da busca federada para renderizar resultados por dominio em vez de bloco generico.
27. [x] Remover chamada admin desnecessaria do sidebar publico.
28. [x] Alinhar navegacao publica, `useAppUrls` e SEO para a rota federada `/busca`.

## Execucao 2026-07-09

- `HomeDiscoveryService` agora respeita `launchScope` para `events` e `jobs`.
- `MainLandingPage` filtra menu, tiles e fallbacks visuais por `launchScope`.
- `AdRepositorySupabase` foi alinhado ao schema gerado atual de `ad_campaigns`.
- `SponsoredAdsRuntimeService` virou adaptador sobre `useAdDelivery`.
- `HomeCommunityRankingService` centraliza o ranking v1 por sinais publicos.
- `HomeDiscoveryService` usa campanha elegivel antes de destaques organicos.
- `HomeDiscoveryService` usa `postService.getTopPosts` como fonte primaria de
  atividades comunitarias quando existe `location_id`.
- Testes focados adicionados/atualizados:
  - `HomeDiscoveryService.spec.ts`
  - `HomeCommunityRankingService.spec.ts`
- Validacoes executadas:
  - `npm run test -- HomeDiscoveryService HomeCommunityRankingService`
  - `npm run typecheck:app`
  - `npx eslint` nos arquivos alterados de Home/landing/promotions
  - `npm run validate:docs-structure`
  - `npm run validate:docs-live-links`
  - `npm run validate:taxonomy`
  - `npm run validate:architecture:community`
  - `npm run validate:architecture:governance`
  - `npm run security:validate`
  - `npm run build`
  - `git diff --check`

## Execucao complementar 2026-07-09

- Criada a migration `20260709234225_harden_ad_campaign_self_service_contract.sql`.
- `ad_campaigns` e `ad_targets` passam a ter contrato canônico em
  `supabase/migrations`, incluindo RLS, grants explicitos, indices e
  ownership por `owner_business_id -> business_data.id`.
- Leitura publica de anuncios ficou restrita a campanhas `active`,
  `approved`, com `billing_status` em `authorized`/`paid` e dentro da janela
  de exibicao.
- Escrita de empresa autenticada ficou limitada a campanhas da propria
  empresa em estado `draft`/`pending`, com `status = 'paused'`,
  `billing_status = 'unpaid'` e `priority = 0`.
- Aprovacao, ativacao, billing e prioridade permanecem operacoes de backend,
  admin ou `service_role`, nao operacoes livres do browser.
- Removidos os SQLs antigos em `src/core/business/promotions/sql`, que
  continham schema obsoleto (`owner_entity_type`, `content`, `cta_text`) e RLS
  amplo (`USING (true)`).
- Tipos e consumidores de `core/business/promotions` foram alinhados ao schema
  atual: `AdCampaign` expoe `owner_business_id`, `description`, `cta_label`,
  `review_status`, `billing_status` e `source`; `SponsoredAdCard`,
  `AdRepositorySupabase` e `HomeDiscoveryService` nao usam mais aliases
  legados.
- Criada RPC autenticada `public.request_ad_campaign(payload jsonb)`, com
  `SECURITY INVOKER`, ownership por `business_data`, validacao de campos,
  criacao atomica de campanha + targets e `GRANT EXECUTE` apenas para
  `authenticated`.
- Criado `AdCampaignRequestService` para listar campanhas da empresa e enviar
  solicitacoes via RPC canonica.
- Criada a tela `BusinessAdsPage` em
  `/central/empresas/:businessId/anuncios`, conectada ao menu da Central e aos
  atalhos da visao geral. A empresa solicita anuncio, mas a exibicao publica
  continua dependendo de revisao, pagamento e ativacao operacional.

## Execucao complementar 2026-07-10

- Criada a migration `20260710010449_add_admin_ad_campaign_operations.sql`.
- Adicionada constraint que impede `ad_campaigns.status = 'active'` sem
  `review_status = 'approved'` e `billing_status` em `authorized`/`paid`.
- Criada a tabela `ad_campaign_admin_actions` com RLS e leitura apenas para
  admins autenticados, servindo como trilha de auditoria para revisao, billing,
  ativacao e prioridade.
- Criado trigger privado `private.audit_ad_campaign_admin_change()` para
  registrar alteracoes em campos protegidos sem expor uma funcao publica
  privilegiada.
- Criada RPC `public.admin_update_ad_campaign_state(p_campaign_id, p_payload)`
  com `SECURITY INVOKER`, checagem de `private.is_admin_from_roles`, validacao
  de transicoes, motivo obrigatorio em rejeicao e bloqueio de ativacao sem
  contrato aprovado/pago.
- Criado `AdCampaignAdminService` como fronteira canonica para o admin listar
  campanhas, consultar metricas e chamar a RPC de estado.
- Criada a tela `/admin/anuncios`, conectada ao menu admin como modulo proprio,
  sem misturar anuncios patrocinados com cupons/promocoes.
- Adicionado teste unitario `AdCampaignAdminService.spec.ts` para filtros,
  payload canonico da RPC e rejeicao de update vazio.
- Indicadores da barra final da Home agora usam apenas fontes canonicas:
  `LandingFeaturedService.getTerritoryStats` para empresas, servicos e
  classificados; `eventsReadService.getEventsPage(...).totalCount` quando
  `events` esta habilitado; e avaliacoes publicas de `trustDocuments`.
  Indicadores sem agregado real (`membros ativos`, `100% ambiente seguro` e
  `respostas rapidas`) foram removidos do runtime e protegidos por teste em
  `HomeDiscoveryService.spec.ts`.
- Cards de comunidade nao exibem mais contagens de membros ou percentuais de
  crescimento editoriais. Enquanto nao houver read model/RPC publica aprovada
  para esses sinais, `membersLabel` usa `Comunidade ativa` e `deltaLabel` usa
  `Ativa`.
- O bloco `Anuncios de empresas locais` nao transforma mais empresas,
  profissionais ou fallback editorial em conteudo patrocinado. `sponsoredItems`
  agora vem somente de campanha elegivel retornada por `adDeliveryService`;
  quando nao existe campanha ativa/aprovada/paga, a Home renderiza estado vazio
  sem selo `Patrocinado`.
- O header da Home nao exibe mais contador fixo de notificacoes nem avatar
  editorial. O sino usa o hook canonico de notificacoes para usuario logado e
  fica sem badge para visitante; o avatar usa o perfil ativo da sessao ou um
  fallback visual neutro de iniciais.
- O teste `tests/public-territorial-copy-regression.test.ts` foi realinhado ao
  contrato atual: removeu referencia a arquivo inexistente
  `CidadeLanding.neighborhood-stream-model.ts` e passou a proteger as secoes
  atuais da Home/landing de bairro.
- A rota territorial usada pela Home para busca (`/busca/:state/:city` e
  `/busca/:state/:city/:district`) agora renderiza `BuscaPage`, que consome
  `SearchService` via `useGlobalSearch`, hidrata `q` da URL e aplica
  `TerritoryFilter` resolvido pela rota. A rota `/buscar` permanece como busca
  inteligente de linguagem natural, sem redirect e sem substituir o contrato
  federado da Home.
- `SearchService` passou a respeitar `launchScope` para `events` e `jobs`:
  buckets pausados nao sao consultados, nao aparecem nas sugestoes e nao
  entram nos links comunitarios buscados por `CommunityEntityLinkService`.
- A busca com `SearchFilters.communityId` agora falha fechada para buckets que
  dependem de `community_entity_links`: se nao houver vinculo ativo, ou se a
  leitura de vinculos falhar, o service nao devolve itens soltos fora do
  recorte comunitario.
- `BuscaPage` agora apresenta resultados federados por dominio: comunidades,
  classificados, atividades, eventos, oportunidades e cupons usam secoes
  proprias baseadas em `SearchDocument`. Empresas e profissionais continuam
  com cards especificos, mas o componente nao recria mapeadores nem consulta
  dominios diretamente.
- `AppSidebar` publico deixou de importar `useSiteSettings` do contexto
  admin. O sidebar ja usa o logo oficial local e nao precisa chamar
  `admin-site-settings-rpc` em paginas publicas; isso removeu erro de CORS no
  host e reduziu acesso desnecessario a Supabase/Edge Function.
- `tests/public-shell-admin-boundary-regression.test.ts` trava a fronteira
  para impedir que o sidebar publico volte a importar o hook admin ou chamar
  a Edge Function administrativa.
- Links publicos de busca agora apontam para `/busca`: `AppSidebar`,
  `navigation.config`, `useAppUrls` e JSON-LD `SearchAction` usam a rota
  federada. `/buscar` permanece como superficie explicita de busca IA, sem
  ser usada como destino generico de descoberta multi-dominio.
- `ROUTING_MODULE_SLUGS` passou a incluir `search: "busca"` para permitir
  construcao via `buildModuleTerritoryUrl`, e o SEO territorial ganhou copy do
  modulo `busca`.

## Ponto de corte aceitavel

Este plano so pode ser considerado completo quando:
- Cada bloco visual da Home tiver fonte canonica ou justificativa documentada de fallback.
- Nao houver duplicidade de acesso a anuncios.
- Self-service e admin de anuncios passarem por services canonicos e RPCs
  auditaveis.
- Ranking tiver regra de score isolada e testavel.
- Surfaces desativadas nao forem anunciadas como prontas.
- Documentos de arquitetura e status refletirem o estado real.
- Gates automatizados passarem.
