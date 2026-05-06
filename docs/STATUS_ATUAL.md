# Status Atual do Projeto

Data: 2026-05-06
Branch: main
Ultimo commit base: 2d42b0b `Integra delivery SSOT e profissionaliza fluxos de gastronomia`

## Validacoes Recentes

- `npm run lint`: passou em 2026-05-06.
- `npm run typecheck`: passou em 2026-05-06.
- `npm run build`: passou em 2026-05-06.
- `npm run validate:architecture:delivery`: passou em 2026-05-06.
- `npm run validate:architecture:community`: passou em 2026-05-06.
- `npm run validate:taxonomy`: passou em 2026-05-06.
- Smoke Playwright Chromium em rotas publicas principais: passou em 2026-05-06.

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

## P0 Abertos

- Gastronomia: validar fluxo restaurante autenticado com dados reais, incluindo pausa de loja, ajuste de tempo e pausa/esgotamento de item.
- Gastronomia: validar cliente E2E completo com carrinho, checkout, pedido, tracking, entrega, avaliacao e recibo.
- Servicos/Profissionais: substituir Central Profissional placeholder.
- Servicos/Profissionais: criar funil lead/orcamento/notificacao.
- Marketplace/Classificados: socializar classificados com comentario, salvar, report, status e reputacao.
- Comunidade/Feed: garantir territorio/visibilidade e remover mocks reais.
- Admin/Moderacao: fila unica, audit log e moderacao transversal.
- Notificacoes: matriz completa por evento/canal/preferencia.
- SEO/Rotas: sitemap dinamico e canonicalizacao.

## P1 Abertos

- Gastronomia: painel realtime de fila da loja.
- Gastronomia: SLA de pedido e reputacao operacional de restaurante.
- Gastronomia: regras completas de area de entrega.
- Mobile/PWA: validar dashboards complexos em telas pequenas.
- E2E: adicionar specs autenticadas para gastronomia e mobilidade operacional.

## Bloqueios/Riscos

- Teste E2E completo autenticado depende de dados/perfis reais ou seed confiavel.
- Algumas validacoes historicas do Playwright existentes no repositorio podem depender de ambiente/seed especifico.
- Docs historicos na raiz e em `docs/archive` ainda contem afirmacoes antigas; usar este arquivo e `docs/ACAO_EXECUTAVEL_AUDITORIA_HIPERLOCAL.md` como fonte viva.

## Proxima Tarefa Recomendada

Continuar Fase 3.1:

1. Validar visualmente rotas autenticadas da loja com seed/perfil real.
2. Fechar pausa de loja/tempo operacional/item indisponivel na UX da loja.
3. Criar teste E2E ou smoke autenticado para pedido de gastronomia.
