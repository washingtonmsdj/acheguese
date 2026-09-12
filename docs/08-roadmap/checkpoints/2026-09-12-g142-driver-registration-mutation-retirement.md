# G142 — Driver Registration Mutation Retirement

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

`mobility.mutations.ts` ainda mantinha um segundo caminho de atualização cadastral de motorista: `updateDriverData()`.

Esse caminho:

- duplicava a atualização self-service já existente no runtime/perfil canônico;
- fazia `driver_data.select("*")` quando o sanitizer removia todas as alterações;
- era exposto por `DriverService.updateDriverRegistration()` e pelo façade público, embora não houvesse consumidor ativo desse contrato.

## Correção

Foram removidos:

- `mobility.mutations.updateDriverData()`;
- o import do sanitizer que existia apenas para essa mutation;
- `DriverService.updateDriverRegistration()`;
- o reexport/função correspondente em `MobilityService.ts` / `MobilityFacade`.

O fluxo ativo `mobilityService.updateDriverData()` em `MobilityRuntimeService` foi preservado. Ele continua usando `sanitizeDriverSelfServiceUpdate()` e a RPC `update_owned_driver_data`, sem alterar a authority de presença.

O cadastro multi-profile existente permanece como authority própria para fluxos de perfil/cadastro.

## Ratchet

`src/modules/mobility/__tests__/DriverRegistrationMutationRetirementG142.test.ts`

Protege:

- ausência da mutation duplicada e do `select("*")` associado;
- ausência do façade morto em `DriverService`;
- ausência do símbolo no façade público;
- permanência explícita do caminho runtime canônico.

## Commits

- `0a7741fd` — aposentadoria da mutation duplicada;
- `33286ca9` — remoção do façade morto de `DriverService`;
- `14182eed` — remoção do reexport público;
- `c9c081f0` — ratchet.

## Validação

Usos foram mapeados antes da remoção e o caminho runtime ativo foi preservado. Este checkpoint não declara suite/CI verde sem execução confiável.
