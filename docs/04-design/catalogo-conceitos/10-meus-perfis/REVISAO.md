# Revisão — Meus perfis

Status: implementado e validado em 20/09/2026.

Referência: `pranchas/015-meus-perfis.png`.

| Item | Situação no código | Evidência | Decisão | Validação |
|---|---|---|---|---|
| Entrada mobile | `ContaHubPage` mantém retorno para Minha conta, título, CTA amarelo e navegação inferior | `/conta?concept-mock=1` | Manter o mock visual somente em DEV | Navegador interno em `389 × 867` CSS px |
| Controles de descoberta | Busca por nome, filtros Todos/Pessoal/Negócios/Profissionais e nota de favoritos | `AccountConceptPreviewPage` | Preservar filtro e busca funcionais sobre os dados demonstrativos | Busca/filtros conferidos no navegador |
| Cards de perfis | Cards pessoais, negócio, profissional pendente e perfil de equipe com ações conforme permissão | `ConceptManagedProfileCard` | Ajustar somente o ritmo local dos cards; não alterar margens globais | Alturas compactas conferidas em mobile e desktop |
| Desktop | Header territorial, rail primário/secundário, título, CTA, cards horizontais e painel de permissões | `ConceptAccountHeader` e `ConceptAccountSidebar` | Manter a responsividade sem duplicar a navegação mobile | Viewport desktop amplo conferido |
| Interações | Favoritar, abrir mensagens, editar perfil, abrir Central e expandir convites | handlers da prévia DEV | Manter rotas reais e não conceder permissões artificiais | Ações e ausência de erro de runtime conferidas |

## Ajuste aplicado

O escopo `.account-concept-page` corrige as margens editoriais globais que inflavam cada linha de metadados. Os cards passam a usar `4px` entre título/metadados e abaixo dos parágrafos, alinhando a densidade da prancha sem modificar o SSOT tipográfico das demais páginas.

Limitação mantida: os dados são demonstrativos apenas quando `concept-mock=1` em desenvolvimento; a rota sem o parâmetro continua usando o fluxo real de conta, sessão, perfis e permissões.

Branch: `codex/reformulacao-entrada-comunidade`.
