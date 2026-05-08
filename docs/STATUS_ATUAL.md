# Status Atual do Projeto

Data: 2026-05-08
Branch: main
Ultimo commit base: 7e62a86 `Normaliza parametro de bairro nas rotas territoriais`

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

## Modulos/Fases Concluidos

- Fase 0: Preparacao e baseline.
- Fase 1: Arquitetura, taxonomia e rotas canonicas.
- Fase 2: Mobilidade, motorista e motoboy.

## Fase Atual

Fase 3: Gastronomia e delivery integrado.

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

## P0 Abertos

- Servicos/Profissionais: validar Central Profissional, resposta, proposta estruturada, aceite e atendimento contratado com perfil real e dados de `professional_data`. ✅
- Servicos/Profissionais: validar avaliacao pos-servico controlada por atendimento concluido com perfis reais. ✅
- Marketplace/Classificados: consolidar moderacao dedicada para comentarios/perguntas publicas de anuncios na mesma trilha administrativa de confianca. ✅
- Comunidade/Feed: concluir hardening territorial/visibilidade em todos os pontos restantes e remover mocks reais.
- Comunidade/Feed: concluir edicao inline/historico de comentarios e validar visualmente exclusao com dados reais apos migracao de `confirm()` para dialog acessivel.
- Admin/Moderacao: consolidar fila unica, audit log e moderacao transversal alem da fila inicial de confianca operacional. ✅
- Notificacoes: matriz completa por evento/canal/preferencia.
- SEO/Rotas: sitemap dinamico.
- SEO/Rotas: conectar sitemap dinamico ao banco para producao; estrutura canonica com `/area` ja foi aplicada no gerador.

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
