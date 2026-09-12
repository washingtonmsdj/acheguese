# G128 — Weekly Earnings Read Model

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

`WeeklyEarningsChart` consumia a facade estática antiga e reconstruía ganhos localmente com um contrato parcial. O componente:

- carregava histórico sem recorte semanal explícito;
- fazia `new Date(completed_at)` mesmo quando o timestamp podia ser `null`;
- somava apenas `final_price`, ignorando o fallback canônico `actual_fare`;
- mantinha um tipo local divergente do read model privado de ganhos.

## Correção

O gráfico passou a consumir diretamente `DriverEarningsReadService.list` com `sinceIso` limitado aos sete dias exibidos.

A semântica de valor segue o read model canônico:

`final_price ?? actual_fare ?? 0`.

Para posicionamento diário, usa `completed_at ?? updated_at`, evitando transformar timestamp ausente em uma data artificial.

O read model continua self-only: o `driverProfileId` não é usado como autoridade server-side; o broker deriva o motorista da identidade autenticada.

## Ratchet

`src/modules/mobility/__tests__/WeeklyEarningsReadModelG128.test.ts`

Protege:

- uso direto de `DriverEarningsReadService`;
- consulta limitada à janela semanal;
- ausência de `suggested_price` na soma de ganhos;
- fallback `final_price/actual_fare`;
- ausência de `new Date(e.completed_at)` sobre valor nullable.

## Validação

O diff foi inspecionado e o ratchet foi versionado. Este checkpoint não declara suite/CI verde sem execução confiável.
