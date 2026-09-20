# Revisão — Acompanhar pedido

Status: implementado e validado em 20/09/2026.

Referências: `pranchas/023-acompanhamento-mobile.png` e `pranchas/025-acompanhamento-desktop.png`.

| Item | Situação no código | Evidência | Decisão | Validação |
|---|---|---|---|---|
| Estados do pedido | Preparo, em entrega, localização sem atualização e concluído | `OrderTrackingConceptSurface` + `OrderTrackingConceptMockPage` | Manter o mock limitado a DEV e preservar o fluxo real de pedido | Quatro estados conferidos no navegador mobile |
| Mobile | Header de retorno, resumo do pedido, hero contextual, etapas, endereço, pagamento, itens, histórico e CTA fixo | `/gastronomia/pedidos/concept-mock-order-1042?concept-mock=1` | Seguir composição da prancha 023 e manter CTA acessível no rodapé | `389 × 867` CSS px, sem clipping |
| Desktop | Header territorial, hero, colunas de andamento/mapa e painel lateral de endereço, itens, pagamento e ações | `DesktopTrackingLayout` | Usar mapa somente quando há tracking autorizado e coordenadas | `1440 × 867` CSS px conferido |
| Rastreamento | Mapa real só é montado com entregador, coordenadas e autorização de rastreamento | `RideTrackingMap` | Não inventar rota nem posição quando os dados não existem | Preparação sem mapa; entrega/stale com snapshot demonstrativo |
| Estados finais | Comprovante, avaliação, histórico completo e retorno ao cardápio | `CompletionProof`, `OrderPublicReviewPanel` | Preservar ações e dados do pedido | Estado concluído conferido |
| Erros e vazio | Mensagens para mapa sem coordenadas e ausência de endereço | condicionais da superfície | Mostrar limitação real, sem placeholder operacional enganoso | Console limpo no mock |

## Ajuste aplicado

`RideTrackingMap` agora recebe `trackingEnabled`. Quando a superfície recebe `driverLocationOverride` demonstrativo, o mapa usa o snapshot fornecido sem inicializar a chamada real de posição do entregador. Em produção, sem override, o rastreamento real continua habilitado.

O teste da superfície também foi alinhado ao fixture histórico de `11/09/2026`: a UI apresenta a data do pedido quando não é o dia atual, e não chama a informação de “Hoje” artificialmente.

Limitação mantida: mapa, telefone, mensagens, comprovante e dados de entrega dependem dos contratos e permissões reais; a prancha usa dados demonstrativos apenas na rota DEV do concept.

Branch: `codex/reformulacao-entrada-comunidade`.
