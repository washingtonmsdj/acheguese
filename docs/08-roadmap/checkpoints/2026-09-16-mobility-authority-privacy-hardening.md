# Mobilidade — autoridade server-owned e minimização de dados

**Data:** 2026-09-16  
**Linha:** `main`  
**Status:** source endurecido; GPS, autorização negativa e preço terminal reconciliados; rollout público continua pausado

## Objetivo desta fase

Fechar dívida estrutural antes de adicionar novas features de Mobilidade: preço, criação, conclusão, GPS, PII operacional e histórico não podem depender de autoridade implícita do browser nem de caminhos legados paralelos.

## Autoridade de criação e preço

O contrato canônico é:

`UI/hook -> MobilityPriceQuoteService -> mobility-pricing-rpc -> mobility_price_quotes -> MobilityCreationService -> mobility-create-rpc -> RPC atômico por quote_id`

Invariantes:

- browser não escolhe tarifa, regra, coordenadas canônicas ou território da criação;
- quote é server-owned, expira, é vinculada ao passageiro/modalidade/endereços/regra-versão e é single-use;
- `mobility_create_ride_atomic` e `mobility_create_delivery_atomic` usam `p_quote_id` como autoridade;
- regras atuais permanecem `commercial_status=provisional`; nenhuma tarifa fictícia é política comercial aprovada;
- sem regra aprovada, produção deve falhar fechado;
- `PricingService` não possui motor local de tarifa/fallback monetário;
- hooks locais de estimativa foram aposentados e o raw `PricingService` não é API pública.

## Broker operacional

`supabase/functions/mobility-rpc/index.ts` não possui criação paralela nem autoridade de preço final. Criação pertence a `mobility-create-rpc`; `tests/architecture/mobility-rpc-boundary.test.ts` trava essa separação.

**Cutover de produção já concluído:** `mobility-rpc` v32 ACTIVE, `verify_jwt=true`, sem paths legados de criação/`finalPrice`.

## Preço terminal

A conclusão de corrida/entrega não aceita preço de UI/motorista como autoridade. O banco deriva o valor terminal do estado persistido pela quote/corrida.

Nesta retomada, a compatibilidade pública `p_final_price` foi removida:

- o broker atual já chamava `mobility_transition_delivery_state_atomic` por argumentos nomeados sem `p_final_price`;
- não havia rotina PostgreSQL dependente do wrapper público;
- a assinatura antiga `(uuid,text,text,text,text,jsonb,numeric,jsonb)` foi removida;
- a assinatura atual `(uuid,text,text,text,text,jsonb,jsonb)` permanece `SECURITY DEFINER`, com EXECUTE somente para `service_role`;
- a implementação base privada continua recebendo `NULL::numeric`, preservando a autoridade monetária server-owned;
- migration remota e Git usam `20260916233125_remove_mobility_delivery_final_price_compat`;
- `tests/architecture/mobility-build-contract.test.ts` impede reintrodução do parâmetro no boundary/broker.

## Minimização de PII e leituras

- `RideRequestReadModel` não inclui PII sensível de entrega;
- histórico terminal usa read model redigido;
- `useActiveRide` consulta somente estados abertos por Profile ID;
- `useMobilidade` mantém queryFn sem `setState`;
- diagnóstico Motoboy usa `HEAD` para validar schema sem materializar PII;
- `MotoboyDeliveryActions` só renderiza PII durante necessidade operacional ativa.

## GPS

`20260916133000_minimize_idle_driver_gps.sql` foi aplicada no Supabase canônico.

Contrato ativo:

- limpa GPS de `driver_availability` quando motorista fica ocioso/indisponível sem corrida;
- remove snapshot de `driver_locations` nessa condição;
- rejeita novo GPS preciso fora de `available || active_ride`;
- triggers privadas não possuem EXECUTE para `PUBLIC`, `anon` ou `authenticated`.

Verificação pós-DDL:

- migration registrada remotamente como `minimize_idle_driver_gps`;
- triggers canônicos presentes;
- `idle_availability_with_gps = 0`;
- `idle_driver_location_snapshots = 0`.

## Autorização negativa

`tests/security/mobility-participant-authorization-remote-probe.sql` foi executado no projeto canônico em transação rollback-only.

Terceiro usuário autenticado foi bloqueado ao tentar:

- `refresh_operational_pin_for_requester`;
- `submit_ride_trust_feedback`;
- `create_ride_report`.

Nenhum dado sintético do probe foi preservado.

## Safety / SOS

Permanece válido `2026-09-16-mobility-safety-production-drift-repair.md`: outbox G71-G80 e `send-emergency-email` v33 já haviam sido reconciliados.

## Bloqueadores atuais de lançamento

1. definir e aprovar a política comercial real por modalidade;
2. regenerar tipos Supabase a partir do schema real, sem edição manual;
3. provar concorrência/idempotência em dupla aceitação, cancelamento simultâneo, retry/reconnect, quote duplicada e confirmação duplicada;
4. executar typecheck, lint, testes de Mobilidade/Pricing, build e E2E no mesmo SHA;
5. obter pipeline/deploy verde; o status Vercel segue bloqueado por `build-rate-limit`, o que não é certificação positiva nem falha de source;
6. proteger `main` por ruleset/required checks quando houver capacidade administrativa.

## Fechado nesta retomada

- [x] canal PostgreSQL administrativo acessível;
- [x] minimização de GPS aplicada e verificada;
- [x] probe negativo IDOR/BOLA PIN/trust/report executado rollback-only;
- [x] zero snapshots de GPS ocioso após a migration;
- [x] `p_final_price` removido do wrapper público com cutover versionado e ratchet de arquitetura.

## Regra de lançamento

`PUBLIC_LAUNCH_SURFACES.mobility` permanece `false`. Nenhuma feature nova deve contornar os owners acima. Primeiro fecham-se política comercial, concorrência, tipos e gates same-SHA; depois entram novas implementações.
