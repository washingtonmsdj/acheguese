# community-events

Bounded context de Eventos da Comunidade.

## Boundary

- Eventos **nao e vertical empresarial**. O SSOT de verticais de Empresa e `src/core/verticals/config.ts`, atualmente com `gastronomy` e `education`.
- A UI operacional ainda reside em `src/features/events` por legado estrutural. Esse namespace esta fechado para codigo novo e deve ser migrado integralmente para este modulo no lote #51, sem criar facade concorrente.
- Contratos reutilizaveis de Eventos ainda encontrados em `src/core/verticals/events` pertencem a um namespace historico e nao transformam Eventos em vertical de Empresa; a realocacao deve ocorrer somente apos inventario de callers.
- Consome capacidades transversais de `core/location`, `core/social` e demais contracts aprovados; nao importa implementacao interna de outros `src/modules/*`.
- `location_id` e a origem territorial; datas, participantes, midia e lifecycle permanecem no dominio de Eventos.
- `EventReadService`, `EventMutationService` e `EventRuntimeService` sao os contratos canonicos atuais do dominio.
- `src/core/community/services/CommunityEventsRuntimeService.ts` existe apenas como compatibilidade para imports antigos e nao deve receber codigo novo.

## Regra de consolidacao

A migracao de `src/features/events` deve preservar comportamento e testes enquanto troca o owner fisico. O destino final e `src/modules/community-events`; concluida a migracao, `src/features` deve desaparecer e o validator de arquitetura deve impedir sua recriacao.