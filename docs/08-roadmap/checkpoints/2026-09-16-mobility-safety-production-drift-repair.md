# Mobilidade / Safety — reconciliação do runtime de produção

**Data:** 2026-09-16  
**Linha:** `main`

## Problema encontrado

A auditoria de Mobilidade/Safety encontrou drift real entre o repositório e o runtime Supabase de produção:

- o source versionado já possuía a cadeia durável de notificações de emergência G71/G72/G75–G80;
- as migrations correspondentes não estavam aplicadas no ambiente de produção auditado;
- o Edge Function `send-emergency-email` implantado ainda era uma versão antiga, com escrita direta em `emergency_delivery_log`, sem os commands atômicos/idempotentes atuais e sem o caminho de autenticação do dispatcher cron.

Esse drift era P0 porque a obrigação externa de notificar um contato de emergência não pode depender do browser permanecer vivo nem de dois writers concorrentes.

## Correção executada

Foram aplicadas ao banco de produção, na ordem versionada do repositório:

1. `20260916095115_reconcile_g71_safety_status_state_machine.sql`;
2. `20260916095139_reconcile_g72_durable_emergency_delivery_outbox.sql`;
3. `20260916095206_reconcile_g75_cancel_terminal_emergency_delivery_race.sql`;
4. `20260916095228_reconcile_g76_idempotent_emergency_dispatch_recovery.sql`;
5. `20260916095255_reconcile_g77_provider_confirmed_emergency_delivery.sql`;
6. `20260916095321_reconcile_g78_immutable_emergency_provider_payload.sql`;
7. `20260916095337_reconcile_g79_single_emergency_delivery_failure_authority.sql`;
8. `20260916095427_reconcile_g80_autonomous_emergency_delivery_dispatcher.sql`.

O runtime resultante preserva estes invariantes:

- estado terminal de alerta Safety não reabre;
- criação do alerta produz obrigação durável de entrega no outbox;
- claim, cancelamento terminal e autorização para provedor serializam no banco;
- retry do provedor é idempotente, serializado e limitado;
- resultado indeterminado vira `reconciliation_required`, nunca sucesso/falha inventado;
- payload exato enviado ao provedor é congelado em schema `private` antes do side effect externo;
- eventos do provedor são deduplicados e não podem regredir um estado mais forte;
- falha do worker passa por command atômico único;
- o dispatcher autônomo usa `pg_cron` + `pg_net` e os segredos já existentes no Vault, sem transportar `service_role` via HTTP.

## Edge Function

`send-emergency-email` foi reconciliada com o source canônico e implantada como **v33 ACTIVE**.

- SHA do bundle implantado: `fc5a1dab2ffd7aad7ddedddc364ca46414e73a169a658cd0599897392f911eae`;
- gateway: `verify_jwt=false` de forma deliberada porque a função possui dois chamadores legítimos;
- caminho de usuário: exige Bearer token válido e conta operacional;
- caminho de cron: exige `x-cron-secret` válido;
- sem JWT válido ou `CRON_SECRET`, o handler falha fechado antes do side effect;
- o import Supabase do entrypoint foi normalizado para URL Deno explícita no commit `611cc16782aa758dc5cb2540157011c0e125030b`.

`verify_jwt=false` aqui não significa endpoint anônimo; apenas move a autenticação para o handler para que JWT de usuário e segredo de cron possam coexistir no mesmo executor canônico.

## Provas de runtime

- `pg_cron` e `pg_net` existem no ambiente;
- os nomes `acheguese_project_url` e `acheguese_cron_secret` existem no Vault; nenhum valor secreto foi lido durante a auditoria;
- job `emergency-delivery-outbox-every-minute` está ativo com agenda `* * * * *`;
- execuções recentes do job retornaram `succeeded`;
- os dois triggers do outbox estão habilitados;
- os oito RPCs externos da cadeia de entrega de emergência negam `anon` e `authenticated` e permitem somente `service_role`;
- `emergency_delivery_log` está vazio no snapshot auditado;
- `stale_processing = 0`;
- `dispatching_without_payload = 0`;
- `open_delivery_for_terminal_alert = 0`.

Não foi criado alerta SOS fictício nem enviado e-mail real para validar o sistema. A auditoria evitou side effect externo e verificou estrutura, grants, scheduler e invariantes persistidos.

## Default-deny confirmado

`ride_state_audit` e `emergency_delivery_log` permanecem com RLS habilitado e sem policy de browser. Isso é intencional: não existem grants de tabela para `anon`/`authenticated`; os writers operacionais auditados usam caminhos privilegiados explícitos.

## Próximo P0

Com o drift de Safety fechado, a prioridade volta para a autoridade de preço em Mobilidade:

- o browser ainda envia `suggestedPrice` ao `mobility-rpc`;
- o broker ainda contém piso literal `5` na validação;
- a correção não é escolher outro número: criação de corrida/entrega deve consumir **quote server-owned, versionada, expirada e vinculada ao ator/rota/modalidade**, calculada somente a partir de regra comercial aprovada;
- enquanto a política comercial real não existe, produção deve continuar fail-closed e o rollout público de Mobilidade permanece pausado.
