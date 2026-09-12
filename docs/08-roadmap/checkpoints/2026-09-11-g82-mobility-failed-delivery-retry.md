# G82 — Mobilidade: retry canônico de failed delivery

Data: 2026-09-11

## Estado integrado

- Base antes da integração: `d236a4c44f942bba1882b5a55f6e23a23b69c2de` (G81).
- Head funcional integrado: `a7a1accec065c757377e6642a93adb328f627ed7` (G82).
- Integração executada por fast-forward não forçado da `integrate/mobility-g82-failed-delivery-retry-main` para `main`.
- Comparação prévia: 7 commits à frente, 0 atrás, merge-base exatamente no head G81 da `main`.
- `module/mobilidade` não foi fundida integralmente, resetada nem reescrita; branches paralelas reservadas permanecem preservadas.

## Contrato corrigido

G82 remove do comando administrativo a criação/seleção de uma segunda ride para reentrega (`next_ride_id`). Quando a custódia continua com o mesmo motoboy, o backend reabre a mesma entrega canônica de forma atômica.

O fluxo exige, entre outros invariantes:

- ride em `failed_delivery` com custódia ainda no driver atribuído;
- mesmo `active_ride_id` na disponibilidade do motoboy;
- motoboy online, elegível e com heartbeat recente;
- rejeição de retry concorrente com handoff/escalonamento manual;
- preservação do handoff físico G81 como fluxo separado e confirmado pelo receptor;
- consistência de custódia com pedido de gastronomia quando aplicável;
- limpeza de linkage histórico/intent expirado antes de retomar a ride;
- retorno explícito `retry_reopened` para o core de Mobilidade.

## Arquivos do corte

- `src/core/mobility/types/FailedDeliveryMetadata.ts`
- `src/core/mobility/core/RideOperationalGuards.ts`
- `src/core/mobility/core/RideOperationalTypes.ts`
- `src/core/mobility/core/RideDeliveryOperationalActions.ts`
- `src/core/mobility/services/MobilityRpcService.ts`
- `supabase/migrations/20260911234000_reopen_failed_delivery_same_custodian_g82.sql`

## Gates e limites atuais

- A história Git foi comprovada como linear e apta a fast-forward; não houve force-push.
- O status Vercel do head G82 está vermelho por `build-rate-limit`, blocker externo já conhecido do projeto; isso não deve ser interpretado nem como aprovação nem como regressão do código.
- Não há certificação verde nova de build/security para este corte registrada neste checkpoint.
- Mobilidade continua `launch-paused`; integrar source não autoriza abertura pública nem cutover remoto automático.

## Próximo passo

Continuar a partir da `main` já atualizada, mantendo o módulo Mobilidade em ciclos pequenos e verificáveis. Antes de qualquer cutover remoto/destrutivo, revalidar migrations em ordem, contratos de segurança e smoke funcional no mesmo SHA/descendente certificado.
