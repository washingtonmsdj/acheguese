# Revisão — Ganhos do entregador

Status: concluída em 20/09/2026.

| Item | Situação no código | Evidência | Decisão | Validação |
|---|---|---|---|---|
| Auditoria desta página | Concluída | `CentralMotoboyGanhosConceptMockPage.tsx`, `042`, `044`, `045` | Ajustar densidade mobile, cor do gráfico e estados completos sem alterar o contrato financeiro | Mobile e desktop conferidos no navegador interno; typecheck, ESLint e diff check |

## Decisão e ajustes

- Comparei resumo, histórico, detalhe de entrega, revisão de valor e recebimentos futuros com as pranchas 042, 044 e 045. A implementação já cobria os estados demonstrativos e os links de navegação; mantive a separação entre valor registrado, recebimento e revisão.
- O gráfico mobile passou a usar teal, como na prancha de ganhos; o gráfico desktop mantém amarelo para preservar a composição da referência desktop.
- Adicionei reset tipográfico scoped a `.driver-earnings-concept-page`. Os parágrafos globais estavam inflando os cards do detalhe e empurrando as ações para baixo da navegação inferior; a correção reduziu somente esta superfície.
- Compactei o detalhe mobile em espaçamentos, cartões e linhas de ação, mantendo comprovante, histórico e solicitação de revisão visíveis dentro do viewport. Não introduzi scroll obrigatório nem escondi ações.
- Mantive recebimentos confirmados, pendentes, sem movimentação e erro como estados de concept. Nenhuma confirmação financeira, repasse ou solicitação de revisão é persistida como operação real.

## Evidências de validação

- Navegador interno mantido aberto na rota `/central/motoboy/ganhos?concept-mock=1&view=summary` para acompanhamento.
- Mobile conferido em `389 × 867` CSS px para resumo, histórico, detalhe de entrega, recebimento pendente/confirmado, revisão, recebimentos, vazio e erro: documento/body permaneceram em `389 × 867`; no detalhe a CTA termina em `y=798,7`, antes da navegação inferior.
- Desktop conferido em `1440 × 867` CSS px para resumo, histórico, detalhe, revisão e recebimentos: shell, rail, conteúdo e cards laterais sem overflow horizontal/vertical.
- Console sem erros observados. `npm run typecheck:app`, ESLint direcionado e `git diff --check` executados antes do commit.

## Limitações mantidas

- Integração financeira, confirmação de recebimento, cálculo de repasse, anexos e análise de revisão continuam demonstrativos e desativados até existir contrato real.

Registrar branch/commit analisado, data, limitações e funcionalidades mantidas desativadas.
