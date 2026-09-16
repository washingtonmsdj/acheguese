# Mobilidade — autoridade server-owned e minimização de dados

**Data:** 2026-09-16  
**Linha:** `main`  
**Status:** source endurecido; migration GPS aplicada; probe negativo executado; rollout público continua pausado

## Objetivo desta fase

Fechar dívida estrutural antes de adicionar novas features de Mobilidade: preço, criação, conclusão, GPS, PII operacional e histórico não podem depender de autoridade implícita do browser nem de caminhos legados paralelos.

## Autoridade de criação e preço

O contrato canônico agora é:

`UI/hook -> MobilityPriceQuoteService -> mobility-pricing-rpc -> mobility_price_quotes -> MobilityCreationService -> mobility-create-rpc -> RPC atômico por quote_id`

Invariantes:

- browser não escolhe tarifa, regra, coordenadas canônicas ou território da criação;
- quote é server-owned, expira, é vinculada ao passageiro/modalidade/endereços/regra-versão e é single-use;
- `mobility_create_ride_atomic` e `mobility_create_delivery_atomic` usam `p_quote_id` como autoridade;
- regras atuais permanecem `commercial_status=provisional`; nenhuma tarifa fictícia é política comercial aprovada;
- sem regra aprovada, produção deve falhar fechado;
- `PricingService` não possui mais motor local de tarifa, fallback monetário, velocidade média fictícia ou janela/multiplicador de pico hardcoded;
- hooks locais de estimativa foram aposentados e o raw `PricingService` não é API pública.

## Broker operacional

O source atual de `supabase/functions/mobility-rpc/index.ts` deixou de possuir:

- actions `createRide` / `createDelivery`;
- `handleCreateRide` / `handleCreateDelivery`;
- `rideCreationRpcParams`;
- piso comercial local de R$ 5;
- parsing/serialização de `finalPrice`;
- chamadas aos RPCs de criação.

Criação pertence exclusivamente a `mobility-create-rpc`. O teste `tests/architecture/mobility-rpc-boundary.test.ts` trava essa separação.

**Cutover de produção concluído:** `mobility-rpc` está **v32 ACTIVE**, com `verify_jwt=true`. O bundle implantado foi relido depois do deploy e confirma ausência das actions/handlers de criação e de `finalPrice`, preservando MFA administrativo, dispatch, transições, presença/localização e o rate limit compartilhado fail-closed.

## Preço terminal

A conclusão de corrida/entrega deixou de aceitar preço de UI/motorista como autoridade. O banco deriva o valor terminal do estado monetário persistido pela quote/corrida. O parâmetro SQL `p_final_price` permanece apenas como compatibilidade de assinatura e não é mais enviado pelo broker operacional; sua remoção física ainda precisa de reconciliação específica antes do cutover.

## Minimização de PII e leituras

- `RideRequestReadModel` continua bounded e não inclui `recipient_phone`, `recipient_name`, `delivery_notes`, `proof_of_delivery`, `failed_delivery_metadata` ou `package_description`.
- histórico terminal do motorista usa `DriverRideHistoryReadService`, com precisão `region_label` e sem contato do passageiro/destinatário.
- `useActiveRide` não carrega mais todo o histórico para descobrir uma corrida aberta: resolve o perfil ativo e usa `getActiveRide(profileId)`.
- `useMobilidade` não executa `setState` dentro do `queryFn`; a reconciliação do active ride ocorre em `useEffect` a partir do resultado cacheado.
- o diagnóstico de schema do Motoboy usa `HEAD` ao selecionar colunas sensíveis, validando capacidade sem materializar uma linha real com telefone/notas/prova de entrega.
- `MotoboyDeliveryActions` só pode renderizar PII entre `driver_accepted` e `in_delivery`; pré-aceite e estado terminal falham fechado na própria boundary do componente.
- `RideService.getActiveRide` nomeia e encaminha explicitamente `userProfileId`, evitando confusão Auth User ID x Profile ID.

Regressões novas/atualizadas:

- `ActiveRideOpenProjectionG140.test.ts`;
- `MotoboyRuntimePiiBoundaryG141.test.ts`;
- G137/G138 alinhados à identidade por Profile ID.

## GPS

`20260916133000_minimize_idle_driver_gps.sql` foi aplicada no projeto Supabase canônico nesta retomada via migration administrada.

O contrato ativo agora:

- limpa `driver_availability.current_lat/current_lng/last_location_update` quando o motorista fica offline/indisponível sem corrida ativa;
- remove snapshot de `driver_locations` nessa condição;
- recusa novo GPS preciso quando o motorista não está disponível para dispatch e não possui corrida ativa;
- funções trigger privadas permanecem sem EXECUTE para `PUBLIC`, `anon` e `authenticated`.

Verificação pós-DDL:

- migration registrada no histórico remoto como `minimize_idle_driver_gps`;
- triggers canônicos presentes em `driver_availability` e `driver_locations`;
- `idle_availability_with_gps = 0`;
- `idle_driver_location_snapshots = 0`.

Observação: o registro remoto recebeu versão administrada própria ao aplicar a migration pelo conector; a migration source versionada continua sendo `20260916133000_minimize_idle_driver_gps.sql` no Git.

## Autorização negativa

O probe versionado `tests/security/mobility-participant-authorization-remote-probe.sql` foi executado no projeto canônico em transação rollback-only.

Ele comprovou, usando usuário autenticado não participante, que:

- `refresh_operational_pin_for_requester` rejeita terceiro usuário;
- `submit_ride_trust_feedback` rejeita terceiro usuário;
- `create_ride_report` rejeita terceiro usuário.

A execução concluiu sem exceção não tratada e terminou em `ROLLBACK`, sem preservar os dados sintéticos criados para o teste.

## Safety / SOS

Permanece válido o checkpoint `2026-09-16-mobility-safety-production-drift-repair.md`: outbox G71-G80 e `send-emergency-email` v33 foram reconciliados anteriormente, com autenticação dual no handler e dispatcher durável.

## Bloqueadores atuais de lançamento

1. definir e aprovar a política comercial real por modalidade;
2. remover `p_final_price` da assinatura SQL somente após reconciliação/cutover seguro do contrato;
3. regenerar tipos Supabase a partir do schema real depois das migrations;
4. executar typecheck, lint, testes de Mobilidade/Pricing, build e E2E no mesmo SHA;
5. provar concorrência/idempotência em dupla aceitação, cancelamento simultâneo, retry/reconnect, quote duplicada e confirmação duplicada;
6. obter pipeline/deploy verde. O status Vercel atual falha por `build-rate-limit`, que é blocker externo e não prova erro de source;
7. manter `main` protegida por ruleset/required checks quando a capacidade administrativa estiver disponível.

## Fechado nesta retomada

- [x] canal PostgreSQL administrativo acessível novamente;
- [x] migration de minimização de GPS aplicada e verificada;
- [x] probe negativo IDOR/BOLA de PIN/trust/report executado rollback-only;
- [x] zero snapshots de GPS ocioso encontrados após a migration.

## Regra de lançamento

`PUBLIC_LAUNCH_SURFACES.mobility` permanece `false`. Nenhuma feature nova deve contornar os owners acima para “fazer funcionar”. Primeiro fecham-se os blockers de política comercial, concorrência, tipos e gates same-SHA; depois entram implementações adicionais.
