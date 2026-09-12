# G143 — Boarding Point Recurrence Semantics

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

`BoardingPointService.listMostUsedPoints()` agregava somente as 300 corridas mais recentes, mas o nome e a UI apresentavam o resultado como se fosse popularidade/contagem global.

Além disso, `popular` era calculado localmente com o limiar arbitrário `ridesCount >= 5`, sem authority de produto ou agregado backend.

## Correção

- o método foi renomeado para `listRecentFrequentPoints()`;
- a janela local ficou explícita em `RECENT_BOARDING_POINT_SAMPLE_LIMIT = 300`;
- o contrato deixou de expor `popular`;
- o selo visual `Popular` foi removido;
- a descrição passou a informar que os pontos são recorrentes entre corridas recentes analisadas;
- a contagem na UI passou a ser exibida como `ocorrências na amostra recente`, sem sugerir total all-time.

A ordenação por frequência dentro da amostra foi preservada.

## Motivo para não criar métrica global agora

O projeto ainda não possui uma aggregate authority backend validada para popularidade de pontos de embarque. Criar um rótulo global a partir da amostra local seria semanticamente incorreto. Quando existir um agregado server-side certificado, esse contrato poderá evoluir sem reintroduzir limiares inventados no cliente.

## Ratchet

`src/modules/mobility/__tests__/BoardingPointRecurrenceSemanticsG143.test.ts`

Protege:

- nome coerente com amostra recente;
- janela bounded explícita;
- ausência do limiar `>= 5` e do campo `popular`;
- UI sem selo de popularidade não comprovado;
- contagem rotulada como ocorrência da amostra recente.

## Commits

- `6588a277` — correção semântica do serviço;
- `914e3ad6` — alinhamento da UI;
- `6868d0da` — ratchet.

## Validação

Source e consumidor ativo foram inspecionados. Este checkpoint não declara suite/CI verde sem execução confiável.
