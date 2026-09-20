# Revisão — Operação do entregador vinculado e comprovante

Status: concluída em 20/09/2026.

Branch analisada: `codex/reformulacao-entrada-comunidade`.
Componente revisado: `src/modules/central/pages/CentralMotoboyConceptMockPage.tsx`.
Referências: pranchas 050, 051 e 052.

| Item | Situação no código | Evidência | Decisão | Validação |
|---|---|---|---|---|
| Solicitação mobile | Ajustada | `MobileOfferContent` | Reordenar para loja, rota, mapa, remuneração e ações; manter recusa sem cancelar o pedido | Conferida em `389 × 867` |
| Coleta mobile | Ajustada | `MobileDeliveryContent`, fase `pickup` | Reproduzir mapa, loja, checklist, lacre, contato, confirmação e problema | Conferida em `389 × 867` |
| Coleta confirmada / iniciar entrega | Implementada | `MobileReadyContent` e `DesktopReadyContent` | Incluir o estado intermediário que faltava no mock | Conferida pela rota `phase=ready` |
| Destino mobile | Ajustada | `MobileDeliveryContent`, fase `delivery` | Destacar destinatário, pacote, orientação, navegação, recebimento e problema | Conferida em `389 × 867` |
| Solicitação desktop | Ajustada | `DesktopRequestContent` | Usar rota vertical, itens/remuneração e grupo único de ações conforme a prancha 052 | Conferida em `1440 × 867` e `1707 × 960` |
| Entrega desktop | Ajustada | `DeliveryContent` | Corrigir identificador, estado, ações e registro de recebimento | Conferida sem overflow |
| Recebimento e comprovante | Ajustados | `MobileProofContent`, `MobileHistoryContent`, `DesktopCompletionContent` | Usar `#1043`, campos de recebimento, código obrigatório, observação e comprovante separado do pagamento | Conferidos em mobile e desktop |
| Problema/offline | Mantidos e alinhados | `MobileProblemContent`, `MobileOfflineContent` | Preservar registro demonstrativo, contato e recuperação sem simular persistência real | Rotas existentes preservadas |

## Regras preservadas

- A operação segue demonstrativa: aceite, contato, navegação, código e comprovante não foram promovidos a integrações reais.
- A remuneração aparece como “conforme acordo com a loja”; nenhum valor ilustrativo é tratado como pagamento confirmado.
- Foto não é exigida por padrão; o comprovante registra a entrega, não o pagamento.
- Rede Achegue-se, permissões, vínculo e dados do entregador continuam dependentes de habilitação e contrato.
- O navegador interno permaneceu aberto nas telas mobile e desktop para comparação durante o ajuste.

## Verificações

- `npx eslint src/modules/central/pages/CentralMotoboyConceptMockPage.tsx`
- `npm run typecheck:app`
- `git diff --check`
- Auditoria visual das rotas `phase=offer`, `phase=pickup`, `phase=ready`, `phase=delivery`, `screen=proof` e `screen=history`.

Limitação: mapas e dados de rota permanecem ilustrativos por decisão do concept; as ações continuam com feedback demonstrativo e sem persistência.
