# G90 — Driver runtime identity boundary

Data: 2026-09-12

## Problema encontrado

`MobilityRuntimeService.getDriverData()` ainda fazia `select("*")` em `driver_data` e entregava o row inteiro para consumidores de identidade/runtime. Isso mantinha três acoplamentos indevidos:

- campos legados de presença podiam voltar a entrar no runtime mesmo após G83/G87;
- callers de autorização dependiam de um shape maior que o necessário;
- `DriverProfileLayout` tentava ler `display_name` e `avatar_url` do snapshot de `driver_data`, embora nome/avatar pertençam ao perfil de sessão.

## Correção de raiz

Foi criado `DRIVER_RUNTIME_IDENTITY_SELECT`, uma projeção explícita contendo somente:

- profile/verification/subscription;
- rating e contadores/taxas;
- CNH e veículo;
- verificação documental/background check;
- capabilities `can_do_delivery` e `can_do_rides`;
- timestamps.

Presença operacional (`is_online`, `is_available`, GPS, last seen/update e active ride) fica fora dessa projeção. `useDriverProfileIdentity` continua sobrepondo online/disponibilidade a partir de `DriverAvailabilityService`, preservando `driver_availability` como autoridade.

`DriverProfileLayout` agora usa `sessionDriverProfile.displayName` e `sessionDriverProfile.avatarUrl` para identidade pública e mantém `driverData` somente para cadastro/runtime.

## Compatibilidade preservada

A projeção mantém os campos usados por:

- `DriverGuard` (`can_do_rides`, `can_do_delivery`);
- `MotoboyAuthorizationService` (`can_do_delivery`);
- Central Mobility Hub (`background_check_status`, `acceptance_rate`, capabilities);
- cadastro de motorista/motoboy (CNH/veículo);
- snapshot operacional (rating e contadores).

## Evidência

- `23fa0ebe1eb04f4c74ab8f16bf707a487ff84c94` — projeção explícita do runtime; diff: 31 adições / 2 remoções;
- `b18bfb30c60f2c1e8b3805472a1e06521025d461` — separação nome/avatar do perfil de sessão;
- `5498a5f867616e1828e8da40b297d75d9e02eadb` — ratchet `DriverRuntimeIdentityBoundaryG90.test.ts`.

## Estado

G90 SOURCE-CLOSED.

Mobilidade continua launch-paused: `PUBLIC_LAUNCH_SURFACES.mobility=false`.

A validação executável continua dependente dos runners do repositório; os últimos workflows observados morreram antes de steps (`runner_id=0`).

G89 permanece pendente: `user-export-data` exporta presença por `driver_availability`, mas ainda inclui os espelhos legados `is_online/is_available` na projeção de `driver_data`. A correção deve ser feita sem regravar manualmente o Edge Function inteiro.
