# Auditoria do Modulo Gastronomia e Nichos

Data: 2026-05-06
Escopo: gastronomia, restaurantes, cardapio, pedidos, delivery, areas de entrega, horarios, nichos e integracao com motoboy.

## Prompt profissional executado

```text
Atue como auditor senior de produto, operacao e arquitetura para um modulo hiperlocal de gastronomia. Audite cardapio, pedidos, carrinho, checkout, delivery, horarios, areas de entrega, nichos culinarios, restaurante, cliente, motoboy, admin, billing e status operacional. Classifique maturidade por nicho e prioridade P0/P1/P2/P3, indicando o que falta para operar profissionalmente.
```

## Veredito

Gastronomia e um dos modulos mais ricos do projeto, mas ainda nao deve ser tratado como fechado. A estrutura existe, ha muitos componentes de cardapio, checkout, entrega, dashboard, pedidos e nichos. O risco principal esta na maturidade desigual dos nichos e na integracao operacional com motoboy.

Pizza aparece como nicho completo no SSOT atual. Sushi, acai, pastel, churrascaria e bares aparecem como nichos complexos/beta. Os demais nichos basicos existem mais como categorizacao/presets do que como operacao especializada.

## Nichos Mapeados

Estado observado em `src/modules/business/gastronomy/niches/registry.ts`:

- Basicos/publicos: lanches, hamburguer, brasileira, arabe, saudavel, salgados, padaria, doces, cafes.
- Completo/publico: pizza.
- Complexos/beta: sushi, acai, pastel, churrascaria, bares.

## Matriz de Maturidade

| Nicho | Maturidade | Observacao |
| --- | --- | --- |
| Pizza | Media/alta | Tem builder/admin e presets; ainda ha placeholder de configuracao. |
| Sushi | Media/baixa | Marcado como complexo beta; precisa validar combinados, adicionais, unidades e disponibilidade. |
| Acai | Media/baixa | Marcado como complexo beta; precisa validar tamanhos, complementos, montagem e precificacao. |
| Pastel | Media/baixa | Marcado como complexo beta; precisa validar sabores, adicionais, combos e fritura/tempo. |
| Churrascaria | Baixa/media | Precisa regras por peso, rodizio, marmita, acompanhamentos e horario. |
| Bares | Baixa/media | Precisa idade, bebidas, combos, happy hour e restricoes. |
| Lanches/Hamburguer | Media | Bom para MVP, mas precisa combos, adicionais e horarios. |
| Padaria/Doces/Cafes | Baixa/media | Precisa retirada, encomenda, disponibilidade diaria e estoque. |

## Lacunas P0

- [ ] P0: validar fluxo cliente completo: ver restaurante, montar pedido, carrinho, checkout, pagamento/confirmacao, status, entrega/retirada e avaliacao.
  - [x] Cliente possui rota publica de detalhe do pedido, notificacao com link e avaliacao pos-entrega conectada ao `ReviewQueryService`; nota baixa tambem cria evento privado em `core/trust`.
  - [x] Smoke de contrato SSOT cobre rota publica do pedido, notificacao, avaliacao pos-entrega, guard de operacao da loja e dashboard real.
- [x] P0: alinhar front de pedidos/entregas da loja ao SSOT de `orders`/`ride_requests`.
- [ ] P0: validar fluxo restaurante completo: receber pedido, aceitar, preparar, despachar, cancelar, pausar loja, ajustar tempo e esgotar item.
  - [x] Aceitar, iniciar preparo, marcar pronto, despachar/entregar e cancelar com motivo foram conectados no detalhe do pedido via `OrderService`/SSOT.
  - [x] Cancelamento com motivo estruturado agora pode gerar evento privado de confianca quando o cliente cancela tarde e prejudica loja/motoboy.
  - [x] Loja pode registrar feedback operacional privado sobre cliente e motoboy no detalhe do pedido.
  - [x] Dashboard da loja exibe status operacional real, pedidos de hoje, cardapio e areas de entrega por hooks canonicos.
  - [x] Configuracao operacional de pausa de loja/tempo de preparo foi realinhada ao contrato canonico de `useOperationConfig`.
  - [x] Cardapio da loja expoe disponibilidade, estoque atual, alerta de estoque baixo e acao rapida de esgotar item via `MenuService`/`useMenuItems`.
  - [x] Playwright operacional criado para validar cardapio autenticado com loja real (`tests/e2e/gastronomy-operational.spec.ts`).
  - [ ] Ainda falta validar visualmente, com dados reais/autenticados, pausa de loja, ajuste de tempo operacional e pausa/esgotamento de item.
- [x] P0: integrar pedido com motoboy quando for delivery proprio/plataforma.
- [x] P0: trocar `confirm()` nativo em delecao de categoria, item, area de entrega e excecoes de horario.
- [x] P0: resolver arquivos deprecated de billing/permissoes/feature flags ou arquivar claramente.
- [x] P0: definir se nichos beta aparecem para usuario final ou apenas admin/feature flag.

## Lacunas P1

- [ ] P1: criar SLA de pedido: recebido, aceito, em preparo, saiu para entrega, entregue, cancelado.
- [ ] P1: criar painel operacional de restaurante com fila de pedidos em tempo real.
- [ ] P1: criar regras por area de entrega: taxa, tempo, pedido minimo e raio/bairro.
- [ ] P1: criar pausa de loja/item com motivo e tempo.
- [x] P1 parcial: iniciar reputacao operacional privada via `core/trust` e `trust_events`.
- [x] P1 parcial: cliente/passageiro -> motoboy e motoboy -> loja/cliente foram conectados ao SSOT privado.
- [x] P1: criar score operacional, reincidencia 30/90 dias e acao recomendada por persona no SSOT de confianca.
- [x] P1: criar acoes administrativas formais com aviso, restricao temporaria, desbloqueio e auditoria.
- [x] P1: aplicar impacto graduado em prioridade operacional para `watchlist`/`restricted`, mantendo bloqueio automatico apenas para risco critico.
- [x] P1: completar reviews publicos cliente -> loja no pos-entrega.
- [x] P1: criar comprovante e comunicacao cliente/restaurante/motoboy para o fluxo operacional base.
- [x] P1: criar testes E2E para pizza e um nicho basico.

## Lacunas P2

- [ ] P2: criar campanha local: cupom por bairro, frete gratis, horario ocioso.
- [ ] P2: criar recorrencia/encomenda: bolo, salgados, marmita semanal, pao/assinatura.
- [ ] P2: criar analytics de cardapio: itens vistos, adicionados, removidos, vendidos e margem.
- [x] P2: criar estoque simples para itens limitados.
- [ ] P2: criar ranking local por relevancia, nao apenas ordem manual.

## Evidencias Tecnicas

- `src/modules/business/gastronomy/pages/DeliveryAreaPage.tsx`: `confirm()` removido; usa `ConfirmActionDialog`.
- `src/modules/business/gastronomy/pages/MenuManagementPage.tsx`: `confirm()` removido para categoria/item; usa `ConfirmActionDialog`.
- `src/modules/business/gastronomy/components/delivery/NeighborhoodManager.tsx`: `confirm()` removido; usa `ConfirmActionDialog`.
- `src/modules/business/gastronomy/components/hours/ExceptionsManager.tsx`: `confirm()` removido; usa `ConfirmActionDialog`.
- `src/modules/mobility/delivery/services/OrderDeliveryLinkService.ts`: sincroniza `ride_requests` de motoboy/gastronomia com `orders.logistics_status`.
- `src/modules/mobility/core/RideOperationalService.ts`: aciona sincronizacao do pedido ao aceitar, cancelar, retirar, iniciar, entregar ou falhar entrega.
- `src/modules/business/gastronomy/components/orders/OrderOperationsPanel.tsx`: painel operacional da loja para avancar pedido por status e cancelar com motivo auditavel no SSOT.
- `src/modules/business/gastronomy/components/orders/OrderTrustFeedbackPanel.tsx`: feedback privado da loja sobre cliente/motoboy integrado ao SSOT de confianca.
- `src/modules/business/gastronomy/components/orders/OrderPublicReviewPanel.tsx`: avaliacao publica cliente -> loja no pos-entrega usando `ReviewQueryService` e evento privado em `core/trust` quando necessario.
- `src/modules/mobility/delivery/services/OrderDeliveryNotificationService.ts`: notificacao do cliente agora abre `/gastronomia/pedidos/:orderId`.
- `src/modules/business/gastronomy/pages/GastronomyDashboardPage.tsx`: substitui contadores fixos por cards operacionais conectados aos hooks canonicos.
- `src/modules/business/gastronomy/components/hours/OperationConfigForm.tsx`: usa `updateConfig`/`isUpdating` do hook canonico para salvar pausa e tempo operacional.
- `src/modules/business/gastronomy/__tests__/GastronomyOperationalSSOT.test.ts`: teste de contrato para impedir regressao do fluxo operacional SSOT de gastronomia.
- `tests/e2e/gastronomy-operational.spec.ts`: Playwright autenticado para validar cardapio da loja quando houver `E2E_GASTRONOMY_BUSINESS_ID` real.
- `src/core/trust/services/OperationalTrustCommandService.ts`: adapters tipados para comandos server-owned de confianca operacional.
- `src/core/trust/services/TrustPolicyReadService.ts`: leitura da politica autoritativa calculada no banco; a UI nao autoriza operacoes.
- `src/core/trust/components/TrustFeedbackForm.tsx`: formulario reutilizavel para feedback privado por contexto/participante.
- `src/core/admin/components/TrustEventsQueue.tsx`: fila admin exibe eventos, score por perfil, reincidencia e acao recomendada.
- `trust_admin_actions`: tabela de auditoria para avisos, restricoes temporarias e desbloqueios aplicados pelo admin.
- `src/modules/mobility/components/RideHistoryUnified.tsx`: cliente/passageiro registra feedback privado sobre motorista/motoboy.
- `src/modules/mobility/components/driver/DriverTrustFeedbackPanel.tsx`: motorista/motoboy registra feedback privado sobre cliente e loja.
- `src/modules/mobility/services/MobilityOfferService.ts`: ofertas/aceite de motorista e motoboy passam pelo gate de confianca critica.
- `src/modules/mobility/hooks/useDriverDashboardBase.ts`: ofertas abertas de motoboy sao ordenadas por prioridade ajustada de confianca.
- `src/modules/mobility/components/driver/DriverRidesLayout.tsx` e `DriverDeliveriesLayout.tsx`: UI mostra quando a solicitacao tem prioridade reduzida por confianca.
- `src/modules/business/gastronomy/services/DeliveryService.ts`: aceite de entrega canonica bloqueia motoboy em risco critico.
- `supabase/migrations/20260715109000_consolidate_trust_commands.sql`: comandos, guards, politica, fila admin e gates transacionais de Trust.
- `src/modules/business/gastronomy/billing/legacy/StripeService.ts`: arquivado fora do export publico; SSOT atual em `@/core/billing`.
- `src/modules/business/gastronomy/billing/legacy/permissions.ts`: arquivado fora do export publico; SSOT atual em `@/core/billing`.
- `src/modules/business/gastronomy/billing/legacy/featureFlags.ts`: arquivado fora do export publico; SSOT atual em `@/core/billing`.
- `src/modules/business/gastronomy/niches/pizzaria/components/PizzaAdminPanel.tsx`: placeholder `pizza_sizes` removido do `tableMap`; configuracao nao usa tabela falsa.
- `tests/e2e/gastronomy-onboarding.spec.ts`: contrato Playwright cobre pizzaria
  `full_enabled`, lanches `basic_enabled`, selecao publica no setup e fluxo de
  pedido/operacao da pizzaria.

## Definicao de Pronto

Gastronomia esta pronta quando:

- Cliente compra sem friccao.
- Restaurante opera pedidos em tempo real.
- Motoboy recebe entrega integrada quando aplicavel.
- Nichos beta nao vazam como se fossem completos.
- Delecoes e cancelamentos usam dialog do design system.
- Admin consegue configurar planos, cardapio, horario, area, pedido e reputacao.

## Prioridade Final

- P0: fechar pedido E2E cliente/restaurante/motoboy.
- P0: limpar deprecated/beta/confirm.
- P1: painel realtime e SLA operacional.
- P2: nichos avancados, recorrencia e analytics.
