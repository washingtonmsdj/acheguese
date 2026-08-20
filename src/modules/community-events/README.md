# community-events

Bounded context canônico para a superfície de produto de Eventos comunitários.

## Ownership

- UI, páginas públicas e composição de produto pertencem a `src/modules/community-events`.
- Regras, serviços e contratos reutilizáveis podem viver em `src/core`, com nome de domínio explícito e fora da taxonomia de verticais empresariais.
- `location_id` é a origem territorial; datas, participantes, ingressos, mídia e lifecycle pertencem ao domínio de Eventos.

## Estado de migração

A implementação histórica ainda está parcialmente em `src/features/events`. Esse namespace está fechado para código novo.

`src/modules/community-events/index.ts` é a nova API pública canônica e, durante a migração, delega para o código legado. Novos consumers devem importar do módulo canônico, nunca diretamente de `src/features/events`.

A migração só termina quando:

1. callers tiverem sido movidos para `@/modules/community-events`;
2. páginas/componentes tiverem sido fisicamente realocados para este bounded context;
3. contratos reutilizáveis de Eventos tiverem owner explícito em `src/core` fora de `core/verticals`;
4. testes, rotas e documentação apontarem apenas para os owners canônicos;
5. `src/features/events` puder ser removido sem compatibility imports.

## Contratos de dados

`EventReadService`, `EventMutationService` e `EventRuntimeService` continuam sendo os contratos de runtime a preservar durante a migração. O trabalho estrutural não autoriza criar services paralelos.

`src/core/community/services/CommunityEventsRuntimeService.ts`, quando ainda necessário, é somente compatibilidade para imports antigos e não deve receber comportamento novo.
