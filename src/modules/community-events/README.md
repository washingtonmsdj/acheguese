# community-events

Bounded context canônico de Eventos da Comunidade.

## Boundary

- Eventos **nao e vertical empresarial**. O SSOT de verticais de Empresa e `src/core/verticals/config.ts`, atualmente com `gastronomy` e `education`.
- A implementação de UI e aplicação de Eventos pertence a `src/modules/community-events`.
- O namespace legado `src/features/events` foi retirado da implementação; não deve voltar a receber código runtime.
- Contratos reutilizáveis ainda existentes em `src/core/verticals/events` são dívida histórica de namespace e não transformam Eventos em vertical de Empresa.
- Consome capacidades transversais de core aprovadas; não importa implementação interna de outros `src/modules/*`.
- `location_id` e a origem territorial; datas, participantes, mídia e lifecycle permanecem no domínio de Eventos.
- `EventReadService`, `EventMutationService` e `EventRuntimeService` são contratos canônicos atuais do domínio.
- `EventEngagementService` mantém persistência em core enquanto esse contrato transversal não for realocado para um owner semântico melhor.
- `src/core/community/services/CommunityEventsRuntimeService.ts` existe apenas como compatibilidade para imports antigos e não deve receber código novo.

## Regra de consolidação

`src/modules/community-events` é o único owner físico da implementação de Eventos. A rota territorial e os guards de deploy devem apontar diretamente para este módulo. O antigo `src/features/events` é considerado namespace aposentado e sua recriação deve ser bloqueada por testes de arquitetura.
