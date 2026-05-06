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
- [x] P0: alinhar front de pedidos/entregas da loja ao SSOT de `orders`/`ride_requests`.
ide_requests.
- [ ] P0: validar fluxo restaurante completo: receber pedido, aceitar, preparar, despachar, cancelar, pausar loja, ajustar tempo e esgotar item.
- [x] P0: integrar pedido com motoboy quando for delivery proprio/plataforma.
- [x] P0: trocar `confirm()` nativo em delecao de categoria, item, area de entrega e excecoes de horario.
- [x] P0: resolver arquivos deprecated de billing/permissoes/feature flags ou arquivar claramente.
- [x] P0: definir se nichos beta aparecem para usuario final ou apenas admin/feature flag.

## Lacunas P1

- [ ] P1: criar SLA de pedido: recebido, aceito, em preparo, saiu para entrega, entregue, cancelado.
- [ ] P1: criar painel operacional de restaurante com fila de pedidos em tempo real.
- [ ] P1: criar regras por area de entrega: taxa, tempo, pedido minimo e raio/bairro.
- [ ] P1: criar pausa de loja/item com motivo e tempo.
- [ ] P1: criar reputacao de restaurante: entrega, qualidade, atraso, cancelamento, avaliacao.
- [x] P1: criar comprovante e comunicacao cliente/restaurante/motoboy para o fluxo operacional base.
- [ ] P1: criar testes E2E para pizza e um nicho basico.

## Lacunas P2

- [ ] P2: criar campanha local: cupom por bairro, frete gratis, horario ocioso.
- [ ] P2: criar recorrencia/encomenda: bolo, salgados, marmita semanal, pao/assinatura.
- [ ] P2: criar analytics de cardapio: itens vistos, adicionados, removidos, vendidos e margem.
- [ ] P2: criar estoque simples para itens limitados.
- [ ] P2: criar ranking local por relevancia, nao apenas ordem manual.

## Evidencias Tecnicas

- `src/modules/business/gastronomy/pages/DeliveryAreaPage.tsx`: `confirm()` removido; usa `ConfirmActionDialog`.
- `src/modules/business/gastronomy/pages/MenuManagementPage.tsx`: `confirm()` removido para categoria/item; usa `ConfirmActionDialog`.
- `src/modules/business/gastronomy/components/delivery/NeighborhoodManager.tsx`: `confirm()` removido; usa `ConfirmActionDialog`.
- `src/modules/business/gastronomy/components/hours/ExceptionsManager.tsx`: `confirm()` removido; usa `ConfirmActionDialog`.
- `src/modules/mobility/delivery/services/OrderDeliveryLinkService.ts`: sincroniza `ride_requests` de motoboy/gastronomia com `orders.logistics_status`.
- `src/modules/mobility/core/RideOperationalService.ts`: aciona sincronizacao do pedido ao aceitar, cancelar, retirar, iniciar, entregar ou falhar entrega.
- `src/modules/business/gastronomy/billing/legacy/StripeService.ts`: arquivado fora do export publico; SSOT atual em `@/core/billing`.
- `src/modules/business/gastronomy/billing/legacy/permissions.ts`: arquivado fora do export publico; SSOT atual em `@/core/billing`.
- `src/modules/business/gastronomy/billing/legacy/featureFlags.ts`: arquivado fora do export publico; SSOT atual em `@/core/billing`.
- `src/modules/business/gastronomy/niches/pizzaria/components/PizzaAdminPanel.tsx`: placeholder `pizza_sizes` removido do `tableMap`; configuracao nao usa tabela falsa.

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
