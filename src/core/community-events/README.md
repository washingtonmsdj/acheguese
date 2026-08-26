# Core Community Events

Owner semântico canônico dos contratos e serviços reutilizáveis de Eventos da Comunidade.

- Eventos não pertence à taxonomia de verticais empresariais em `src/core/verticals/config.ts`.
- UI/aplicação pertence a `src/modules/community-events`.
- Contratos, mapping e serviços reutilizáveis de Eventos devem convergir para `src/core/community-events`.
- `src/core/verticals/events` é namespace histórico de compatibilidade durante a migração e não deve receber implementação nova.
- Bridges históricos são one-way: namespace antigo -> owner canônico.
- A migração de namespace não equivale a certificação funcional, de banco, RLS, E2E ou deploy.
