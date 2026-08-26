# community-events

Bounded context canônico de Eventos da Comunidade.

## Boundary

- Eventos **nao e vertical empresarial**. O SSOT de verticais de Empresa e `src/core/verticals/config.ts`, atualmente com `gastronomy` e `education`.
- A implementação de UI e aplicação de Eventos pertence a `src/modules/community-events`.
- Os namespaces legados `src/features/events` e `src/core/verticals/events` foram removidos e não devem voltar a receber código.
- Contratos, mapping, rotas públicas e serviços reutilizáveis pertencem a `src/core/community-events`.
- Consome capacidades transversais de core aprovadas; não importa implementação interna de outros `src/modules/*`.
- `location_id` e a origem territorial; datas, participantes, mídia e lifecycle permanecem no domínio de Eventos.
- `EventReadService`, `EventMutationService`, `EventRuntimeService`, `EventEngagementService` e `EventLinkEligibilityService` têm implementação canônica em `src/core/community-events`.
- `src/core/community/services/CommunityEventsRuntimeService.ts` existe apenas como compatibilidade para imports antigos e não deve receber código novo.

## Regra de consolidação

`src/modules/community-events` é o único owner da UI/aplicação e `src/core/community-events` é o único owner dos contratos e serviços reutilizáveis. A rota territorial e os guards de deploy apontam diretamente para o módulo. Callers runtime devem usar `@/core/community-events` e não devem recriar namespaces históricos.

Essa consolidação estrutural não equivale a certificação funcional, de banco, RLS, E2E, build ou deploy.
