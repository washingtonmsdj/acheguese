# Revisão — Entregas da loja e vínculos de entregadores

Status: concluída para as superfícies das pranchas 031, 033, 046, 048 e 049.

| Item | Situação no código | Evidência | Decisão | Validação |
|---|---|---|---|---|
| Entrega própria sem integração | Atende após ajuste | `src/modules/business/gastronomy/pages/DeliveryOrderConceptMockPage.tsx` | Mantida como operação manual, sem mapa ou rastreamento falso | Estados `own`, `request`, `searching` e `unavailable` conferidos em mobile e desktop |
| Modalidades da loja | Atende após ajuste | `src/modules/business/gastronomy/pages/DeliveryModesConceptMockPage.tsx` | Mantidas as três modalidades e a rede desabilitada no mock | `view=modalities` conferido em `389 × 867` e `1707 × 960` CSS px |
| Diretório, perfil e convite | Atende após ajuste | `DeliveryModesConceptMockPage.tsx` (`directory`, `profile`, `invite`, `accept`) | Dois profissionais no diretório, vínculo mediante aceite e rede separada | Quatro rotas conferidas em mobile; sem overflow e CTAs dentro do viewport |
| Operação mobile da loja/entregador | Atende após ajuste | `DeliveryModesConceptMockPage.tsx` (`manual`, `operation`, `courier`) | Contextos de loja e entregador permanecem independentes | Estados manual, aguardando aceite, acompanhamento e “Minhas lojas” conferidos em mobile/desktop |
| Estilo e ritmo vertical | Corrigido | `src/index.css` e shells dos concepts | Margens editoriais globais removidas apenas dentro dos mocks; painel desktop limitado à escala da prancha | Mobile sem clipping; desktop sem expansão indevida nem repetição de ações |
| Fluxo vinculado detalhado | Implementação existente, auditado no concept próprio | `src/modules/business/gastronomy/pages/LinkedStoreDeliveryConceptMockPage.tsx` | Mantido para a revisão específica do catálogo 22 | Não misturar a superfície do entregador vinculado com as pranchas 046/048/049 |

## Decisões de fidelidade

- A escala desktop de `DeliveryModesConceptMockPage` foi limitada a `36rem` de conteúdo após o rail de 160px, reproduzindo a janela compacta das pranchas 046 e 049; o conteúdo não é esticado artificialmente até a borda do navegador.
- O mobile do entregador recebeu a mesma densidade da prancha 049: cartões compactos, nota de independência dentro do cartão da rede e navegação inferior sem cobrir ações.
- O diretório mobile foi mantido com os dois profissionais ilustrados na prancha 048; a presença no diretório continua sem confirmar disponibilidade imediata.
- Os textos e estados são demonstrativos apenas nas rotas `concept-mock`; as rotas de produto e os contratos reais permanecem inalterados.

## Evidências

- Navegador interno mantido aberto nas rotas de entregas, modalidades, diretório/convites e operação do entregador.
- Mobile validado em `389 × 867` CSS px; desktop validado em `1707 × 960` CSS px para a prancha compacta e em `1440 × 867` CSS px para a entrega própria.
- Console do mock sem erros ou avisos nas superfícies auditadas.
- `git diff --check`, ESLint direcionado e `npm run typecheck:app` executados após os ajustes.

Registrar branch/commit analisado, data, limitações e funcionalidades mantidas desativadas.

- Branch: `codex/reformulacao-entrada-comunidade`.
- Data da revisão: `20/09/2026`.
- A rede Achegue-se continua visualmente desabilitada no mock até existir contrato de disponibilidade e aceite; não foi ativada por semelhança visual.
