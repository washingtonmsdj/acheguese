# G86 — Driver registration authority

Data: 2026-09-12

## Problema encontrado

Depois do G85, a tela administrativa de detalhe já usava a nova autoridade canônica, mas duas rotas de governança ainda dependiam de `ProfileService.getDriverData(profileId)`. Esse método era um stub morto que sempre retornava `null`, portanto:

- `loadEntityMaps()` podia omitir silenciosamente a entidade driver;
- `getProfileDetail()` podia construir detalhe de governança sem driver cadastral mesmo quando ele existia;
- `ProfileService` continuava expondo uma API genérica sem implementação, convidando novos callers a depender de um contrato falso.

## Correção de raiz

A leitura cadastral de driver agora usa exclusivamente `DriverService` de `src/core/profiles/services/multi-profile/driverService.ts` nos dois pontos administrativos restantes.

Esse owner lê somente o agregado cadastral necessário para CNH, veículo, verificação documental e background check. Presença operacional, disponibilidade, localização e ride ownership continuam fora desse contrato e pertencem às authorities de `driver_availability`/Mobilidade.

Mudanças:

- `AdminProfileGovernanceLoaders.loadEntityMaps()` migrou de `profileService.getDriverData()` para `DriverService.getDriverData()`;
- `AdminProfileGovernanceService.getProfileDetail()` migrou para o mesmo owner canônico;
- `ProfileService.getDriverData()` foi removido fisicamente após os callers runtime conhecidos serem migrados;
- `DriverRegistrationAuthorityG86.test.ts` impede o retorno da API genérica e exige que governança use `DriverService`;
- o ratchet também protege o reader cadastral contra campos de presença operacional.

## Evidência de diff

- `90a1ca9dd5704b0633ca2b5df6b60e4d7d47049f`: 3 adições / 2 remoções em `AdminProfileGovernanceLoaders.ts`;
- `19ce37b88d554d9dc74923d9cf509c739f162bfa`: 4 adições / 5 remoções em `AdminProfileGovernanceService.ts`;
- `e32b9da958438654083193b83d676d0f425c2301`: exatamente 4 remoções em `ProfileService.ts`, correspondentes somente ao stub morto;
- `c5a64c37a2265a0343fcfe6b5881d80101844e59`: ratchet G86.

## Limite deste gate

`src/core/mobility/services/mobility.queries.ts` ainda possui um `getDriverData(profileId)` próprio que lê o agregado runtime de `driver_data` e é consumido por `DriverService.impl.ts`. Ele não foi removido neste gate porque serve um contrato diferente do reader cadastral e ainda carrega rating/total de corridas/verificação para o runtime.

Esse caminho, porém, ainda usa `select("*")` e deve ser auditado no próximo gate para separar explicitamente os campos runtime necessários e impedir que presença legada de `driver_data` volte a contaminar o domínio operacional.

## Estado

G86 SOURCE-CLOSED.

Mobilidade continua launch-paused: `PUBLIC_LAUNCH_SURFACES.mobility=false`.

A indisponibilidade/instabilidade dos runners não deve ser interpretada como certificação verde. O próximo gate deve auditar os read models runtime de `driver_data`, reduzir `select("*")` e preservar a autoridade operacional de `driver_availability`.
