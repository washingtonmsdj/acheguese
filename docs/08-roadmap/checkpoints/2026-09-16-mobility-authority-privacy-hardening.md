# Mobilidade — autoridade server-owned e minimização de dados

**Data:** 2026-09-16  
**Linha:** `main`  
**Status:** source endurecido; GPS, autorização negativa, preço terminal e replay de aceite reconciliados; rollout público continua pausado

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

## Tipos Supabase

Existe drift confirmado entre o schema remoto e `src/integrations/supabase/types.generated.ts`:

- o RPC vivo `mobility_transition_delivery_state_atomic` possui 7 argumentos e não expõe `p_final_price`;
- o arquivo gerado ainda contém `p_final_price?: number` nessa assinatura;
- o artefato gerado não deve ser editado manualmente;
- a correção deve ocorrer pelo workflow canônico `Supabase Types Sync`/`supabase gen types`, seguida de typecheck e novo deploy no mesmo SHA.

Enquanto esse sync não for executado, o gate de tipos permanece aberto.

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

## Replay/idempotência de aceite

Foi executado no Supabase canônico um probe rollback-only de retry sequencial do aceite de corrida. O probe está versionado em `tests/security/mobility-accept-replay-remote-probe.sql`.

Evidência obtida:

- a primeira chamada de `mobility_accept_ride_atomic` concluiu o aceite;
- a segunda chamada com a mesma corrida/motorista foi rejeitada;
- existiu exatamente um `ride_state_audit` com `to_state='driver_accepted'`;
- `driver_availability.active_ride_id` apontou somente para a corrida sintética aceita;
- a transação foi revertida integralmente.

O fixture respeitou `check_available_requirements` e a minimização de GPS ativa; nenhuma constraint ou trigger foi desabilitada.

**Escopo da prova:** retry/replay sequencial. Ainda não equivale a prova real de duas sessões concorrentes.

## Safety / SOS

Permanece válido `2026-09-16-mobility-safety-production-drift-repair.md`: outbox G71-G80 e `send-emergency-email` v33 já haviam sido reconciliados.

## Estado de build/deploy

O SHA `a30b7c7ba9a403ff7c9a6c4e1308754a4d9bbd4f` foi confirmado com status Vercel `success` antes da inclusão deste probe. Qualquer commit posterior precisa repetir o gate same-SHA; um deploy verde anterior não certifica automaticamente o novo SHA.

## Bloqueadores atuais de lançamento

1. definir e aprovar a política comercial real por modalidade;
2. regenerar tipos Supabase a partir do schema real, sem edição manual;
3. concluir concorrência/idempotência além do replay já provado: dupla aceitação em sessões independentes, cancelamento simultâneo, quote duplicada e confirmação duplicada;
4. executar typecheck, lint, testes de Mobilidade/Pricing, build e E2E no mesmo SHA;
5. obter pipeline/deploy verde para o SHA final de estabilização;
6. proteger `main` por ruleset/required checks quando houver capacidade administrativa.

## Fechado nesta retomada

- [x] canal PostgreSQL administrativo acessível;
- [x] minimização de GPS aplicada e verificada;
- [x] probe negativo IDOR/BOLA PIN/trust/report executado rollback-only;
- [x] zero snapshots de GPS ocioso após a migration;
- [x] `p_final_price` removido do wrapper público com cutover versionado e ratchet de arquitetura;
- [x] drift de tipos identificado objetivamente (`p_final_price` ainda presente no arquivo gerado);
- [x] replay sequencial de `mobility_accept_ride_atomic` provado rollback-only sem duplicar audit/estado.

## Regra de lançamento

`PUBLIC_LAUNCH_SURFACES.mobility` permanece `false`. Nenhuma feature nova deve contornar os owners acima. Primeiro fecham-se política comercial, concorrência, tipos e gates same-SHA; depois entram novas implementações.
