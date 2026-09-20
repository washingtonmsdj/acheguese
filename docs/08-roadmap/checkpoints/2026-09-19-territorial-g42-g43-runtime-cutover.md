# Checkpoint remoto — Territorial G42/G43 — 2026-09-19

## Ambiente

- Supabase: `acheguese`
- Project ref: `xhdowzacfujckjelqhtd`
- Estado: `ACTIVE_HEALTHY`
- PostgreSQL: `17.6`

## Preflight

O preflight read-only confirmou:

- `public.locations`, `public.territorial_groups` e
  `public.territorial_group_members` presentes;
- `locations.geographic_path`, `locations.metadata` e `parent_id` presentes;
- `idx_locations_geographic_path_pattern` válido e pronto;
- `rpc_get_location_descendants_ids(uuid)` e `private.is_admin(uuid)` presentes;
- `service_role` com os privilégios necessários;
- writers autenticados ainda presentes antes do cutover, como esperado.

## Alterações remotas aplicadas

### G42

- Migration: `20260919003851_transactional_location_visibility_cascade_g42`
- RPC: `public.territorial_update_location_visibility(uuid,text,boolean,uuid)`
- `SECURITY INVOKER`
- `EXECUTE`: somente `service_role`
- `anon` e `authenticated`: sem execução

### G43 phase 1

- Migration: `20260919003900_create_territorial_group_admin_commands_g43`
- RPCs:
  - `public.territorial_admin_save_group(uuid,text,text,text,uuid,uuid[])`
  - `public.territorial_admin_set_group_status(uuid,text)`
- `SECURITY INVOKER`
- `EXECUTE`: somente `service_role`
- `anon` e `authenticated`: sem execução

As duas migrations passaram previamente em transações de teste com rollback e
depois foram aplicadas de forma persistente pelo fluxo de migration do Supabase.

## Edge Functions

Publicadas como `ACTIVE`, todas com `verify_jwt=true`:

- `territorial-get-tree`
- `territorial-update-group-visibility`
- `territorial-update-location-visibility`
- `territorial-group-admin-rpc`

Uma chamada `POST` sem JWT a cada gateway retornou `401`
(`UNAUTHORIZED_NO_AUTH_HEADER`). Isso prova o bloqueio anônimo; não substitui
um smoke positivo com uma sessão administrativa MFA/AAL2.

## Gates restantes

1. executar smoke positivo admin AAL2 para leitura, visibilidade e lifecycle;
2. trocar create/update/status do frontend para `territorial-group-admin-rpc`;
3. certificar o frontend no mesmo SHA do deploy;
4. somente então aplicar `20260910221500_lock_territorial_group_writes_to_broker_g43.sql`;
5. provar que `authenticated` mantém somente SELECT e que nenhum writer antigo é
   chamado em runtime.

Não foi feito purge, alteração de retenção, habilitação de Mobility ou mudança
em `public.spatial_ref_sys` neste checkpoint.

## Atualização operacional — 2026-09-20

- [x] consulta read-only ao catálogo remoto confirmou
  `territorial-group-admin-rpc` `ACTIVE`, versão 1 e `verify_jwt=true`;
- [x] o source do Admin foi certificado localmente para chamar somente esse
  broker: `saveGroup` cobre criação/edição + memberships em um comando, e
  `setStatus` cobre ativação/desativação;
- [x] os caminhos DML diretos foram removidos do repository/service de grupos;
- [x] o ledger remoto continua contendo G43 phase 1;
- [ ] smoke positivo admin AAL2 e prova do bundle hosted no mesmo SHA ainda
  pendentes; o source-cutover já foi publicado na branch GitHub;
- [ ] phase 2 `20260910221500_lock_territorial_group_writes_to_broker_g43.sql`
  ainda não foi promovida; nenhuma escrita DDL/Edge foi executada no Supabase
  neste ciclo.

Os itens 2 e 3 da lista de gates acima descrevem o estado anterior ao corte de
source e ficam superseded por esta atualização; a certificação hosted ainda é
obrigatória antes da phase 2.
