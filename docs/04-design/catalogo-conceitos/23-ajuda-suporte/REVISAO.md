# Revisão — Ajuda e suporte

Status: concluída em 20/09/2026.

Branch analisada: `codex/reformulacao-entrada-comunidade`.
Componentes: `src/app/pages/HelpSupportConceptMockPage.tsx` e `src/app/pages/ContactPage.tsx`.
Referências: pranchas 056 e 058; as pranchas 055 e 057 foram mantidas apenas como histórico.

| Item | Situação no código | Evidência | Decisão | Validação |
|---|---|---|---|---|
| Central de ajuda | Implementada | `HelpHub` | Reproduzir busca, contexto da entrega, categorias, chamados e CTA sem inventar atendimento humano | Mobile e desktop conferidos |
| Abrir chamado | Implementada | `NewTicket` | Manter assunto, contexto, título, descrição, anexo opcional e aviso para não enviar códigos | Fluxo enviado para a lista |
| Meus chamados | Implementada | `TicketList` e `TicketCard` | Exibir abertos/resolvidos, protocolos, status e resposta nova | Primeiro chamado aberto em seguida |
| Conversa | Implementada | `Conversation` | Representar linha do tempo, composição de mensagem, resolução e encaminhamento transparente | Mobile e desktop conferidos |
| Estados e permissões | Preservados | `ContactPage` com `concept-mock=1` somente em desenvolvimento | Não alterar o contato institucional em produção nem prometer SLA ou atendimento real | Typecheck/ESLint |

## Regras preservadas

- O fluxo é demonstrativo e só é ativado com `?concept-mock=1` em desenvolvimento.
- Chamados, mensagens, anexos, resolução e encaminhamento não persistem nem simulam uma equipe humana real.
- A entrega contextual é ilustrativa; o suporte não altera pedido, coleta, pagamento ou código automaticamente.
- Contato institucional e privacidade permanecem itens separados da central de chamados.

## Verificações

- `npx eslint src/app/pages/HelpSupportConceptMockPage.tsx src/app/pages/ContactPage.tsx`
- `npm run typecheck:app`
- `git diff --check`
- Navegador interno mantido aberto em `/contato?concept-mock=1` nos viewports mobile e desktop.
- Fluxos `hub`, `new`, `tickets` e `conversation` exercitados por interação; desktop auditado sem overflow do documento.

Limitação: nenhum chamado real, SLA, anexo ou atendimento humano foi criado; os dados permanecem demonstrativos por decisão do concept.
