# Revisão — Detalhe da publicação e conversa

Status: concluído em 20/09/2026.

## Referências e decisão

- Referências principais: `089-detalhe-mobile-desktop.png` e `090-detalhe-estados.png`.
- O fluxo real de `PostDetailModal`, `PostCommentsPanel`, interações, moderação e serviços de posts foi preservado.
- `DEV + concept-mock=1` em `/publicacao/eletricista` usa `PublicacaoDetalheConceptMockPage` para comparar a composição completa sem introduzir conteúdo demonstrativo na produção.

## Matriz de conferência

| Item | Situação no código | Evidência | Decisão |
|---|---|---|---|
| Contexto territorial | Atendido | `TerritoryBar`, faixa mobile e `ContextPanel` | Comunidade, bairro e território aparecem antes da conversa. |
| Publicação de pergunta | Atendido | `QuestionPost` | Autor, selo, pergunta, texto, tags, métricas e ações seguem a prancha 089. |
| Conversa e respostas | Atendido | `Conversation`, `ServiceReply`, `Comment` e `Composer` | Resposta destacada, autora, carregamento de mais comentários e composer estão presentes. |
| Painel contextual desktop | Atendido | `ContextPanel` | Regras, denúncia e encaminhamento para Serviços ficam fora do conteúdo principal. |
| Resposta com falha | Atendido como estado visual | `view=reply` | Texto é mantido e o erro é explícito; nenhum envio real é disparado pelo mock. |
| Enquete encerrada | Atendido como estado visual | `PollPost`, `view=poll` | Barras, percentuais, votos encerrados, voto do usuário e conversa preservam a semântica. |
| Aviso atualizado | Atendido como estado visual | `UpdatedPost`, `view=update` | Situação normalizada, linha do tempo e aviso de não oficialidade. |
| Falta de vínculo | Atendido como estado visual | `BlockedPrompt`, `view=blocked` | Responder exige confirmação, mas explorar permanece disponível. |
| Rota real | Preservada | `PostDetailModal` e `ComunidadePage` sem alteração funcional | O desvio é somente DEV + `concept-mock=1`; sem flag retorna à navegação pública. |
| Responsividade | Validado | Navegador interno | Mobile 389×867 e desktop 1707×960, sem overflow horizontal. |

## Ajustes finos

- O mobile usa cabeçalho com retorno à Comunidade, linha territorial, post, métricas, conversa e composer na ordem da prancha 089.
- O desktop usa rail, topbar teal, coluna principal de conversa e painel lateral “Sobre esta conversa”, mantendo a hierarquia da referência.
- Tipografia, cores, bordas, raios e espaçamentos usam tokens/classes SSOT. Nenhum layout foi resolvido com imagem ou estilo inline de posicionamento.
- Estados são endereçáveis por `view` para inspeção individual e não representam persistência real.

## Validação

- Estados conferidos: pergunta, resposta com falha, enquete encerrada, aviso atualizado e falta de vínculo.
- TypeScript da aplicação, ESLint direcionado e `git diff --check` passaram.
- Logs finais do navegador sem erros; mobile e desktop permaneceram abertos durante a comparação.

## Git

- Branch: `codex/reformulacao-entrada-comunidade`.
- Commit será restrito ao mock, ao desvio de rota/layout de desenvolvimento e à documentação deste concept.
- Alterações staged preexistentes permanecem fora do commit.
