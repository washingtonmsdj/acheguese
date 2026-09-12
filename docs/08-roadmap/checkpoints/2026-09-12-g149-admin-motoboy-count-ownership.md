# G149 — Admin Motoboy Count Ownership

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

Depois do G148, listas e estatísticas operacionais de motoboy já pertenciam a `AdminMotoboyReadService`, mas `AdminService` ainda cruzava a fronteira para `MobilityService.impl.ts` apenas para duas contagens de entregas concluídas.

Isso mantinha dois wrappers genéricos sem necessidade:

- `countDeliveredBySource`;
- `countDeliveredMotoboyRides`.

## Correção

`AdminMotoboyReadService` passou a expor:

- `countDeliveredBySource(sourceType, sourceId)`;
- `countDeliveredTotal()`.

Ambos usam contagem `exact + head`, filtram `ride_mode = motoboy` e `status = delivered`, sem baixar linhas de corrida.

`AdminService` passou a consumir diretamente a authority administrativa para:

- resumo de entregas por empresa;
- total global de entregas.

A dependência `AdminService -> MobilityService` foi removida.

Os dois wrappers de contagem foram apagados de `MobilityService.impl.ts`, cuja compatibility surface agora mantém somente:

- `ensureDriverDataRow`;
- `getRideById`.

## Ratchets

- `src/modules/mobility/__tests__/AdminMotoboyCountOwnershipG149.test.ts`;
- `src/modules/mobility/__tests__/StaticMobilityReaderRetirementG147.test.ts` foi evoluído para impedir a volta dos wrappers.

## Commits

- `6f5f3c09` — adiciona contagens ao owner administrativo;
- `27fd684a` — migra `AdminService`;
- `fe7bed71` — remove wrappers genéricos;
- `36d2fbbf` — evolui ratchet G147;
- `268d9eb9` — adiciona ratchet G149.

## Validação

Source e diffs foram inspecionados. Ratchets foram versionados. Este checkpoint **não declara suite/CI verde** sem execução confiável dos runners.
