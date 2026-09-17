# Mobilidade — autoridade server-owned e minimização de dados

**Data:** 2026-09-16  
**Linha:** `main`  
**Status:** source endurecido; GPS, autorização negativa, preço terminal, replays de aceite/quote/conclusão e semântica não-retry reconciliados; rollout público continua pausado

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
- verificação remota em 2026-09-16 confirmou `0` regras ativas/aprovadas tanto para `ride` quanto para `motoboy`;
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

## Semântica de erro e retry dos RPCs

Foi identificado que cinco funções vivas de Mobilidade usavam SQLSTATE customizado `40001` para rejeições de stale state, replay ou consumo de quote. Esses casos não são uma instrução para repetir automaticamente o mesmo comando: o caller precisa reconciliar estado/quote antes de decidir uma nova ação.

A migration `20260917004538_normalize_mobility_rpc_non_retry_errors.sql` foi aplicada no Supabase canônico e versionada no Git. Ela preserva corpos e mensagens das funções e troca somente `ERRCODE = '40001'` por `ERRCODE = 'P0001'` nas rotinas vivas:

- `public.mobility_create_ride_atomic`;
- `public.mobility_create_delivery_atomic`;
- `public.mobility_transition_ride_state_atomic`;
- `public.mobility_transition_delivery_state_atomic`;
- `private.mobility_transition_delivery_state_atomic_base_g70`.

Verificação pós-DDL:

- migration remota registrada como `20260917004538_normalize_mobility_rpc_non_retry_errors`;
- as cinco funções-alvo possuem `has_40001=false` e `has_P0001=true` no `pg_proc` vivo;
- o replay terminal foi repetido no Supabase real e a segunda confirmação foi rejeitada com `P0001`;
- permaneceu exatamente um audit `delivered`, um audit `completed`, estado final `completed` e preço final server-owned;
- o probe terminou em `ROLLBACK` e nenhum fixture foi persistido;
- `tests/security/mobility-terminal-replay-remote-probe.sql` exige explicitamente `P0001`, impedindo regressão silenciosa para `40001` nesse boundary.

## Tipos Supabase

Existe drift confirmado entre o schema remoto e `src/integrations/supabase/types.generated.ts`:

- o RPC vivo `mobility_transition_delivery_state_atomic` possui 7 argumentos e não expõe `p_final_price`;
- o arquivo gerado ainda contém `p_final_price?: number` nessa assinatura;
- o artefato gerado não deve ser editado manualmente;
- a correção deve ocorrer pelo workflow canônico `Supabase Types Sync`/`supabase gen types`, seguida de typecheck e novo deploy no mesmo SHA;
- o workflow foi disparado pelo SHA `4a9bba6ff6cf9f592065b78034fcf74a06ae9bb4`, mas permanece dependente do runner self-hosted Windows com labels `acheguese-heavy-windows` e `remote-only`.

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

## Replay/idempotência de quote

Foi executado no Supabase canônico um segundo probe rollback-only para o contrato single-use de `quote_id`.

O ambiente real continua sem política comercial aprovada. Para exercitar apenas a invariável técnica sem persistir política fictícia, o probe:

- seleciona a regra `ride` já ativa e sem peak/additional fees;
- muda somente `commercial_status` para `approved` dentro da própria transação;
- não desabilita trigger, constraint, RLS ou função de validação;
- cria uma quote sintética e chama `mobility_create_ride_atomic` duas vezes com a mesma `quote_id`;
- reverte integralmente ao final.

Evidência obtida:

- a primeira criação foi concluída;
- a segunda criação com a mesma quote foi rejeitada com SQLSTATE `23505`;
- existiu exatamente uma `ride_requests` com a `pricing_quote_id` sintética;
- existiu exatamente um audit inicial `requested` para a corrida criada;
- `mobility_price_quotes.consumed_by_ride_id` apontou somente para a primeira corrida.

O probe está versionado em `tests/security/mobility-quote-replay-remote-probe.sql`.

**Escopo da prova:** consumo duplicado sequencial da quote. Ainda não substitui corrida concorrente em duas sessões independentes.

## Replay/idempotência de conclusão terminal

`tests/security/mobility-terminal-replay-remote-probe.sql` foi executado novamente após o hardening de SQLSTATE.

Evidência obtida:

- a primeira confirmação `in_delivery -> delivered -> completed` foi concluída atomicamente;
- o retry do mesmo comando foi rejeitado com `P0001`;
- não houve segundo audit `delivered` nem segundo audit `completed`;
- o preço final permaneceu derivado do estado server-owned;
- a transação foi revertida integralmente.

**Escopo da prova:** retry/replay sequencial da confirmação terminal. Ainda não equivale a duas confirmações simultâneas em sessões independentes.

## Safety / SOS

Permanece válido `2026-09-16-mobility-safety-production-drift-repair.md`: outbox G71-G80 e `send-emergency-email` v33 já haviam sido reconciliados.

## Estado de build/deploy

O SHA `a30b7c7ba9a403ff7c9a6c4e1308754a4d9bbd4f` foi confirmado com status Vercel `success` antes da inclusão dos probes posteriores. O SHA `4a9bba6ff6cf9f592065b78034fcf74a06ae9bb4` recebeu status Vercel `success` apenas por `Canceled by Ignored Build Step`, portanto isso não conta como build/deploy positivo do código. Qualquer commit posterior precisa repetir o gate same-SHA com execução real.

## Bloqueadores atuais de lançamento

1. definir e aprovar a política comercial real por modalidade;
2. regenerar tipos Supabase a partir do schema real, sem edição manual; o workflow depende do runner self-hosted;
3. concluir concorrência real em sessões independentes: dupla aceitação, cancelamento simultâneo, confirmação terminal simultânea e consumo simultâneo da mesma quote;
4. executar typecheck, lint, testes de Mobilidade/Pricing, build e E2E no mesmo SHA;
5. obter pipeline/deploy verde por execução real para o SHA final de estabilização;
6. proteger `main` por ruleset/required checks quando houver capacidade administrativa.

## Fechado nesta retomada

- [x] canal PostgreSQL administrativo acessível;
- [x] minimização de GPS aplicada e verificada;
- [x] probe negativo IDOR/BOLA PIN/trust/report executado rollback-only;
- [x] zero snapshots de GPS ocioso após a migration;
- [x] `p_final_price` removido do wrapper público com cutover versionado e ratchet de arquitetura;
- [x] drift de tipos identificado objetivamente (`p_final_price` ainda presente no arquivo gerado);
- [x] replay sequencial de `mobility_accept_ride_atomic` provado rollback-only sem duplicar audit/estado;
- [x] replay sequencial de consumo de `quote_id` provado rollback-only sem criar corrida/audit duplicado;
- [x] replay sequencial de conclusão terminal provado rollback-only sem duplicar efeitos;
- [x] SQLSTATE customizado `40001` removido das cinco funções vivas de Mobilidade que não devem induzir retry automático.

## Regra de lançamento

`PUBLIC_LAUNCH_SURFACES.mobility` permanece `false`. Nenhuma feature nova deve contornar os owners acima. Primeiro fecham-se política comercial, concorrência, tipos e gates same-SHA; depois entram novas implementações.
