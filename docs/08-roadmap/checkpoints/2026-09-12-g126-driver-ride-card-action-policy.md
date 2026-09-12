# G126 — Driver Ride Card Action Policy

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

`DriverRidesList` mantinha uma segunda policy de ações com arrays locais de estados para iniciar/cancelar corrida. Essa lógica incluía `driver_assigned` como estado iniciável, embora a state machine exija primeiro o aceite do motorista e a progressão operacional subsequente.

O card também duplicava autorização de aceite no cliente e resolvia o perfil com `getProfileByType(activeProfile.id, "driver")`, misturando Profile UUID com User UUID. Além de incorreto, esse preflight repetia verificações de verificação/online/assinatura que pertencem às authorities operacionais e server-side.

## Correção

- removidos `canStartStatuses` e `canCancelStatuses`;
- ações do card derivam de `getDriverRideActionAvailability(ride.status)`;
- `canStart`, `canComplete` e `canCancel` vêm de `DriverRideActionPolicy`, que deriva de `RideStateMachine`;
- removida a pré-validação local de perfil/`driver_data` antes do callback de aceite;
- o card mantém somente loading e apresentação; execução/autorização continuam nos callbacks canônicos e no servidor.

As superfícies operacionais principais já passam pelo `CanonicalDriverRidesList`, que também usa a mesma policy por corrida.

## Ratchet

`src/modules/mobility/__tests__/DriverRideCardActionPolicyG126.test.ts`

Protege:

- uso de `getDriverRideActionAvailability`;
- ausência dos arrays locais de ação;
- ausência de `getProfileByType`/`getDriverVerificationStatus` no card;
- ausência das verificações locais de `subscription_active` e presença;
- manutenção dos callbacks como fronteira de execução.

## Validação

Source/diff foi inspecionado e o ratchet foi versionado. Este checkpoint não declara suite/CI verde sem execução confiável.
