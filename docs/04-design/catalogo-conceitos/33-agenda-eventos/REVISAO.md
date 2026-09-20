# Revisão — Agenda e eventos

Status: implementado em modo de conceito, com rota de desenvolvimento isolada.

| Requisito | Evidência | Decisão | Validação |
|---|---|---|---|
| Capacidade e inscrição por perfil | `EventsListPage`, `EventDetailPage`, `EventMutationService` e contratos de participação | Produção preservada; o mock só demonstra os estados, não grava inscrição real | Conferido no fluxo de detalhe → confirmação → confirmado; CTA bloqueado sem aceite |
| Descoberta, detalhe e participação | Pranchas 102 e 103 | Rota `DEV + /agenda?concept-mock=1`, com composição responsiva separada do `/eventos` pausado | Comparação lado a lado em `425 × 1108` e `1707 × 960`; sem overflow horizontal |
| Estados operacionais | Prancha 102: vagas, cancelamento e falha de confirmação | Estados `soldout`, `canceled` e `error` navegáveis apenas no mock | Conferidos em mobile e desktop |

## Implementação

- Criado `AgendaEventosConceptMockPage` com descoberta mobile, detalhe, confirmação sem aceite pré-marcado e participação confirmada demonstrativa.
- Criada composição desktop com rail territorial, topbar, filtros, lista, detalhe selecionado, links úteis, estados de participação e rodapé.
- Adicionada a rota de desenvolvimento `/agenda?concept-mock=1`; a rota real `/eventos` continua respeitando o launch scope e os serviços canônicos.
- Mantidos explícitos os limites do conceito: imagens e eventos são demonstrativos; a confirmação não persiste, não inventa capacidade, não declara acessibilidade além do rótulo da seção e não cria lista de espera.

## Ressalvas

- As pranchas usam fotografias específicas que não existem no catálogo de assets canônicos; foram reutilizadas imagens territoriais disponíveis, mantendo proporção, recorte e hierarquia da referência.
- O botão `Criar evento` permanece informativo no mock; criação e gestão continuam no painel de organizador existente.
