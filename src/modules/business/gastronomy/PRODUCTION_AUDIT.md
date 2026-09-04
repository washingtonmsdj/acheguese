# Auditoria de Producao - Gastronomia

Atualizado em 2026-09-04.

## Status

O modulo esta em pre-certificacao G6. O fluxo v1 de setup, cardapio, checkout, pedido e operacao possui historico operacional forte e nao ha blocker critico/alto conhecido de source, schema ou RLS apos a revalidacao de 2026-09-04. O modulo ainda NAO e `READY`: falta prova operacional/hosted same-SHA conforme o plano raiz.

## Ja corrigido nesta rodada

- Checkout publico e pedidos deixaram de apontar para rotas pausadas.
- Carrinho, checkout e pedido passaram a distinguir `delivery`, `takeout` e `dine_in`.
- Entrega por motoboy/plataforma foi bloqueada no checkout oficial de Gastronomia, independentemente de flags de mobility em outras superficies.
- Validacoes front/domain foram reforcadas para configuracoes gastronomicas.
- Fila de pedidos reduziu risco de N+1 em itens.
- `menu.mutations.ts` foi removido apos prova de ausencia de consumidores; `MenuService` permanece como SSOT operacional para escrita de cardapio.
- Orders/delivery receberam hardening local de RLS e RPCs para alinhar `profiles.user_id`/`profile_members` com autorizacao e bloquear spoofing de `actor_profile_id`.
- Landing publica deixou de bloquear descoberta por ausencia de destino; destino agora atua como contexto para entrega/distancia.
- Landing publica deixou de usar full-screen loading para esconder o shell inteiro enquanto a lista carrega; o loading ficou restrito a secao de restaurantes.
- Copy publica foi alinhada para tratar destino como opcional e orientativo, nao como pre-requisito para navegar.
- `GastronomyCheckoutSheet` foi alinhado com `GastronomyCheckoutPage` para exigir endereco estruturado em delivery e carregar snapshot de numero/complemento/contato do destinatario.
- Checkout page e checkout sheet receberam rotulos explicitos nos campos principais e estados selecionados com `aria-pressed` nos seletores.
- `OrdersPage` ganhou rotulo explicito para busca de clientes, `aria-label` nos filtros e loading com `aria-live`.
- `OrderOperationsPanel` ganhou labels explicitos no fluxo de cancelamento para motivo estruturado e justificativa textual.
- `OrderTrackingCard`, `OrderDetailsPage` e `OrderPublicReviewPanel` receberam `aria-live`/`role="status"` em mensagens de estado e quebra de linha defensiva para endereco, timeline e observacoes longas no mobile.
- `GastronomyPremiumDetailPage` recebeu `aria-label`/`aria-pressed` em filtros e controles de quantidade/carrinho; `OrderCard` recebeu quebra de linha defensiva para endereco e observacoes longas.
- CTAs mortos do detalhe premium foram conectados ao checkout canonico: `Fazer pedido` agora leva ao checkout quando ha carrinho e faz scroll para o cardapio quando ainda nao ha itens; `Finalizar pedido` agora abre o checkout real.
- O resumo lateral do detalhe premium passou a usar `cart.delivery_fee` e `cart.total` como fonte de verdade, removendo divergencia entre UI e carrinho efetivo.
- Microcopy corrompida foi normalizada nas superficies premium, checkout, landing publica, fila e detalhe do pedido; foi adicionada uma auditoria estatica para bloquear retorno de mojibake nas telas criticas.
- O setup de Gastronomia agora garante bootstrap idempotente de `menu` e `menu_categories`, inclusive autocorrecao em perfil legado salvo novamente.
- O setup diferencia erro fatal de aviso parcial: quando o perfil foi persistido mas algum bootstrap auxiliar retorna alerta, a UI mostra warning e segue para a Central em vez de prender o lojista em uma ativacao ja gravada.
- Criacao de item passou a resolver categoria fallback quando o plano oculta a selecao de categorias, destravando o primeiro produto em cardapios com categoria base unica.
- A rota canonica `/empresas/...` para negocios de Gastronomia agora delega para a experiencia transacional oficial, removendo o CTA morto que deixava o comprador preso na landing institucional.
- O `StickyOrderBar` passou a construir a rota publica valida de checkout de Gastronomia, evitando `404` ao sair do detalhe canonico `/empresas/...`.
- Foi identificada e corrigida localmente a causa raiz do checkout sem pedido: o banco mantinha duas assinaturas de `delivery_create_order` (enum e `TEXT`), e o PostgREST respondia `300 Multiple Choices`.
- A limpeza das sobrecargas legadas de `delivery_create_order`, `delivery_transition_logistics_status`, `delivery_transition_financial_status` e `delivery_report_occurrence` foi aplicada no projeto remoto `xhdowzacfujckjelqhtd`, eliminando os `PGRST203` que quebravam checkout e operacao do lojista.
- Foi identificado que o trigger `log_order_timeline_event_trigger` estava configurado como `AFTER INSERT OR UPDATE`, embora a funcao tente preencher `NEW.accepted_at`, `NEW.preparing_at`, `NEW.ready_for_pickup_at`, `NEW.picked_up_at`, `NEW.delivered_at`, `NEW.canceled_at` e `NEW.failed_at`. Isso fazia a timeline registrar o evento, mas deixava timestamps operacionais nulos em cliente, lojista e tracking. A correcao foi preparada em `20260703113000_fix_orders_timeline_trigger_and_backfill.sql`.
- O checkout SSOT ganhou validacao defensiva de endereco estruturado completo para `delivery` (`CEP`, rua, numero, bairro, cidade e UF), evitando bypass da regra por chamadas fora da UI.
- Pedidos novos de Gastronomia com `pix` ou `payment_link` passaram a nascer com `financial_status = pending_payment`, alinhando checkout, filtros de pagamento e confirmacao manual da loja.
- O detalhe do pedido passou a expor tambem `Em preparo` e `Saiu para entrega`, reduzindo lacuna de tracking para cliente e lojista.
- O E2E canonico `tests/e2e/gastronomy-onboarding.spec.ts` passou ponta a ponta: setup de pizzaria, primeiro item, vitrine publica, checkout, criacao de pedido e operacao inicial do lojista.
- A revalidacao de hoje confirmou persistencia real de `accepted_at`, `preparing_at` e `ready_for_pickup_at` no banco apos o hotfix do trigger.
- As paginas beta pausadas de entregas avancadas, analytics e promocoes foram removidas fisicamente do modulo operacional (`DeliveryManagementPage`, `AnalyticsPage`, `GastronomyPromotionsPage` e componentes/hooks exclusivos de analytics). As rotas continuam expondo apenas `createLaunchPausedRoute`, evitando codigo morto exportavel e reativacao acidental.
- A copia legada de `GastronomyVerticalCTA` dentro do modulo foi removida; a ativacao vertical continua pertencendo ao contrato canonico em `src/core/verticals/gastronomy`.
- Cards antigos de dashboard sem consumidor real (`TodayOrdersCard` e `DeliverySummaryCard`) foram removidos do filesystem e do barrel de componentes; o dashboard v1 permanece nos cards atualmente renderizados.
- Paginas/componentes antigos sem rota ou consumidor real tambem foram mantidos fora do filesystem (`GastronomyPlansPage`, `OperationalDashboardPage`, `GastronomyContactSidebar`, `GastronomyOwnerDashboard`, `GastronomyPhotoGallery`, `GastronomyQuickActions`, `GastronomyVerticalStatus`, `DeliveryStatsWidget`).
- Hooks sem consumidor de runtime foram removidos do barrel e do filesystem (`useMenuVariations`, `useMenuAddons`, `useDeliveryEligibility`, `useGastronomyPreview`, `useGastronomySimilar`, `useSubscriptionManagement`), evitando API publica fantasma.
- O hook duplicado `useMenuItem.ts` foi removido; o contrato canonico continua em `useMenuItems.ts`. `MenuSummaryCard` agora resolve `menuId` via `useGastronomyMenuId` antes de consultar categorias e itens.
- UI/hooks genericos de nichos e versionamento sem uso em runtime foram removidos (`NicheSelector`, `NicheCapabilitiesList`, `useGastronomyNiche`, `AdminSectionGuard`, `NicheUpgradeBanner`, `useNicheVersioning`, `useAdminSections`). Permanecem registry, presets, servicos e o nicho de pizzaria usado pelo fluxo real.
- Documentacao de nichos/versionamento que ensinava APIs removidas tambem foi apagada ou ajustada, para nao manter README como legado enganoso.
- `GastronomyPublicPreviewService` foi removido por nao ter consumidor de runtime; os previews publicos ativos usam as queries/catalogos consumidos pela landing e detalhe.
- `hooks/README.md`, `niches/index.ts`, `niches/NICHE_EVOLUTION_GUIDE.md` e `niches/pizzaria/README.md` foram normalizados para refletir apenas o contrato atual, sem encoding quebrado nem claims de completude.
- Componentes publicos antigos sem consumidor de runtime foram removidos do filesystem e dos barrels (`GastronomyHero`, `GastronomyCTA`, `GastronomyFilters`, `GastronomyCategoryCards`, `DeliveryInfoCard`, `OpeningStatusBadge`, `MenuCategoryTabs`).
- O barrel raiz `src/modules/business/gastronomy/index.ts` deixou de reexportar paginas e UI legada; paginas continuam sendo importadas diretamente pelas rotas.
- Servicos isolados sem consumidor real foram removidos (`GastronomyMapService`, `gastronomy-subscription.service` e `constants/subscription-status.ts`). Mapa e billing devem passar pelos contratos canonicos ativos quando forem reativados para Gastronomia.
- Diretorios vazios de placeholder foram removidos (`__mocks__`, `dev` e `niches/versioning/examples`).
- A facade `GastronomyService.ts` foi reduzida para leitura/helpers; a classe legada, o default export e `gastronomy.mutations.ts` foram removidos para evitar caminho alternativo de escrita fora dos servicos canonicos.
- Comentarios e mensagens de erro em servicos/tipos principais foram normalizados para remover mojibake em `MenuService`, `types/menu.ts`, `gastronomy.queries.ts`, `menu.queries.ts`, `GastronomyProfileService`, `DeliveryAreaService`, `review.queries.ts` e `favorites.queries.ts`.
- O core adjacente `src/core/business/services/gastronomy.*` tambem teve comentarios/mensagens normalizados, sem alterar o contrato transversal.
- As regras compartilhadas de checkout foram extraidas para `checkout/checkoutRules.ts`; pagina e sheet agora usam a mesma decisao para meios de pagamento, endereco estruturado, payload de entrega, observacoes do pedido e bloqueio de submit.
- A rota publica de detalhe de Gastronomia voltou a priorizar `seo.canonicalGastronomyUrl`/`seo.canonical` antes de `identity.canonicalBusinessUrl`, evitando redirecionamento indevido de `/gastronomia/...` para `/empresas/...` no fluxo transacional.
- O E2E de onboarding passou a usar territorio bootstrap deterministico (`/br/ba/salvador/nordeste-de-amaralina`) antes do fallback dinamico, reduzindo flake por territorio sem cobertura publica.
- Notificacoes de pedido/status em `OrderDeliverySSOTService` deixaram de bloquear a mutacao canonica: criacao de pedido, aceite/preparo/retirada/entrega/prova agora retornam apos RPC/hidratacao e disparam notificacao em best-effort com log de falha.
- A auditoria de SEO foi estabilizada para validar a presenca real de JSON-LD `Restaurant` sem depender do estilo de aspas gerado pelo formatter.
- A revalidacao local atual confirmou `npx vitest run src/modules/business/gastronomy --reporter=default` com 27 arquivos e 119 testes passando.
- O E2E `tests/e2e/gastronomy-onboarding.spec.ts` passou novamente no Chromium apos os ajustes de canonical, checkout e notificacoes.
- O bloqueio global de typecheck fora de Gastronomia foi removido com alinhamento conservador dos tipos de posts em community/mobility; `npm run typecheck:app` passou novamente.
- `GastronomyDetailPage` foi reduzida de 509 para 333 linhas ao extrair SEO/JSON-LD para `GastronomyDetailSeo`; o gate `validate:architecture:file-sizes` voltou a passar para Gastronomia.
- Gates estruturais reexecutados e verdes nesta etapa: `validate:architecture:governance`, `validate:taxonomy`, `validate:ssot`, `validate:docs-structure`, `validate:migrations`, `validate:architecture:delivery`, `validate:architecture:file-sizes` e `audit:architecture`.
- A operacao administrativa de pedidos deixou de depender do `activeProfile` da sessao para mutacoes criticas; `OrderOperationsPanel` agora usa `merchant_profile_id` do pedido como actor canonico da loja.
- `useOrders` e `useOrderDetails` tambem passaram a resolver o actor canonico da loja a partir de `merchant_profile_id` do pedido/cache antes de cair no `activeProfile`, reduzindo recaida do bug em fila, detalhe e notas internas.
- `useDashboardAccess` recebeu retry curto para bootstrap de auth/ownership, evitando falso negativo intermitente de permissao logo apos login na Central.
- `SessionService`, `useActiveProfile` e `MultiProfileProvider` foram alinhados para compartilhar `active_profile_id`, validar o perfil salvo contra a lista do usuario e sincronizar a troca com a sessao global; isso mitiga no frontend a RPC legada que ainda retorna o perfil pessoal em alguns cenarios.
- Foi criada a migration `20260703212954_persist_active_profile_selection.sql` para tornar canonico o contrato backend de `switch_active_profile`/`get_active_profile`, persistindo a escolha em `user_active_profiles` com RLS habilitado, sem exposicao direta para `anon/authenticated`, e com checagem explicita de dono/membro antes de trocar o perfil ativo.
- A migration de perfil ativo foi aplicada diretamente no ambiente vinculado via `supabase db query --linked --file`, reconciliou a ausencia remota de `profile_members.is_active` com `ADD COLUMN IF NOT EXISTS`, e a validacao remota confirmou: RLS ligado na tabela auxiliar, sem `SELECT` direto para `authenticated`, `anon` sem `EXECUTE`, e `switch_active_profile`/`get_active_profile` devolvendo corretamente o perfil `business` no cenario E2E.
- `OrderOperationsPanel` ganhou estado otimista local para a etapa operacional do lojista e refetch de seguranca em erro/sucesso, evitando que o painel fique preso visualmente em `pending` enquanto o SSOT ja avancou.
- O setup de Gastronomia passou a tratar warning de bootstrap como nao-fatal (`toast.warning`) quando `result.data` existe, evitando que o lojista fique preso na tela de ativacao apos perfil/cardapio ja persistidos.
- O E2E operacional passou a esperar o estado terminal no banco antes das validacoes finais, garantindo que a UI otimista nao mascare falha de `delivery_mark_delivered`.
- Foi adicionado teste unitario de regressao para `OrderOperationsPanel`, travando o uso de `merchant_profile_id` nas mutacoes da loja.
- `ItemForm` passou a fechar explicitamente o dialogo apos submit bem-sucedido, com teste unitario cobrindo sucesso e falha, eliminando o estado em que o item era criado no banco mas o modal seguia aberto na Central.
- O onboarding E2E passou a aguardar CTAs operacionais habilitados e a reabrir o detalhe do pedido apos a confirmacao de `ready_for_pickup` no banco, reduzindo clique perdido/flaky no fluxo de retirada.
- `useGastronomyCheckout` deixou de importar `useMotoboy` e de tentar abrir `ride_request` por dentro do checkout oficial; loja configurada como `platform_courier` agora falha cedo com mensagem explicita para reconfiguracao em `own_fleet`.
- `GastronomySetupPage` tambem deixou de anunciar `platform_courier` como opcao de configuracao no v1; o metadata salvo volta a ser `delivery_fulfillment_mode: 'own_fleet'` como contrato canonico de lancamento.
- A revalidacao operacional autenticada da Gastronomia passou integralmente no Chromium: `tests/e2e/gastronomy-operational.spec.ts` com 5 cenarios verdes, cobrindo cardapio, dashboard, mobile 360px, pedido ponta a ponta e superficie de motoboy.
- A suite local de Gastronomia esta em 27 arquivos e 119 testes verdes apos a blindagem adicional do fluxo operacional, sessao multi-perfil, guardas de delivery, formulario de item e rota privada de detalhe do pedido.
- A migration `20260702100000_harden_orders_delivery_authorization.sql` foi aplicada no ambiente vinculado e validada contra o schema remoto: policies principais de `orders`, `order_items`, `order_timeline_events` e `delivery_occurrences` agora usam `auth_can_access_profile(...)` em vez de comparar `profile_id` diretamente com `auth.uid()`.
- Foi adicionada e aplicada a migration `20260703232958_revoke_anon_delivery_rpc_execute.sql`, removendo `EXECUTE` de `anon` dos RPCs sensiveis de pedidos/delivery e mantendo execucao apenas para `authenticated` e `service_role`.
- O historico remoto foi reparado para as migrations criticas comprovadas de Gastronomia/Delivery: `20260702100000`, `20260703100000`, `20260703113000`, `20260703212954` e `20260703232958`.
- Foi adicionada e aplicada a migration `20260703233803_harden_gastronomy_public_views_and_engagement_rpcs.sql`: `gastronomy_profiles_with_niche_info` passou para `security_invoker`, `anon` perdeu grants amplos de escrita nas tabelas de Gastronomia/favoritos/recomendacoes/review_helpfulness, RPCs de usuario passaram a bloquear `anon`, e funcoes de trigger deixaram de ser executaveis por usuarios autenticados via RPC.
- O historico remoto tambem foi reparado para `20260703233803` apos validacao de grants, view options e disponibilidade dos RPCs para `authenticated`.
- `useBusinessFavoritesCount` deixou de chamar RPC autenticado em paginas publicas anonimas; contador de favoritos agora fica habilitado apenas quando ha usuario logado, preservando o CTA publico de login.
- A auditoria remota confirmou RLS de `user_favorite_businesses` e `user_recommended_businesses` com `user_id = auth.uid()` em `USING` e `WITH CHECK`; os RPCs de favorito/recomendacao seguem sem `EXECUTE` para `anon` e disponiveis para `authenticated`.
- O hero publico do detalhe de Gastronomia recebeu labels acessiveis nos botoes icon-only de voltar, favoritar/remover favorito e compartilhar.
- O E2E canonico de onboarding agora valida tambem o fluxo de favoritos: comprador logado favorita a pizzaria criada no teste, o registro e confirmado em `user_favorite_businesses`, `/gastronomia/favoritos` lista a pizzaria, e o fluxo segue para cardapio, checkout e pedido.
- A pagina institucional de Empresas foi revalidada quanto a separacao: negocios cujo vertical primario e Gastronomia continuam delegando para `GastronomyDetailPage`, sem carrinho/checkout duplicado em `/empresas/...`.
- O CTA institucional de Empresas para salvar/recomendar ganhou estado acessivel (`Salvo`/`Recomendado`, `aria-pressed`) e bloqueio visual durante mutacao de recomendacao; isso melhora o fluxo de Empresas sem reintroduzir recomendacao no detalhe transacional de Gastronomia.
- O CTA institucional "Salvar" usa `BusinessFavoriteService`/`useCanonicalBusinessFavorite` com `business_data.id`; a identidade da conta e derivada no backend e nao e enviada pelo browser.
- O CTA institucional de recomendacao foi corrigido para usar `snapshot.identity.businessId` (`business_data.id`) em vez de `institutional.business.id` (`profiles.id`), que quebrava a RPC `toggle_business_recommendation`.
- A landing publica real de Empresas (`EmpresasLandingPage`) deixou de manter favoritos apenas em `useState`; os cards da lista territorial agora renderizam botao acessivel de favorito e persistem pelo contrato canonico `user_favorite_businesses`.
- A pagina duplicada `src/modules/business/pages/EmpresasPage.tsx` e seus componentes exclusivos (`BusinessCard`, `BusinessGrid`, `BusinessFilters`) foram removidos do filesystem e dos barrels do modulo, evitando duas listas publicas concorrentes.
- `src/modules/business/README.md`, `hooks/README.md` e `VALIDATION.md` foram atualizados para remover referencias aos hooks apagados `useBusinessFavorite`/`useBusinessFavorites` e registrar `BusinessFavoriteService` como contrato publico atual.
- O bloco `CENTRAL` duplicado e pausado em `src/app/routes/lazyImports.ts` foi removido; a arvore real `/central/*` continua usando `centralLazyImports.ts`, onde Central, Empresas e Gastronomia operacional estao importados corretamente.
- O E2E `tests/e2e/business-recommendation-operational.spec.ts` cobre empresa institucional nao gastronomica em `/empresas/...`: usuario autenticado encontra a empresa na lista territorial, salva pelo card, abre o detalhe ja como `Salvo`, recomenda, as linhas sao persistidas em `user_favorite_businesses` e `user_recommended_businesses`, o estado sobrevive a reload, e os toggles removem os registros e zeram `favorites_count`/`recommendations_count`.
- O preview institucional de itens de Gastronomia em Empresas deixou de usar shape legado local; agora consome diretamente `PublicGastronomyPreviewItem`, usa `priceLabel` do snapshot e transforma cada item em link para `menuUrl`, sem adicionar carrinho/checkout duplicado.
- Foi adicionada e aplicada a migration `20260703235508_create_gastronomy_review_mutation_rpcs.sql`, criando os RPCs canonicos `create_business_review`, `update_business_review`, `delete_business_review` e `add_business_review_response`, alem de endurecer `can_user_review_business` para `authenticated` com `auth.uid()` e checagem explicita de ownership por perfil.
- A validacao remota confirmou que os RPCs de mutacao de reviews nao sao executaveis por `anon`, continuam disponiveis para `authenticated`/`service_role`, usam `search_path = public, pg_temp` e validam elegibilidade do pedido entregue antes de gravar avaliacao vinculada ao pedido.
- O historico remoto foi reparado para `20260703235508`, mantendo alinhadas as migrations criticas aplicadas diretamente no ambiente vinculado.
- `OrderPublicReviewPanel` passou a usar `merchant_profile_id` como loja avaliada e a resolver o perfil cliente a partir da lista de perfis do usuario, nao apenas do `activeProfile`; isso corrige o caso real em que o cliente acabou de operar a Central como loja e ainda assim deve conseguir avaliar seu pedido publico.
- O E2E operacional agora cobre o fluxo completo: fixture de pedido, loja entrega, cliente abre detalhe publico, publica avaliacao 5 estrelas e o teste confirma no banco que a review ficou em `reviews.order_id`, `reviewed_profile_id = orders.merchant_profile_id` e `reviewer_profile_id = orders.customer_profile_id`.
- A rota publica `/gastronomia/pedidos/:orderId` deixou de contaminar a cidade ativa da navegacao lateral; `usePublicBrowsingCity` agora so aceita rotas territoriais quando o segmento de UF e valido, evitando mostrar UUID de pedido como cidade.
- O seletor E2E do detalhe de pedido passou a validar o heading acessivel `Pedido #...`, reduzindo flake sem mascarar carregamento real da pagina.
- `BusinessFavoriteStore` e o unico owner de `user_favorite_businesses`; Business e Gastronomia delegam ao mesmo contrato e compartilham a raiz de cache.
- A camada visual duplicada do checkout foi consolidada em `checkout/CheckoutSections.tsx`; `GastronomyCheckoutPage` e `GastronomyCheckoutSheet` agora compartilham selecao de atendimento, itens, pagamento, campos estruturados de endereco, observacoes e resumo financeiro, preservando ids acessiveis especificos de cada superficie.
- A implementacao duplicada de `src/modules/business/gastronomy/services/gastronomy.queries.ts` foi removida; o modulo agora reexporta `src/core/business/services/gastronomy.queries.ts`, que tambem recebeu a compatibilidade segura para chamadas antigas por `profiles.id`.
- Tracking, fila, detalhe de pedido e widget de plano deixaram de prometer motoboy quando o fluxo v1 esta em frota propria/manual; a copy agora fala em entrega manual, responsavel pela entrega e rastreamento vinculado apenas quando existir SSOT de entrega.
- A rota publica `/gastronomia/pedidos/:orderId` foi movida para antes das rotas territoriais dinamicas de Gastronomia em `AppLayoutRoutes`, evitando que `pedidos` fosse interpretado como UF e o detalhe publico renderizasse `main` vazio no E2E operacional.
- As rotas privadas de Gastronomia na Central foram aninhadas em `CentralRoutes`; a rota profunda `/central/empresas/:businessId/gastronomia/pedidos/:orderId` deixou de cair no dashboard base e voltou a renderizar `OrderDetailsPage` com as acoes da loja.
- A configuracao operacional de entrega deixou de permitir rede da plataforma no v1: `OperationConfigForm` salva `uses_platform_delivery: false`, trata entrega como frota propria/manual e desabilita o controle de rede da plataforma.
- O dashboard operacional, o widget de plano e o card de acoes rapidas deixaram de exibir CTAs/beneficios para Entregas avancadas, Analytics e Promocoes enquanto essas rotas permanecem pausadas em `centralLazyImports.ts`.
- `GastronomyCheckoutService` passou a validar carrinho vazio antes de consultar area de entrega, bloquear metodo de pagamento fora dos metodos aceitos pelo perfil gastronomico e impedir `platform_courier` tambem em chamadas diretas ao SSOT de checkout.
- A validacao de area de entrega foi centralizada no `GastronomyCheckoutService`; `useGastronomyCheckout` agora apenas resolve o endereco e delega a elegibilidade ao SSOT, evitando duas chamadas Supabase por checkout delivery.
- Foi adicionada cobertura mobile publica para `/gastronomia/ba/salvador` em 360px, validando renderizacao e ausencia de overflow horizontal pelo helper E2E existente.
- Foi adicionada cobertura mobile autenticada para o dashboard da Gastronomia em 360px dentro do E2E operacional.
- Foi adicionada cobertura axe E2E para a landing publica mobile de Gastronomia, bloqueando violacoes `serious`/`critical` em `main`; a correcao incluiu labels em controles icon-only, label no select mobile de ordenacao, carrossel de atividade focavel com semantica de lista e contraste suficiente no CTA primario do hero.

## Revalidacao G6 — 2026-09-04

- Historico de migrations local/remoto revalidado pela API canônica do Supabase: **498 migrations remotas = 498 arquivos locais**, com zero versao remota sem arquivo, zero arquivo local sem versao remota e zero divergencia de nome.
- A antiga pendencia alta de drift historico, registrada em 2026-07-04, esta portanto encerrada. Nao executar `migration repair` ou `db push` para reproduzir o estado antigo.
- Foi identificado drift de autorizacao nas policies de `gastronomy_profiles`, `menus`, `menu_categories`, `menu_items`, variants, addons, availability, promotions e historico de niche: ainda aceitavam apenas `profiles.user_id = auth.uid()`.
- A migration `20260904232530_align_gastronomy_profile_management_authority_g6.sql` foi aplicada ao projeto canônico e alinhou as nove policies a `private.can_manage_profile(profile_id)`, a mesma autoridade de Business: dono direto ou membership ativa `owner/admin`.
- Public read policies e grants por coluna de `gastronomy_profiles` foram preservados; nenhuma permissao ampla nova foi criada.
- O probe versionado `tests/security/gastronomy-management-authority-remote-probe.sql` passou contra o ambiente canônico em transacao `BEGIN/ROLLBACK`: sem membership, UPDATE=0; com membership `admin` temporaria, o mesmo usuario tecnico administrou profile/menu/category/item; `washingtonmsdj` foi explicitamente excluido.
- A version da migration registrada remotamente e o filename local estao reconciliados em `20260904232530`.

## Pendencias antes do lancamento

### Critico

- Nenhuma pendencia critica conhecida no fluxo v1 de pedido online apos a revalidacao G6 atual. O modulo ainda nao deve ser marcado `READY` ate a prova operacional/hosted same-SHA.

### Alto

- Nenhuma pendencia alta conhecida de schema/RLS/migration no checkpoint de 2026-09-04. O drift historico citado na auditoria de julho foi reconciliado e o contrato de gestao profile/menu foi alinhado a autoridade canônica de Business.

### Medio

- Revisar periodicamente documentacao remanescente quando novos fluxos forem ativados; os docs legados com linguagem de modulo completo/AAA foram removidos ou normalizados nesta auditoria.
- Expandir axe para checkout, detalhe, carrinho, pedidos e painel do lojista; a landing publica mobile e o dashboard mobile da loja ja tem cobertura automatizada inicial.
- Validar o JSON-LD de restaurante/cardapio ja adicionado em `GastronomyDetailPage` e manter `noindex` em checkout, favoritos e areas privadas.
- Confirmar em banco/territorio real se a listagem publica sem destino retorna volume esperado de restaurantes tambem no desktop; no host atual a UX carregou, mas o dataset visivel variou entre execucoes.
- A tabela `business_favorites`, vazia e sem dependencias na pre-auditoria remota, foi removida sem `CASCADE` pela migration `20260714123000`.

### Baixo

- Continuar varredura de componentes especificos de dashboard/menu para separar contrato publico de componentes internos.
- Normalizar encoding de documentos antigos com caracteres corrompidos.
