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
- motoboy online, elegível e com heartbeat/localização recentes;
- rejeição de retry concorrente com handoff/escalonamento manual;
- preservação do handoff físico G81 como fluxo separado e confirmado pelo receptor;
- consistência de custódia com pedido de gastronomia quando aplicável;
- limpeza de linkage histórico/intent expirado antes de retomar a ride;
- retorno explícito `retry_reopened` para o core de Mobilidade.

## Arquivos do corte funcional

- `src/core/mobility/types/FailedDeliveryMetadata.ts`
- `src/core/mobility/core/RideOperationalGuards.ts`
- `src/core/mobility/core/RideOperationalTypes.ts`
- `src/core/mobility/core/RideDeliveryOperationalActions.ts`
- `src/core/mobility/services/MobilityRpcService.ts`
- `supabase/migrations/20260911234000_reopen_failed_delivery_same_custodian_g82.sql`

## Hardening pós-integração na main

A varredura pós-fast-forward encontrou dois resíduos incompatíveis com o contrato novo e eles foram corrigidos na causa raiz:

- `247f84a80650b9d960fc835179344fe396fc25bf` — atualiza `tests/operational/gate3-failed-delivery-metadata.test.ts` para importar o owner canônico em `src/core/mobility`, tratar `next_ride_id` somente como metadata histórica de leitura e validar `retry_delivery_requested`/handoff G81-G82;
- `bc139775f08c6c71f88eee79000044156f2023bd` — transforma `tools/supabase/validate-gate3-simple.mjs` em probe estritamente read-only; o script legado não faz mais DML direto em `ride_requests` com cliente anônimo;
- `91d351ce511a1e5f05594ba8ae3cfeb704850828` — adiciona `MobilityFailedDeliveryRetryG82.test.ts`, ratchet de regressão para o boundary G82, mesma ride, custódia, presença/localização fresca, elegibilidade e integração com Gastronomia.

## Gates e limites atuais

- A história Git foi comprovada como linear e apta a fast-forward; não houve force-push.
- O status Vercel do head funcional G82 ficou vermelho por `build-rate-limit`, blocker externo já conhecido do projeto; isso não deve ser interpretado nem como aprovação nem como regressão do código.
- O ambiente de execução desta integração não conseguiu resolver `github.com` via terminal para uma instalação/execução local completa; por isso este checkpoint não declara certificação verde nova de build/security.
- A ausência de certificação verde não autoriza relaxar gates nem fazer cutover remoto destrutivo.
- Mobilidade continua `launch-paused`; integrar source não autoriza abertura pública nem cutover remoto automático.

## Próximo passo

Continuar a partir da `main` já consolidada, mantendo Mobilidade em ciclos pequenos e verificáveis. Antes de qualquer cutover remoto/destrutivo, revalidar migrations em ordem, contratos de segurança e smoke funcional no mesmo SHA/descendente certificado.
