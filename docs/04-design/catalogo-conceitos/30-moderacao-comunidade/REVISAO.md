# Revisão — Central de moderação

Status: concluído em 20/09/2026.

## Referências e decisão

- Referências: `093-moderacao-mobile.png` e `094-moderacao-desktop.png`.
- Os serviços e componentes reais de moderação (`CommunityContentModerationQueue`, `CommunityContentModerationService` e triagem federada) foram preservados.
- `DEV + concept-mock=1` em `/moderacao` usa `ModeracaoComunidadeConceptMockPage` apenas para comparação visual; nenhuma decisão é enviada ao servidor.
- A tela explicita o acesso territorial autorizado e não transforma residência, vínculo comunitário ou perfil comercial em permissão de moderação.

## Matriz de conferência

| Item | Situação | Evidência | Decisão |
|---|---|---|---|
| Fila de pendentes | Atendido | `QueueView`, `QueueList`, `Filters` | Busca, filtros, contadores, tipos, motivos, território e paginação ilustrada. |
| Análise de conteúdo | Atendido | `AnalysisCard` | Conteúdo, perfil comercial, motivo agrupado, contexto, decisão e justificativa obrigatória. |
| Decisões possíveis | Atendido como mock | `Manter`, `Ocultar`, `Remover` | Remover permanece distinguido como decisão destrutiva; nenhuma consequência é executada. |
| Confirmação | Atendido como mock | `ConfirmView` | Alvo, efeito, justificativa, nota interna separada e confirmação explícita. |
| Decisão registrada | Atendido como estado | `DoneView` | Timeline, registro e comunicação pendente são separados; não se promete envio efetivo. |
| Sem permissão | Atendido como estado | `StateView`, `view=permission` | Não expõe conteúdo nem oferece decisão para território não autorizado. |
| Conflito / outro moderador | Atendido como estado | `view=conflict` | Exige atualizar a análise antes de continuar. |
| Contestação futura | Atendido como proposta | `view=appeal` | Exibida como evolução condicionada, sem botão de funcionamento real. |
| Responsividade | Validado | Navegador interno | Mobile 389×867 e desktop 1707×960, sem overflow horizontal. |

## Ajustes finos

- O mobile segue a sequência da prancha 093: cabeçalho, autorização, território, abas, busca/filtros, fila, estados e navegação inferior.
- O desktop segue a prancha 094: rail administrativo, contexto no topbar, fila à esquerda e análise à direita, com estados complementares abaixo.
- O limite de justificativa do mock foi alinhado ao contrato documentado de até 1.000 caracteres, não ao contador ilustrativo de 500.
- Conteúdo, nomes e identificadores são demonstrativos e ficam restritos à rota de desenvolvimento; a fila real continua sendo responsabilidade dos serviços canônicos.

## Validação

- Fluxos conferidos: fila → análise → revisão → confirmação → decisão registrada; permissão, conflito e contestação também foram abertos.
- TypeScript da aplicação, ESLint direcionado e `git diff --check` passaram.
- Logs finais do navegador sem erros; abas mobile e desktop permaneceram abertas durante a comparação.

## Git

- Branch: `codex/reformulacao-entrada-comunidade`.
- Commit será restrito ao mock, aos desvios de rota/layout de desenvolvimento e à documentação deste concept.
- Alterações staged preexistentes permanecem fora do commit.
