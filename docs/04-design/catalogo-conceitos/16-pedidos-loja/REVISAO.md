# Revisão — Pedidos da loja

Status: implementado e validado em 20/09/2026.

Referência: `pranchas/026-pedidos-loja.png`.

| Item | Situação no código | Evidência | Decisão | Validação |
|---|---|---|---|---|
| Desktop | Header da loja, rail lateral, título, tabs, filtros, quadro de quatro etapas e histórico | `OrdersConceptMockPage` | Reproduzir a composição da prancha e manter ações controladas | `1440 × 867` CSS px |
| Mobile | Identidade da loja, título, filtro de novos/todos, cards de pedidos e navegação inferior | `MobileHeader`, `MobileOrderList`, `MobileBottomNavigation` | Manter somente a fila mobile prevista para operação | `389 × 867` CSS px |
| Offline | Aviso visual no desktop orienta manter dados e oferecer Atualizar | `DesktopStoreHeader` e cabeçalho da operação | Exibir somente no concept DEV; produção deve usar conectividade real | Conferido no navegador |
| Filtros e view | Busca, pagamento, modalidade, hoje e alternância Lista/Quadro | `OrderFilters` | Preservar filtro local e não avançar pedido sem ação explícita | Busca/filtros e view conferidos |
| Estados e ações | Novos, em preparo, prontos, em entrega; ações seguem a etapa e não confirmam pagamento | `handleOrderAction` | Manter pagamento como dado de leitura e restringir avanço ao CTA da etapa | Console limpo |
| Abas | Operação, Clientes e Indicadores, com dados demonstrativos no preview | `CustomersPanel`, `IndicatorsPanel` | Manter o escopo do concept sem liberar operação fictícia em produção | Abas mobile/desktop conferidas |

## Ajuste aplicado

Foi adicionada a barra superior desktop da prancha, com wordmark, contexto `Pedidos` e conta da loja, além do aviso de conexão no cabeçalho da operação. A correção é restrita à rota de concept mock; o fluxo real de pedidos continua usando seus serviços e permissões próprios.

Limitação mantida: os dados exibidos são demonstrativos somente na rota `/gastronomia/pedidos/concept-mock-store`; nenhuma alteração de status ou confirmação de pagamento é persistida.

Branch: `codex/reformulacao-entrada-comunidade`.
