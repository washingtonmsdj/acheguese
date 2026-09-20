# Revisão — Central de notificações

Status: concluída em 20/09/2026.

Branch auditada: `codex/reformulacao-entrada-comunidade`
Commit-base: `16acd11c9`
Referências comparadas: `072-notificacoes-mobile.png`, `074-notificacoes-estados.png` e `075-notificacoes-desktop.png`.

| Item | Situação no código | Evidência | Decisão | Validação |
|---|---|---|---|---|
| Lista e detalhe | Precisava ajustar | `src/app/pages/NotificationsPage.tsx` dependia do `NotificationCenter` genérico e não reproduzia a composição das pranchas | Criar superfície de conceito dedicada em desenvolvimento, mantendo o centro real intacto | Mobile/desktop conferidos |
| Filtros | Ausente na tela atual | A referência separa perfil relacionado, assunto, aplicar/limpar e aviso de escopo | Implementar drawer/painel de filtro com estados demonstrativos, sem alterar preferências de recebimento | Painel aberto nos dois viewports |
| Contexto e ações | Parcial | `NotificationItem` não tinha o painel contextual proposto com pedido, acesso como perfil e ações separadas | Implementar detalhe de `#1042`, marcar como lida, remover aviso e preferências | Detalhe e opções conferidos |
| Estados operacionais | Incompletos | A página atual não oferecia vazio, erro de carregamento ou conteúdo indisponível no modo revisável | Implementar estados `empty`, `error` e `unavailable` via `state` demonstrativo | Rotas abertas e sem overflow |
| Produção e contrato | Atendidos | Persistência continua em `@/core/notifications` | Selecionar mock somente com `import.meta.env.DEV` e `concept-mock=1`; não simular chamadas reais | Rota real permanece protegida |

## Implementação

- Adicionado `src/app/pages/NotificationsConceptMockPage.tsx` com shell responsivo, rail desktop, cabeçalho mobile, navegação inferior, lista, detalhe, filtros, menu de opções, confirmação de leitura e estados 074.
- As rotas `/notificacoes?concept-mock=1` e `/notifications?concept-mock=1` usam a superfície de revisão; `/notificacoes` sem o parâmetro continua em `ProtectedRoute` e `NotificationsPage`.
- Estados adicionais são navegáveis por `state=filter`, `state=detail`, `state=options`, `state=empty`, `state=error`, `state=unavailable` e `state=mark-all`. São dados demonstrativos e não alteram a central persistida.

## Validação

- Navegador interno mantido aberto em mobile `389 × 867` e desktop `1707 × 960` durante as comparações.
- Conferidos lista inicial, filtros, detalhe do pedido, menu de opções, confirmação de marcar todas, vazio, erro e conteúdo indisponível.
- `document.documentElement.scrollWidth` não ultrapassou `innerWidth`; logs finais do navegador sem erros.
- Executados: ESLint direcionado, `npx tsc -b tsconfig.app.json tsconfig.node.json --pretty false --force` e `git diff --check`.

## Limitações preservadas

- Perfil, assunto, leitura, remoção, paginação e sincronização real continuam dependendo do contrato e serviços de `@/core/notifications`; o mock não cria notificações nem resolve tarefas relacionadas ao aviso.

Registrar branch/commit analisado, data, limitações e funcionalidades mantidas desativadas.
