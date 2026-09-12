# G89 — LGPD driver presence export authority

Data: 2026-09-12

## Problema encontrado

`user-export-data` já possuía uma seção canônica de `driver_availability` com online/offline, disponibilidade, last seen/update e operação ativa, mas a projeção de `driver_data` ainda exportava também os espelhos legados `is_online` e `is_available`.

Isso permitia que o mesmo pacote LGPD carregasse duas versões potencialmente divergentes do estado operacional do motorista.

## Correção de raiz

A projeção de `driver_data` do exportador removeu somente:

- `is_online`;
- `is_available`.

Os dados cadastrais, estatísticos, documentais e capabilities do motorista permanecem no agregado `driver_data`.

A presença operacional continua exportada pela seção `driver_availability`, que mantém:

- `profile_id`;
- `is_online`;
- `is_available`;
- `last_location_update`;
- `updated_at`;
- `last_seen_at`;
- `active_ride_id`;
- `busy_since`;
- `active_ride_mode`.

## Evidência

- `ed58672fdb41396c886f45b04650ae0e88f0c6a0`: diff de exatamente 1 adição / 1 remoção no Edge Function; somente a lista de colunas de `driver_data` mudou;
- `81b05b3e17396023f7d688ff453882a04eafccb6`: ratchet `user-export-driver-presence-g89.test.ts`.

## Rollout

Este gate corrige source apenas.

`LGPD_EXPORT_MATRIX_IMPLEMENTATION_COMPLETE=false` permanece intencionalmente inalterado. Nenhum deploy de `user-export-data` foi executado e este checkpoint não autoriza promoção da função enquanto preflight, CI, integração e smoke não estiverem certificados.

## Estado

G89 SOURCE-CLOSED.

Mobilidade continua launch-paused: `PUBLIC_LAUNCH_SURFACES.mobility=false`.

Próximo corte: continuar o pente-fino por referências ativas a `driver_data.is_online/is_available` fora de migrations históricas e testes, preservando `driver_availability` como SSOT operacional.
