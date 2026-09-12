# G114 — Retire Complete Admin Driver Directory

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

Após G112/G113, `adminMobilityService.getAllDriversComplete()` e `MobilityAdminQueryService.getAllDriversComplete()` ficaram sem consumidores de runtime.

O método ainda mantinha disponível um read model global com:

- identidade;
- avatar;
- rating;
- total de corridas;
- verificação;
- modelo/placa de veículo.

Mesmo órfão, esse caminho ampliava superfície de regressão e contradizia a separação de readers específicos criada nos gates mais recentes.

## Correção

Foram removidos:

- `AdminMobilityService.getAllDriversComplete()`;
- `MobilityAdminQueryService.getAllDriversComplete()`;
- `DriverAnalyticsDirectoryRow`;
- `DriverAnalyticsProfileRelation`;
- `AdminDriverAnalyticsRow`;
- normalizadores/mappers exclusivos desse DTO.

O analytics usa agora exclusivamente `AdminMobilityAnalyticsDriverReadService`:

- `listMetricRows()` para `profile_id + is_verified` globais;
- `listDirectory(profileIds)` somente para identidade dos motoristas relevantes ao ranking da janela.

O realtime permanece separado pelo G112.

## Ratchets

- `DriverReaderConsolidationG107.test.ts` foi atualizado para proibir o reader aposentado;
- `AdminCompleteDriverDirectoryRetirementG114.test.ts` protege a ausência do API/DTO legado e exige os readers específicos do G113.

## G104

O G104 server-side aggregate continua necessário porque o browser ainda recebe linhas globais mínimas de motoristas e ratings. G114 reduz exposição/código morto, mas não declara a agregação client-side como solução final.

O preflight SQL remoto de 2026-09-12 continuou indisponível por timeout inclusive em `select 1`; nenhum DDL/migration foi aplicado.

## Validação

Source/diffs foram inspecionados e ratchets versionados. Este checkpoint não declara suite/CI verde sem execução confiável.
