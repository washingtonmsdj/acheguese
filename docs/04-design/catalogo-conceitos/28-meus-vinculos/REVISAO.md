# Revisão — Meus vínculos e participação

Status: concluído em 20/09/2026.

## Referências e decisão

- Referências principais: `091-meus-vinculos-mobile.png` e `092-meus-vinculos-desktop.png`.
- Complementos considerados: `083-vinculo-solicitacao-mobile.png`, `084-vinculo-permissoes-mobile.png` e `085-vinculo-gestao-desktop.png`.
- O código de produção existente (`CommunityAccessPolicy`, `ResidentVerificationCard`, serviços e gestores de vínculos) não foi substituído nem exposto como mock.
- `DEV + concept-mock=1` em `/conta/vinculos` usa `MeusVinculosConceptMockPage` para revisão visual e de estados; sem `concept-mock`, a rota continua protegida e encaminha à configuração existente.

## Matriz de conferência

| Item | Situação no código | Evidência | Decisão |
|---|---|---|---|
| Meu vínculo confirmado | Atendido | `MobileConfirmed` / `DesktopConfirmed` | Comunidade, cidade, bairro, relação, status e atualização são apresentados sem prometer privilégio universal. |
| Participação por perfil | Atendido | `PermissionsView` e `Capabilities` | Leitura, publicação, enquetes, comunicados e moderação distinguem permitido de restrito. |
| Solicitação em análise | Atendido | `PendingView`, `view=pending` | Timeline, data demonstrativa, privacidade da solicitação e exploração sem duplicar solicitação. |
| Confirmação indisponível | Atendido | `UnavailableView`, `view=unavailable` | Método desativado não abre upload; explica a limitação e mantém exploração disponível. |
| Atualização de vínculo | Atendido como proposta | `UpdateView`, `view=update` | Moradia/trabalho/estudo aparecem como opções demonstrativas, com aviso de nova análise. |
| Complementação | Atendido como proposta | `ComplementView`, `view=complement` | É separado de rejeição e só orienta reenvio conforme método habilitado. |
| Outros perfis | Atendido | `BusinessProfile` | Negócio possui contexto e permissões próprios; não herda as permissões pessoais. |
| Produção e permissões | Preservado | desvio de rota condicionado a DEV | O mock não persiste, não autoaprova, não publica e não expõe evidências privadas. |
| Responsividade | Validado | Navegador interno | Mobile 389×867 e desktop 1707×960, sem overflow horizontal. |

## Ajustes finos

- O mobile reproduz cabeçalho com retorno para Conta/Meus vínculos, perfil selecionável, cartão do Complexo, ações, permissões, exploração e outros perfis.
- O desktop reproduz rail teal, topbar territorial, seletor de perfil, cartão principal, território explorado, painel de participação e vínculo de negócio em grade própria.
- Tipografia, cores, raios, bordas e espaçamentos usam tokens/classes do projeto. Não foram adicionados estilos inline ou dados conectados a produção.
- Os estados são endereçáveis por `view` para comparação isolada e retornam ao estado confirmado sem apagar histórico real.

## Validação

- Estados conferidos: confirmado, permissões, análise, indisponível, atualização e complementação.
- TypeScript da aplicação, ESLint direcionado e `git diff --check` passaram.
- Logs finais do navegador sem erros; abas mobile e desktop permaneceram abertas durante a conferência.

## Git

- Branch: `codex/reformulacao-entrada-comunidade`.
- Commit será restrito à página de concept, desvios de rota/layout de desenvolvimento e documentação.
- Alterações staged preexistentes permanecem fora do commit.
