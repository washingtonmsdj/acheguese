# G123 — Passenger Realtime Identity Boundary

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

O hook genérico `useMobilidade` habilitava realtime por padrão e fluxos de passageiro/entrega podiam reutilizar `auth.users.id` como se fosse `passenger_profile_id`. Além de misturar identidades de domínios diferentes, isso criava subscriptions mais amplas do que o necessário.

## Correção

- `useMobilidade` agora usa `realtimeEnabled = false` por padrão;
- o dashboard do passageiro opta explicitamente por realtime;
- o realtime do passageiro é ride-scoped por `activeRide.id`;
- `useDelivery` acompanha somente `activeDelivery.id`;
- a ausência de corrida/entrega ativa desliga a subscription;
- mutações de motorista que estavam mortas no hook de passageiro foram removidas.

Isso preserva a separação entre Auth User UUID e Profile UUID e reduz a superfície realtime ao recurso operacional concreto.

## Ratchet

`src/modules/mobility/__tests__/PassengerRealtimeIdentityBoundaryG123.test.ts`

Protege:

- realtime genérico opt-in;
- subscription ride-scoped no passageiro;
- subscription ride-scoped na entrega;
- ausência de `userId: user?.id` nesses caminhos;
- ausência das mutações de motorista removidas;
- opt-in explícito apenas na superfície que realmente precisa do hook genérico.

## Validação

Source/diffs foram inspecionados e o ratchet foi versionado. Este checkpoint não declara suite/CI verde sem execução confiável.
