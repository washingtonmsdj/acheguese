# G148 — Admin Motoboy Read Ownership

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

`AdminMotoboyOperationsService` ainda buscava listas e linhas de estatística por meio de `MobilityService.impl.ts`.

Esses readers eram exclusivos da superfície administrativa de motoboy e não pertenciam ao runtime genérico. Mantê-los no compatibility service prolongava uma authority paralela e deixava a projeção administrativa acoplada à classe estática legada.

## Correção

Foi criado:

`src/core/admin/services/AdminMotoboyReadService.ts`

Ele passa a ser o owner das duas leituras administrativas:

- `listDeliveries(filters)`;
- `listStatsRows()`.

A lista operacional mantém projeção explícita e exclui telefone do destinatário, proof, metadata de falha e coordenadas.

A leitura de estatísticas é ainda menor:

`status, created_at, driver_profile_id`.

`AdminMotoboyOperationsService` passou a delegar para essa authority, enquanto comandos continuam em `RideOperationalService`/`MobilityRpcService`.

Os wrappers `MobilityService.listMotoboyDeliveries()` e `MobilityService.listMotoboyStatsRows()` foram removidos fisicamente.

O tipo público `AdminMotoboyDelivery` continua reexportado pelo operations service para preservar compatibilidade de import sem duplicar o contrato.

## Ratchets

- `src/modules/mobility/__tests__/AdminMotoboyReadOwnershipG148.test.ts`;
- `src/modules/mobility/__tests__/StaticMobilityReaderRetirementG147.test.ts` foi evoluído para impedir a volta dos wrappers removidos.

## Commits

- `78cf8f15` — cria bounded admin read service;
- `c162dc09` — migra operations service;
- `879804f5` — remove wrappers do compatibility service;
- `e5d758c5` — atualiza ratchet G147;
- `fb602bc6` — adiciona ratchet G148.

## Validação

Source e diffs foram inspecionados. Ratchets foram versionados, mas este checkpoint **não declara suite/CI verde** sem execução confiável dos runners.
