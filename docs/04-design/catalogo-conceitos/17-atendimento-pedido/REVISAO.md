# Revisão — Atendimento do pedido

Status: implementado e validado em 20/09/2026.

Referências: `pranchas/027-atendimento-mobile.png` e `pranchas/029-atendimento-desktop.png`.

| Item | Situação no código | Evidência | Decisão | Validação |
|---|---|---|---|---|
| Receber | Pedido novo, cliente, itens, totais, pagamento pendente, observação e ações de aceite/recebimento/cancelamento | `OrderServiceConceptMockPage` | Separar confirmação operacional de confirmação financeira | Mobile e desktop conferidos |
| Preparar | Endereço, itens, pagamento, linha do tempo e `Marcar pronto` | estado `prepare` | Avançar somente pelo CTA explícito da etapa | Mobile `389 × 867` CSS px |
| Cancelar | Motivo, detalhe obrigatório, resumo e confirmação destrutiva | estado `cancel` | Exigir motivo/detalhe antes de registrar cancelamento | Formulário e retorno conferidos |
| Concluir | Comprovante, histórico, registro privado de ocorrência e destinatário autorizado | estado `complete` | Preservar ação restrita e feedback de sucesso | Mobile e desktop conferidos |
| Navegação | Topbar/rail desktop, header mobile e menu de estados no mobile | `DesktopTopbar`, `DesktopSidebar`, `MobileHeader` | Manter estados como preview DEV, sem liberar mudança fictícia em produção | Viewport responsivo conferido |
| Dados financeiros | PIX pendente/confirmado, subtotal, entrega e total separados | `PaymentCard`, `Totals` | Não confirmar pagamento automaticamente | Conteúdo e ações conferidos |

## Ajuste aplicado

Não foi necessária alteração de código nesta auditoria: a implementação já reproduzia as duas pranchas e mantinha as transições como ações explícitas. A revisão documenta os estados, os limites do mock e as validações realizadas.

Limitação mantida: a rota `/gastronomia/pedidos/concept-mock-attendance` é demonstrativa; persistência, autorização, pagamento, comprovante e mudança real de status permanecem nos contratos de produção.

Branch: `codex/reformulacao-entrada-comunidade`.
