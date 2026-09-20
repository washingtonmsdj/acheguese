# Revisão — Perfil público profissional

Status: implementada e revisada em 20/09/2026.

Referência principal: `pranchas/010-perfil-profissional.png`.

| Item | Situação no código | Decisão | Validação |
|---|---|---|---|
| Header, território e navegação | `TerritoryTopbar` e `TerritoryAdaptiveNavigation` preservados na rota real `/servicos/:state/:city/profissional/:slug` | No preview DEV, usar o mesmo território e a navegação de Serviços mostrados na prancha; fora dele, manter o contrato público | Mobile e desktop no navegador interno |
| Hero do profissional | Avatar, nome, categoria, localização, cobertura e descrição usam `ProfessionalPublicProfile`; `concept-mock=1` só habilita dados demonstrativos em DEV | Não duplicar perfil nem criar payload público fictício | Comparação com a composição mobile/desktop da prancha |
| Ações e conversa | Salvar e compartilhar permanecem locais à sessão; CTA abre `ProfessionalLeadRequestDialog` com o canal `public_profile` | Preservar o fluxo real de lead e suas permissões; não simular envio concluído | Verificação de estados de botão e rota do diálogo |
| Serviços no mobile | As linhas usam altura deliberada e textos compactos; uma regra CSS scoped neutraliza a margem global de parágrafo que inflava cada linha | Manter o ritmo da prancha e deixar `Trabalhos realizados` dentro do viewport mobile | Viewport equivalente a 389 × 867 CSS px |
| Portfólio e cobertura | Fotografias demonstrativas vêm de `PROFESSIONAL_CONCEPT_DETAILS`; cobertura e recomendações permanecem em seções reais | Mostrar duas fotos no mobile e três no desktop, sem esconder conteúdo por gambiarra | Conferência visual da ordem e dos gaps |
| Aside desktop | Conversa, região de atendimento, orientação e denúncia ficam na coluna lateral sticky | Manter a hierarquia desktop da referência e esconder o aside somente no breakpoint mobile | Viewport equivalente a 1440 × 867 CSS px |

## Limites preservados

- O mock é exclusivo de desenvolvimento e não altera o contrato de consulta de perfis reais.
- A disponibilidade para conversar continua dependente de `is_accepting_clients`.
- Salvar, compartilhar e denunciar não inventam persistência quando o serviço correspondente não está disponível.

## Evidências técnicas

- Branch: `codex/reformulacao-entrada-comunidade`.
- Ajuste de espaçamento scoped em `src/index.css`; os defaults globais de acessibilidade não foram alterados.
- Validação prevista/conferida: `npm run typecheck:app`, ESLint do componente, testes de serviços profissionais e `git diff --check`.
