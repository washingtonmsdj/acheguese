# Core Community Events

Owner semântico canônico dos contratos e serviços reutilizáveis de Eventos da Comunidade.

- Eventos não pertence à taxonomia de verticais empresariais em `src/core/verticals/config.ts`.
- UI/aplicação pertence a `src/modules/community-events`.
- Contratos, mapping, rotas públicas e serviços reutilizáveis de Eventos pertencem a `src/core/community-events`.
- Os namespaces históricos `src/features/events` e `src/core/verticals/events` foram removidos e não devem ser recriados.
- Callers runtime devem importar diretamente de `@/core/community-events` ou de seus subpaths canônicos.
- A consolidação de namespace não equivale a certificação funcional, de banco, RLS, E2E, build ou deploy.
