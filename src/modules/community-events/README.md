# community-events

Modulo transversal de eventos comunitarios.

Boundary:
- Consome `core/location`, `core/social` e o vertical canonico
  `src/core/verticals/events`.
- Nao importa outros modulos `src/modules/*`.
- `location_id` e a origem territorial; datas, participantes e midia pertencem ao dominio de eventos.
- `EventReadService`, `EventMutationService` e `EventRuntimeService` sao os
  contratos canonicos. `src/core/community/services/CommunityEventsRuntimeService.ts`
  existe apenas como compatibilidade para imports antigos e nao deve ser usado
  por codigo novo.
