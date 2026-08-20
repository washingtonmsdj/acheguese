# community-events

Bounded context canônico para a superfície de produto de Eventos comunitários.

## Ownership

- UI, páginas públicas e composição de produto pertencem a `src/modules/community-events`.
- Contratos, tipos e serviços reutilizáveis de domínio pertencem a `src/core/events`.
- `location_id` é a origem territorial; datas, participantes, ingressos, mídia e lifecycle pertencem ao domínio de Eventos.
- `src/core/verticals/events` e `src/features/events` são apenas caminhos de compatibilidade e não podem receber comportamento novo.

## Estado de migração

A implementação física de componentes, hooks, tipos, utilitários e páginas já foi realocada para os owners canônicos:

- produto/UI: `src/modules/community-events`;
- domínio/runtime: `src/core/events`.

`src/features/events` permanece temporariamente apenas como ponte de reexport para deep imports antigos. O gate `tests/architecture/source-structure-governance.test.ts` impede que esse namespace volte a acumular implementação e impede dependência reversa de `src/modules/community-events` para `@/features/events`.

`src/modules/community-events/index.ts` é a API pública canônica. Novos consumers devem importar do módulo canônico, nunca de `src/features/events`.

A migração só termina quando:

1. callers externos restantes forem movidos para `@/modules/community-events`;
2. referências residuais a `@/core/verticals/events` forem trocadas por `@/core/events`;
3. testes, rotas e documentação apontarem apenas para os owners canônicos;
4. `src/features/events` e `src/core/verticals/events` puderem ser removidos sem compatibility imports.

## Contratos de dados

`EventReadService`, `EventMutationService`, `EventRuntimeService` e `EventEngagementService` em `src/core/events` são os contratos de runtime a preservar. O trabalho estrutural não autoriza criar services paralelos.

`src/core/community/services/CommunityEventsRuntimeService.ts`, quando ainda necessário, é somente compatibilidade para imports antigos e não deve receber comportamento novo.
