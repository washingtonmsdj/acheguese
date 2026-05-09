# Status Atual do Projeto

Data: 2026-05-08
Branch: main
Ultimo commit base: 0c8701a `Consolida moderacao admin em fila unica e audit log trust`

## Validacoes Recentes

- `npm run lint`: passou em 2026-05-07.
- `npm run typecheck`: passou em 2026-05-07.
- `npm run build`: passou em 2026-05-07.
- `npm run validate:architecture:delivery`: passou em 2026-05-06.
- `npm run validate:architecture:community`: passou em 2026-05-06.
- `npm run validate:taxonomy`: passou em 2026-05-06.
- `npm test -- src/modules/business/gastronomy/__tests__/GastronomyOperationalSSOT.test.ts`: passou em 2026-05-06.
- `npm test -- src/core/professional/__tests__/ProfessionalLeadSSOT.test.ts`: passou em 2026-05-06.
- Smoke Playwright Chromium em rotas publicas principais: passou em 2026-05-06.
- Smoke Playwright Chromium de servicos/profissionais em `tests/e2e/professional-operational.spec.ts`: passou em 2026-05-06 contra servidor isolado `127.0.0.1:8090`.
- Smoke Playwright Chromium de onboarding publico em `tests/e2e/onboarding-public.spec.ts`: passou em 2026-05-06 contra servidor isolado `127.0.0.1:8106`.
- Smoke Playwright Chromium de paginas institucionais em `tests/e2e/institutional-public.spec.ts`: passou em 2026-05-06 contra servidor isolado `127.0.0.1:8107`.
- Navegador embutido em `http://localhost:8080/cadastro`: validado em 2026-05-06 com `#main-content` unico, marca `Achegue-se`, heading `Crie sua conta` e sem erros de console.
- Navegador embutido em `http://127.0.0.1:8080/`: revalidado em 2026-05-07 com landing carregando normalmente (`Entrar no Meu Bairro` e `Cadastrar meu negocio` visiveis) apos hardening de auth/session no frontend.
- Governanca de docs: `git diff --check` passou em 2026-05-06; avisos restantes sao apenas LF/CRLF do Windows.
- `npm test -- src/app/components/__tests__/Breadcrumbs.spec.tsx`: passou em 2026-05-06.
- `npm test -- src/modules/business/premium/pages/PremiumBusinessCheckoutPage.spec.tsx`: passou em 2026-05-07.
- `npm test -- src/integrations/supabase/__tests__/supabaseConfig.spec.ts`: passou em 2026-05-07.
- `npx vitest --run src/core/routing/seo/__tests__/buildTerritorialMetadata.spec.ts`: passou em 2026-05-07.
- `npx playwright test tests/e2e/landing-public.spec.ts --project=chromium --reporter=list`: passou em 2026-05-07.
- `npx playwright test tests/e2e/landing-public.spec.ts`: passou em 2026-05-08 com `5/5`, cobrindo cidade, bairro, area, modulos publicos e comunidade territorial canonica.
- `npm test -- src/core/routing/seo/__tests__/buildTerritorialMetadata.spec.ts`: passou em 2026-05-07 com 4 testes.
- `npx playwright test tests/e2e/professional-operational.spec.ts --project=chromium --reporter=list`: passou em 2026-05-07 com 2 testes.
- `npx playwright test tests/e2e/gastronomy-operational.spec.ts --reporter=list`: passou em 2026-05-08 com `4/4`, cobrindo fluxo autenticado cliente->loja (pedido ate estado terminal) e acesso operacional do motoboy.
- `npx playwright test tests/e2e/professional-operational.spec.ts --reporter=list`: passou em 2026-05-08 com `2/2`.
- `npx playwright test tests/e2e/professional-leads-operational.spec.ts --reporter=list`: passou em 2026-05-08 com `1/1`, cobrindo fluxo autenticado `lead -> proposta -> aceite -> atendimento` e validacao da Central Profissional.
- `npx playwright test tests/e2e/landing-public.spec.ts -g "complexo short route resolves" --reporter=list`: passou em 2026-05-08 com `1/1`, validando alias curto `/complexo` redirecionando para rota canonica territorial.
- `npx playwright test tests/e2e/professional-leads-operational.spec.ts --reporter=list`: reexecutado em 2026-05-08 com `1/1` verde apos hardening de ambiente E2E.
- `npx playwright test tests/e2e/professional-leads-operational.spec.ts --reporter=list`: passou em 2026-05-08 com `1/1` apos incluir assert de dados reais de `professional_data` (raio, areas e disponibilidade) na Central Profissional.
- `npx playwright test tests/e2e/professional-leads-operational.spec.ts --reporter=list`: revalidado em 2026-05-08 com `1/1` apos hardening do bloco operacional da Central Profissional e persistencia de avaliacao pos-servico.
- `npm run typecheck`: passou em 2026-05-08 apos limpeza SSOT de comunidade/grupos.
- `npm run lint`: passou em 2026-05-08 apos limpeza SSOT de comunidade/grupos.
- `npm run build`: passou em 2026-05-08 apos limpeza SSOT de comunidade/grupos.
- `npm run typecheck`: passou em 2026-05-08 apos integracoes reais de comentarios/contestacao/moderacao na comunidade.
- `npm run lint`: passou em 2026-05-08 apos integracoes reais de comentarios/contestacao/moderacao na comunidade.
- `npm run build`: passou em 2026-05-08 apos integracoes reais de comentarios/contestacao/moderacao na comunidade.
- `npm run typecheck`: passou em 2026-05-08 apos hardening de rotas canonicas da comunidade (city/district/area) via helper SSOT.
- `npm run lint`: passou em 2026-05-08 apos hardening de rotas canonicas da comunidade (city/district/area) via helper SSOT.
- `npm run build`: passou em 2026-05-08 apos hardening de rotas canonicas da comunidade (city/district/area) via helper SSOT.

- `npx playwright test tests/e2e/community-territorial-operational.spec.ts --project=chromium --reporter=list`: passou em 2026-05-08 com `3/3`, cobrindo comunidade territorial em cidade, bairro e area (`feed/grupos`) sem lock no suspense global.
- `npm run typecheck`: passou em 2026-05-08 apos limpeza final de hardcodes de rota da comunidade (widgets/perfil/achados/recomendacoes).
- `npm run lint`: passou em 2026-05-08 apos limpeza final de hardcodes de rota da comunidade (widgets/perfil/achados/recomendacoes).
- `npm run build`: passou em 2026-05-08 apos limpeza final de hardcodes de rota da comunidade (widgets/perfil/achados/recomendacoes).
- `npm run generate:sitemap`: passou em 2026-05-08 com escrita real de `public/sitemap.xml` via Supabase (`locations=134`, `groups=1`).
- `npx playwright test tests/e2e/community-territorial-operational.spec.ts --project=chromium --reporter=list`: revalidado em 2026-05-08 com `3/3` verde apos hardening de prontidao territorial.
- `npm test -- src/core/routing/seo/__tests__/TerritorialSEO.spec.ts`: passou em 2026-05-08 com `3/3`, blindando politica canonical/noindex de rotas comunitarias duplicadas vs rotas sociais proprias.
- `npm run lint`: passou em 2026-05-08 sem warnings apos extrair policy de SEO territorial para util dedicado.
- `npx playwright test tests/e2e/territorial-seo.spec.ts --project=chromium --reporter=list`: passou em 2026-05-08 com `3/3`, validando indexabilidade de rotas territoriais publicas/sociais e politica obrigatoria de `noindex + canonical publico` nas rotas comunitarias duplicadas de modulo.
- `npx playwright test tests/e2e/territorial-seo.spec.ts --project=chromium --reporter=list`: ampliado e revalidado em 2026-05-08 com `4/4` (publico indexavel + duplicacoes comunitarias `empresas/servicos/classificados` com `noindex`, incluindo canonical publico validado em classificado).
- `npx playwright test tests/e2e/territorial-seo.spec.ts --project=chromium --reporter=list`: ampliado novamente em 2026-05-08 com `6/6`, cobrindo duplicacoes comunitarias `servicos`, `classificados`, `vagas`, `eventos` e `mobilidade` com politica `noindex` (e canonical publico validado em `classificados`) sem regressao de rota publica indexavel.
- `npx playwright test tests/e2e/community-social-seo.spec.ts --project=chromium --reporter=list`: passou em 2026-05-08 com `2/2`, cobrindo rotas sociais da comunidade (`feed` e `grupos`) sem forcar `noindex` e mantendo canonical proprio (quando presente no head).
- `npm run test:e2e:seo`: passou em 2026-05-08 com `8/8`, consolidando regressao SEO territorial/comunidade em comando unico (`territorial-seo.spec.ts` + `community-social-seo.spec.ts`).
- `npm run validate:seo:phase`: passou em 2026-05-08 (`typecheck + lint + test:e2e:seo`), virando gate operacional da etapa SEO.
- `npm run validate:operations:phase`: passou em 2026-05-08 (`typecheck + lint + test:e2e:operations`) com `35/35` nos cenarios operacionais de central/mobilidade, gastronomia e profissionais.
- `npm run validate:phase:core`: passou em 2026-05-08, consolidando gate unico de release tecnica interna (`typecheck` + `lint` + `test:e2e:phase-core`).
- CI SSOT atualizado em 2026-05-08: `.github/workflows/ssot-tests.yml` agora exige `npm run validate:phase:core` no status final do workflow.
- `npm run validate:phase:core`: reexecutado em 2026-05-08 apos consolidar o gate em uma unica partida Playwright; passou com `46/46` E2E (`SEO + comunidade territorial + central/mobilidade + gastronomia + profissionais`).
- `npm run validate:phase:core`: reexecutado novamente em 2026-05-08 apos limpar warnings transit�rios de reconexao/OSRM e estabilizar o E2E do motoboy; passou com `46/46` E2E.
## Modulos/Fases Concluidos

- Fase 0: Preparacao e baseline.
- Fase 1: Arquitetura, taxonomia e rotas canonicas.
- Fase 2: Mobilidade, motorista e motoboy.

## Fase Atual

Fase 3: Gastronomia e delivery integrado.

Plano mestre de execucao por fases: `docs/PLANO_MESTRE_EXECUCAO_INTEGRAL_SSOT.md`.

### Concluido Na Fase 3

- Pedido de gastronomia cria `orders` SSOT e entrega motoboy vinculada por `order.id`.
- `OrderDeliveryLinkService` sincroniza status de `ride_requests` para `orders.logistics_status`.
- Loja lista pedidos via `OrderService`/`OrderDeliverySSOTService`, sem depender de colunas legadas.
- Detalhe do pedido exibe timeline, tracking, comprovante de entrega e dados do snapshot operacional.
- `OrderDeliveryNotificationService` cria notificacoes para cliente, loja e motoboy.
- `confirm()` nativo removido dos fluxos destrutivos de gastronomia auditados.
- Billing legado de gastronomia arquivado em `billing/legacy`.
- Nichos beta ficam fora da experiencia publica.
- Painel operacional da loja adicionado ao detalhe do pedido para aceitar, preparar, marcar pronto, despachar/entregar e cancelar com motivo.
- SSOT de confianca operacional iniciado em `core/trust` com `trust_events`, feedback privado da loja sobre cliente/motoboy e fila admin de eventos.
- Cancelamento tardio solicitado pelo cliente em pedido ja em preparo/pronto/saiu para entrega passa a gerar evento privado para analise admin.
- Cliente/passageiro pode registrar feedback privado sobre motorista/motoboy no historico de mobilidade.
- Motorista/motoboy pode registrar feedback privado sobre passageiro/cliente e, em entregas de gastronomia vinculadas a pedido, sobre a loja.
- `TrustPolicyService` calcula score operacional por persona, reincidencia 30/90 dias, risco e politica de despacho.
- Admin visualiza perfis em atencao com score, reincidencia e acao recomendada na fila de confianca.
- Mobilidade/entregas bloqueiam novos chamados para cliente, motorista ou motoboy em risco critico ate revisao admin.
- Acoes administrativas formais de confianca foram criadas em `trust_admin_actions`: aviso, restricao temporaria e desbloqueio com auditoria.
- Mobilidade aplica impacto graduado em prioridade para `watchlist`/`restricted`, sem bloqueio automatico fora de risco critico.
- Cliente agora abre o detalhe publico do pedido por `/gastronomia/pedidos/:orderId`, recebe link na notificacao e avalia a loja no pos-entrega via `ReviewQueryService`; notas baixas tambem geram evento privado no SSOT `core/trust`.
- Checkout premium de gastronomia foi corrigido para conduzir o cliente ao detalhe canonico do pedido criado (`/gastronomia/pedidos/:orderId`) em vez de devolve-lo ao carrinho apos a confirmacao; a navegacao ficou blindada por `PremiumBusinessCheckoutPage.spec.tsx`.
- Auth/session do frontend foi endurecido em dev: o storage key do Supabase deixou de usar o lock generico `token`, o bootstrap inicial ganhou fallback explicito via `getSession()` no `SessionService`, e o aviso esperado de storage em dev saiu do nivel `warn`, reduzindo colisao de lock e falso timeout de bootstrap.
- Dashboard de gastronomia passou a exibir status operacional, pedidos do dia, resumo de cardapio e areas de entrega por hooks/servicos canonicos, removendo contadores fixos enganosos.
- `OperationConfigForm` foi realinhado ao contrato canonico de `useOperationConfig` (`updateConfig`/`isUpdating`) para pausa de loja e ajuste de tempo.
- Gestao de cardapio agora expoe disponibilidade, estoque atual, alerta de estoque baixo e acao rapida "marcar esgotado" usando `MenuService`/`useMenuItems` como SSOT.
- Playwright operacional de gastronomia criado em `tests/e2e/gastronomy-operational.spec.ts`; ele valida a tela autenticada de cardapio quando `E2E_GASTRONOMY_BUSINESS_ID` aponta para loja real com cardapio configurado.
- Playwright operacional de gastronomia foi fortalecido com bootstrap automatico de loja E2E (perfil business, membership, `business_data` e seed minimo de `menus/menu_categories/menu_items`), eliminando dependencia de `E2E_GASTRONOMY_BUSINESS_ID` manual e validando rotas autenticadas de cardapio/dashboard em ambiente local.
- Suite `tests/e2e/gastronomy-operational.spec.ts` foi expandida para incluir fluxo autenticado cliente+loja no mesmo pedido (rota publica `/gastronomia/pedidos/:orderId` e rota operacional `/central/empresas/:businessId/gastronomia/pedidos/:orderId`).
- Suite `tests/e2e/gastronomy-operational.spec.ts` agora roda sem skip (`4 passed`): bootstrap automatico de identidade+empresa+cardapio, login resiliente, validacao de cardapio/dashboard, fluxo autenticado cliente+loja com pedido fixture via RPC e cobertura canônica da Central do Motoboy em `/central/motoboy/entregas` (operacao ativa ou onboarding guardado).
- Suite `tests/e2e/gastronomy-operational.spec.ts` foi reexecutada em 2026-05-08 com `4/4` verde (`--reporter=list`) mantendo cobertura ponta a ponta autenticada sem regressao.
- Fluxo operacional da loja no E2E foi endurecido para progressao de estado ate terminal no detalhe do pedido (`aceitar -> preparar -> pronto -> saiu/retirado -> entregue`), com assert final de encerramento operacional sem acao pendente.
- O mesmo E2E agora valida a transicao para a rota publica do pedido apos entrega, garantindo que o cliente ve o detalhe/timeline e que o painel interno `Operacao da loja` nao aparece fora da Central.
- Onboarding de motoboy na Central foi alinhado para rota canonica de cadastro (`/central/motoboy/cadastro`) nos empty states/guards auditados, e o E2E valida clique deterministico do CTA `Cadastrar como Motoboy` na area principal com navegacao correta.
- CTAs restantes de onboarding de mobilidade na Central/Perfil foram migrados de `/create-driver` para rotas canonicas da Central (`/central/motorista/cadastro` e `/central/motoboy/cadastro`), com varredura de TSX nesses modulos sem referencias residuais ao caminho legado.
- Rota legada `/create-driver` foi removida do runtime canônico (rotas e sincronização de contexto) e o `src` não possui mais referência ativa a esse caminho.
- Blindagem anti-regressão adicionada em `src/modules/mobility/__tests__/MobilityCanonicalOnboardingRoutes.test.ts`, validando que `/create-driver` não reaparece no runtime e que CTAs críticos permanecem nas rotas canônicas da Central.
- Documentação técnica viva da Central/Mobilidade foi alinhada ao estado atual (sem `/create-driver` operacional) em guias e relatórios internos auditados.
- Suíte E2E da Central (`tests/e2e/central/central-validation.spec.ts`) foi revalidada com cenário de compatibilidade legado explícito e está 100% verde (`28 passed`), cobrindo rotas principais, subrotas de mobilidade, regras de acesso e UX básica.
- Sincronizacao de status pedido->entrega foi blindada com teste unitario dedicado em `src/modules/mobility/delivery/__tests__/OrderDeliveryLinkService.spec.ts`, cobrindo mapeamentos canonicos e regras de transicao (avanço progressivo, bloqueio de reversao e terminais, cancelamento/falha direta).
- Smoke de contrato SSOT `GastronomyOperationalSSOT.test.ts` cobre rota publica do pedido, notificacao com link, review publico + trust privado, guard de operacoes da loja, dashboard sem contadores falsos e operacao de estoque/disponibilidade do cardapio.
- Funil SSOT de profissionais foi destravado no banco com migrations pendentes (`20260506100000_create_professional_leads.sql`) e ajuste de RLS em `professional_service_engagements` (`20260508120000_fix_professional_engagement_insert_rls.sql`), eliminando falha de trigger no aceite da proposta.
- Rota canonica `/central/profissional` foi corrigida em `AppRoutes` para renderizar `CentralProfissionalPage` via filho `index`, removendo estado em branco apenas com menu/lateral.
- E2E autenticado de profissionais `tests/e2e/professional-leads-operational.spec.ts` ficou verde (`1 passed`) com bootstrap de perfil profissional, fixture de lead/proposta/aceite e validacao de tracking + Central.
- `ReviewsService` (mutations SSOT) foi corrigido para `*_reviews_new`: removeu envio de colunas inexistentes (`job_type` e payload arbitrario), padronizando insert/update apenas com campos reais da tabela; isso destravou a avaliacao pos-servico no fluxo profissional.
- E2E autenticado de profissionais foi expandido para validar tambem submissao de avaliacao no tracking e persistencia real em `professional_reviews_new`, com polling robusto para estados de carregamento da Central.
- `ProfessionalGuard` foi reforcado para revalidar perfis via `SessionService.getUserProfiles` (consulta backend) antes do empty-state, reduzindo falso negativo de contexto de sessao.
- E2E `professional-leads-operational.spec.ts` foi estabilizado para cenarios reais da Central Profissional (painel completo, estado sem servico publicado e fallback de cadastro), mantendo validacao de tracking+avaliacao persistida.
- Central Profissional deixou de ser placeholder: `/central/profissional` agora usa `ProfessionalFacade` para listar servicos do perfil, disponibilidade, metricas, avaliacao e acoes de edicao/visualizacao.
- Servicos/Profissionais ganhou funil canonico de orcamento em `core/professional`: `professional_leads`, `professional_lead_messages`, `professional_lead_quotes`, `professional_service_engagements`, eventos de historico, RLS, notificacao transacional, CTA no perfil publico/legado, acompanhamento do cliente e atualizacao de status pela Central.
- Central Profissional agora mostra pedidos de orcamento recebidos pelo `ProfessionalLeadService`, com resposta ao cliente, proposta estruturada de valor/prazo/escopo, aceite convertido automaticamente em atendimento contratado e acoes de contatado/orcamento enviado/concluido/arquivado, sem acesso direto de UI a tabelas.
- O aceite de proposta profissional agora gera `professional_service_engagements` por trigger SQL, com RLS de participantes, painel de atendimentos contratados na Central e painel de acompanhamento para o cliente.
- Avaliacao de profissional pos-servico agora passa por `ProfessionalLeadService.submitEngagementReview`: somente o cliente do `professional_service_engagements` concluido consegue avaliar pelo `ReviewsService`.
- Vitrine publica de servicos agora expoe `main#main-content`, mantendo o skip-link global funcional e cobrindo a rota publica no smoke E2E profissional.
- Onboarding publico de cadastro e confirmacao agora usa a marca `Achegue-se`, expoe `main#main-content` e possui smoke Playwright dedicado para evitar regressao na porta de entrada do usuario.
- Paginas institucionais publicas (`/sobre`, `/contato`, `/termos`, `/privacidade`) foram alinhadas a marca `Achegue-se`, expoem `main#main-content` e possuem smoke Playwright dedicado.
- Documentacao viva realinhada: `STATUS.md` e `VALIDACAO_FINAL_E_PROXIMOS_PASSOS.md` agora sao redirecionamentos historicos; `README`, `INDEX`, `DOCUMENTATION_INDEX`, `INDEX_CANONICO`, `DOCUMENT_REPLACEMENTS` e `AUDITORIA_DOCS_OBSOLETOS` apontam para `STATUS_ATUAL.md` e para o plano executavel como SSOT.
- Rota historica com typo `businesss` foi canonicalizada: `/businesss` redireciona para `/empresas`, `/businesss/:id/catalogo` para `/empresas/:id/catalogo`, `/admin/businesss` para `/admin/empresas`, e o breadcrumb usa apenas `empresas` como rota canonica.
- Comunidade e offline cache deixaram de usar `confirm()` nativo nos fluxos auditados de exclusao de post/comentario e limpeza de cache; a confirmacao agora usa `ConfirmActionDialog` do design system, mantendo hooks/servicos sem responsabilidade de UI.
- Feed de comunidade (core/modulo) deixou de ter handlers no-op para curtir/salvar/compartilhar/denunciar: as acoes agora disparam `usePostActions` (`likePost`, `savePost`, `sharePost`, `reportPost`) no SSOT de posts/moderacao.
- Comentarios do feed agora possuem edicao inline funcional no `CommentItem` (salvar/cancelar, persistencia via `commentService.updateComment` e marcador `(editado)` em tempo real), removendo placeholder de "edicao em desenvolvimento".
- Criacao de post no caminho legado/canonico foi alinhada ao SSOT territorial: `useCreatePost` agora resolve `locationId/location_id` de forma obrigatoria e `PostsFacade.mutations.createPost` persiste `reach` no insert.
- Detalhe de classificado deixou de exibir metrica fake de visualizacoes (`Math.random`), removendo dado artificial da UI e mantendo consistencia com SSOT.
- Detalhe de classificado passou a persistir favorito por anuncio em `localStorage` (estado consistente entre sessoes) e o compartilhamento ganhou fallback resiliente quando `navigator.share`/clipboard falham.
- Classificados ganhou comentarios/perguntas publicas no detalhe do anuncio (`classified_comments`): listagem cronologica, envio autenticado, exclusao pelo autor e RLS dedicado por migration.
- Classificados passou a preservar `status` real no mapper SSOT e o dono do anuncio pode pausar, reativar ou marcar como vendido no detalhe usando `updateClassified`, `reactivateClassified` e `markAsSold`.
- Card do vendedor no detalhe do classificado deixou de exibir avaliacao/selo fake; agora mostra anuncios ativos e, quando existir dado real de review, exibe nota/media real do vendedor via `getReviewStats`.
- Classificados agora tem feedback privado bilateral pos-negocio no detalhe do anuncio: vendedor avalia compradores reais (participantes de conversa) e comprador avalia vendedor apenas quando participou de conversa do anuncio vendido, via `ClassifiedTrustFeedbackPanel` + `ClassifiedTrustService` + `MessagingService.getClassifiedConversationParticipants`.
- Fila admin de confianca operacional foi ampliada com filtros por contexto (pedido, corrida, entrega, classificado, servico, comunidade), contadores por tipo, selecao multipla e acoes em lote (under_review/confirmed/penalized + aviso/restricao temporaria/desbloqueio) mantendo auditoria no SSOT `core/trust`.
- Comentarios/perguntas de classificados agora permitem denuncia privada direto do frontend, gerando `trust_events` do tipo incidente (`reason_code=classified_comment_report`) com evidencia contextual para moderacao admin; a fila de confianca passou a destacar o comentario denunciado no card do evento.
- UX de denuncia de comentarios de classificados foi profissionalizada: dialog dedicado com motivo, detalhes opcionais, estado de envio e bloqueio de fechamento durante submissao; fila admin ganhou filtro rapido `Apenas pendentes` para triagem operacional.
- Fila admin agora exibe contexto operacional do comentario denunciado (id curto, autor, data e preview do conteudo quando disponivel em evidencia), reduzindo decisao cega na moderacao.
- Fila admin ganhou CTA rapido para abrir o anuncio relacionado diretamente do evento de classificado (`/classificados/:id`) em nova aba, acelerando verificacao do contexto real.
- Fluxo admin de moderacao de comentarios de classificados foi profissionalizado com dupla navegacao contextual no card: abrir anuncio publico e abrir fila admin de denuncias (`/admin/classificados/denuncias`) quando o motivo for denuncia de comentario.
- Denuncia de comentario em classificado agora tem anti-duplicidade por ator/comentario no SSOT (`trust_events` ativos/em analise) e feedback visual no frontend de "denuncia enviada por voce", evitando spam de denuncia repetida.
- Fila admin de confianca ganhou triagem dedicada para este fluxo: contador de denuncias de comentarios abertas e filtro rapido `Apenas denuncias de comentario`, combinavel com `Apenas pendentes`.
- Fila admin recebeu barra de decisao rapida fixa no topo quando ha selecao em lote, acelerando operacoes de moderacao (em analise, confirmar, penalizar e aviso) sem perder as acoes completas detalhadas abaixo.
- Redundancia da moderacao em lote removida: a barra fixa virou ponto unico de comando (analise, confirmar, penalizar, aviso, restricao 7/30d e desbloqueio), simplificando UX admin sem perda de capacidade.
- Acoes destrutivas em lote da fila admin agora exigem confirmacao explicita via `ConfirmActionDialog` (penalizar, restringir 7/30 dias e desbloquear), com controle de estado pendente e sem `confirm()` nativo.
- SEO territorial das landings canonicas foi corrigido no SSOT: hubs de bairro/grupo agora usam titulo editorial (`Territorio | Achegue-se`) e modulos seguem com titulo operacional; a regra ficou blindada por `src/core/routing/seo/__tests__/buildTerritorialMetadata.spec.ts`.
- Rota publica curta `/complexo` foi revalidada end-to-end contra a landing canonica `/ba/salvador/area/complexo-do-nordeste-de-amaralina`, sem erro territorial e com metadados corretos.
- SEO territorial dos modulos publicos foi corrigido para rotas com prefixo (`/empresas/...`, `/servicos/...`): o parser agora extrai `Salvador` corretamente, em vez de tratar `ba` como cidade.
- Landings raiz `/empresas` e `/servicos` ganharam Helmet proprio e foram cobertas no smoke publico; a suite tambem valida titulos territoriais finais para empresas e servicos no Complexo.
- Smoke de profissionais/servicos removeu espera fixa por tempo e passou a validar saida real do loader global por polling.
- Decisao de produto/arquitetura para roteamento territorial registrada em `docs/DECISAO_ROTEAMENTO_TERRITORIAL.md`: cidade/site geral, modulos publicos e comunidade local agora possuem papeis distintos documentados.
- Roteamento territorial v2 aplicado: grupos territoriais usam `/area/:groupSlug` no site publico, modulos, comunidade, helpers, SEO e sitemap.
- Ambiente Playwright ficou deterministico no SSOT: `PLAYWRIGHT_BASE_URL` padrao em `http://127.0.0.1:8099` e `webServer.reuseExistingServer=false` para evitar suite rodar contra servidor stale/manual em dev.
- Central Profissional agora exibe bloco operacional com campos reais de `professional_data` (raio de atendimento, areas e disponibilidade), sem placeholder; E2E autenticado foi atualizado para validar esses dados no fluxo `lead -> proposta -> aceite -> atendimento -> avaliacao`.
- Avaliacao pos-servico profissional esta protegida por regra de backend no SSOT (`ProfessionalLeadService.submitEngagementReview`): apenas cliente do atendimento concluido pode avaliar; o E2E autenticado valida envio e persistencia real em `professional_reviews_new`.
- Moderacao de comentarios/perguntas de classificados foi consolidada na mesma trilha administrativa de confianca: `/admin/classificados/denuncias` agora usa `TrustEventsQueue` com filtro travado em `trust_events` de contexto `classified` + `reason_code` de comentario, removendo fila operacional paralela para esse fluxo.
- Admin/Moderacao foi consolidado em fila unica SSOT: `AdminModeracao` e `AdminModeracaoCompleta` agora usam `TrustEventsQueue` + audit log real de `trust_admin_actions` (via `TrustEventService.listAdminActions`), removendo dependencias legadas de trilhas sem fonte canonica de dados.
- Comunidade/Grupos removeu fallback mock em runtime no SSOT: `CommunityService.getGroups/getGroupsPage`, `GroupService.getGroupById/getGroupMembers` e `SocialInteractionsService` (mensagens/denuncias de grupo) agora operam somente com persistencia real, retornando estado vazio controlado em erro/ausencia de dados.
- Comunidade removeu TODOs funcionais criticos: `PostDetailModal` envia comentario real via `commentService`; `useUnifiedDetailModal` cria comentario/upvote real em `CivicReportService`; `DisputeMentionModal` gera `trust_events` reais para moderacao; `useDirectMessages.reportConversation` registra incidente em `TrustEventService` e bloqueia conversa de forma auditavel.
- `LocationFilter` foi alinhado ao perfil ativo do SSOT (`useSessionContext`), removendo dependencia de `user_metadata` legado para cidade/bairro/rua.
- Hooks legados duplicados em `modules/community` foram consolidados para SSOT por re-export canônico (`useGrupos` e `useComunidadePage`), removendo divergência funcional entre `core` e `modules`.
- `createReplyNotification` em `communityBusinessLogic` foi implementado com fluxo real: busca comentário pai via `commentService`, evita auto-notificação e cria notificação de resposta para o autor original.
- Edicao de post da comunidade foi concluida no fluxo real (sem placeholder): `handleEditPost` abre `CreatePostModal` em modo edicao com dados iniciais do post, e o submit persiste via `postService.updatePost`.
- `CreatePostModal` agora suporta modo criacao/edicao no mesmo SSOT, com estado inicial (`content/type/reach`) e CTA/contexto visual especifico para salvar alteracoes.
- `npm run typecheck`, `npx eslint` pontual nos arquivos alterados e `npm run build` passaram em 2026-05-08 apos entrega da edicao de post.
- Navegacao de abas em `ComunidadePage` deixou de montar URL manual por regex e passou a usar helper canonico (`buildCommunityTabUrlFromPath`), cobrindo cidade, bairro e grupo em `/area/:groupSlug`.
- `useCommunityUrls` (core/routing e core/community) foi alinhado ao SSOT territorial para `groups`, usando rota contextual `${feed}/grupos` em vez de caminhos soltos/fora de contexto.
- Sitemap dinamico foi fechado no SSOT de roteamento territorial: `generateAndSaveSitemap` agora consulta Supabase (`locations` + `territorial_groups` + membros), gera URLs can�nicas de cidade/bairro/area + m�dulos/comunidade e persiste em `public/sitemap.xml` via script `npm run generate:sitemap`.
- Runtime compartilhado para script/SPA foi endurecido sem gambiarra: `logger` e bootstrap `supabase` ficaram compat�veis com ambiente Node (`process.env`) e Vite (`import.meta.env`) sem quebrar frontend.
- Regra de SEO territorial virou SSOT isolado em `src/core/routing/seo/territorialSeoPolicy.ts`: rotas `/comunidade/.../:modulo-publico` recebem `noindex, follow` + canonical da rota publica equivalente; rotas sociais proprias (`feed/grupos`) mantem `index, follow`.
- `TerritorialLayout` ganhou `TerritorialFallbackSEO` para manter emissao minima de `robots/canonical` quando a resolucao territorial entra em fallback de erro, sem quebrar renderizacao das paginas.
- `CommunityTerritorialShell` passou a emitir fallback de `canonical/robots` via `territorialSeoPolicy` no shell, reforcando consistencia SEO durante transicoes/hidratacao das rotas comunitarias.
- Suite E2E operacional da Central foi endurecida com `goto` resiliente (`waitUntil=commit`, retry curto) e validacao de conteudo via polling de landmarks/texto em vez de `networkidle`, eliminando flakiness de bootstrap no ambiente local.
- Cen�rio operacional do motoboy em gastronomia foi estabilizado para aceitar prontidao real de layout (`main/header/texto`) sem falso negativo de elemento oculto em transicao de UI.
- Comunidade territorial entrou no gate de fase: `npm run validate:community:phase` cobre cidade, bairro e grupo territorial (`/area/:groupSlug`) via Playwright e agora compoe `npm run validate:phase:core`.
- Rotas de comunidade em nivel cidade foram alinhadas ao `CommunityTerritorialShell`: `/comunidade/:state/:city`, `/feed`, `/grupos`, `/alertas` e `/problemas` usam o cockpit social can�nico em vez de cair no layout territorial generico.
- Geolocalizacao publica deixou de tratar permissao negada pelo usuario como `warn` no console; o estado esperado agora e log informativo, mantendo warnings para falhas inesperadas.
- Gate core foi consolidado em uma unica execucao Playwright (`npm run test:e2e:phase-core`) para evitar multiplas partidas frias do Vite no mesmo comando de release.
- ReconnectionManager deixou de emitir `warn` para estados transit�rios esperados de stale/lost connection; erros reais e limite de reconexao seguem como erro/warning.
- Validacao do OSRM publico em dev deixou de emitir `warn` quando o provider externo esta indisponivel; em producao a indisponibilidade continua como warning.

## P0 Abertos

- Servicos/Profissionais: validar Central Profissional, resposta, proposta estruturada, aceite e atendimento contratado com perfil real e dados de `professional_data`. ✅
- Servicos/Profissionais: validar avaliacao pos-servico controlada por atendimento concluido com perfis reais. ✅
- Marketplace/Classificados: consolidar moderacao dedicada para comentarios/perguntas publicas de anuncios na mesma trilha administrativa de confianca. ✅
- Comunidade/Feed: concluir hardening territorial/visibilidade em todos os pontos restantes (mocks runtime dos services-base foram removidos; faltam hooks/widgets/paginas residuais).
- Comunidade/Feed: revalidar visualmente fluxo de edicao/exclusao/comentarios em browser apos fechamento dos TODOs funcionais e da edicao de post.
- Admin/Moderacao: consolidar fila unica, audit log e moderacao transversal alem da fila inicial de confianca operacional. ✅
- Notificacoes: matriz completa por evento/canal/preferencia.
- SEO/Rotas: validar politica final de indexacao por rota (publica/comunidade duplicada) e canonical cross-modulo em producao.

## P1 Abertos

- Gastronomia: painel realtime de fila da loja.
- Gastronomia: regras completas de area de entrega.
- Mobile/PWA: validar dashboards complexos em telas pequenas.
- E2E: adicionar specs autenticadas para gastronomia e mobilidade operacional.

## Bloqueios/Riscos

- Ambiente E2E local carrega `.env.local` com precedencia sobre `.env.test`; login e recovery anonimos passam, mas os testes autenticados ainda dependem de seeds reais por modulo.
- Validacao Playwright de gastronomia autenticada resolve `businessId` automaticamente via `/central/empresas`, com bootstrap de perfil empresarial quando necessario.
- `SUPABASE_SERVICE_ROLE_KEY` ausente ainda limita asserts administrativos profundos no setup E2E, embora login/recovery e fluxo autenticado da loja estejam passando com bootstrap anonimo controlado.
- Criacao automatica de pedido fixture E2E ainda e sensivel a permissao de insert em `orders` para a conta de teste; quando negada pelo ambiente, o teste pode perder profundidade de assert no fluxo pedido->entrega.
- `SUPABASE_SERVICE_ROLE_KEY` ausente continua como limitador para asserts administrativos profundos e seeds transversais controladas entre personas (cliente/loja/motoboy) em um unico cenario E2E.
- `SUPABASE_SERVICE_ROLE_KEY` ausente limita asserts administrativos e criacao/limpeza automatica de usuarios, empresas e seeds para testes autenticados.
- Para rodar o Playwright de gastronomia, configurar `E2E_USER_EMAIL` e `E2E_USER_PASSWORD`; `E2E_GASTRONOMY_BUSINESS_ID` virou opcional.
- Algumas validacoes historicas do Playwright existentes no repositorio podem depender de ambiente/seed especifico.
- Docs historicos em `docs/archive`, `docs/historico` e relatorios antigos ainda contem afirmacoes antigas; usar este arquivo e `docs/ACAO_EXECUTAVEL_AUDITORIA_HIPERLOCAL.md` como fonte viva.

## Proxima Tarefa Recomendada

Avancar para fechamento de Fase 3.2/3.3 e Fase 4:

1. Consolidar asserts administrativos da jornada gastronomia com `SUPABASE_SERVICE_ROLE_KEY` (auditoria e notificacoes).
2. Configurar `SUPABASE_SERVICE_ROLE_KEY` local para seeds E2E completos entre personas.
3. Executar validacao real de Servicos/Profissionais ponta a ponta (lead -> proposta -> aceite -> atendimento -> avaliacao).
