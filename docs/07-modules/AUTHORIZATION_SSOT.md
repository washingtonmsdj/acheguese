# Authorization SSOT

Status: G4 source/authority fechado
Data-base: 2026-08-29
Owner de decisao global: `src/core/authorization`
Owner de gestao administrativa de assignments: `src/core/admin/services/AdminRolesService.ts`

## 1. Decisao

Roles globais da plataforma possuem uma unica regra de validade:

- assignment ativo;
- nao revogado;
- sem expiracao ou com `expires_at > now()`.

No browser, decisoes globais (`hasRole`, `getUserRoles`, `isAdmin`,
`isSuperAdmin`) passam por:

```text
RoleService
  -> RoleRpcService
  -> Edge Function role-rpc
  -> helpers/RPCs server-owned
  -> public.user_roles
```

`RoleService` nao consulta Supabase diretamente.

## 2. Gestao nao e decisao

`AdminRolesService` e o owner de inventario e lifecycle administrativo:

- listar assignments;
- estatisticas administrativas;
- conceder role;
- revogar role por UPDATE;
- renovar expiracao;
- consultar historico.

Ele nao expoe mais `hasRole()` nem `getUserRoles()` como APIs de decisao.
`AdminDataService` usa `RoleService.getUserRoles()` quando precisa saber os
roles validos de um usuario.

O browser nao possui DELETE em `user_roles`; hard-delete foi retirado pela
migration `20260829204500_harden_user_role_lifecycle_grants.sql`. INSERT e
UPDATE permanecem governados por RLS de super_admin para o lifecycle
administrativo existente.

## 3. Helpers privados de RLS

Helpers de enforcement vivem em `private.*`. Entre os contratos atuais:

- `private.is_admin_from_roles(uuid)`;
- `private.is_admin(uuid)`;
- `private.is_admin_user(uuid)`;
- `private.is_super_admin(uuid)`;
- `private.has_valid_global_role(uuid, app_role)`;
- `private.can_manage_profile(uuid)`;
- `private.auth_can_access_profile(uuid)`;
- `private.can_operate_business_profile(uuid)`;
- `private.group_can_manage_members(uuid, uuid)`;
- `private.user_can_manage_profile(uuid, uuid)`.

`private.has_valid_global_role` preserva semantica de role exata para policies
que historicamente exigem somente `admin` ou somente `super_admin`. Policies
que significam admin ou super_admin usam `private.is_admin`.

## 4. Wrappers publicos

Wrappers `public.*` existem apenas para compatibilidade server-side e ficam
service-role-only quando aplicavel. Eles nao devem reimplementar SQL de
authorization.

Em 2026-08-29:

- `public.auth_can_access_profile` passou a delegar para
  `private.auth_can_access_profile`;
- `public.group_can_manage_members` passou a delegar para
  `private.group_can_manage_members`;
- `public.is_admin`, `public.is_admin_from_roles`, `public.is_admin_user` e
  `public.is_super_admin` ja delegam aos owners privados;
- `public.get_user_roles` ficou service-role-only e foi reparado para aplicar a
  mesma validade de role usada por `has_role` e pelos helpers privados.

## 5. Edge Functions

`role-rpc` e o broker autenticado para leituras de roles no browser. Ele valida
que o alvo e o proprio usuario ou que o solicitante e admin.

O source compartilhado `_shared/adminAuth.ts` tambem foi convergido para
`get_user_roles`; ele nao consulta `user_roles` diretamente. Como esse helper e
embutido no bundle de varias Edge Functions, as versoes remotas existentes so
recebem essa implementacao quando cada funcao for redeployada. O comportamento
remoto conhecido anterior usa o mesmo predicado de validade e nao contradiz a
regra atual; sincronizacao de bundle/deploy same-SHA pertence a G7.

## 6. Policies remotas

A migration `20260829204000_consolidate_global_authorization_helpers.sql`
removeu SQL cru de `user_roles` das policies globais conhecidas e as roteou aos
helpers privados.

A unica policy remota ainda contendo `user_roles` apos o hardening e:

- tabela `gastronomy_subscriptions`;
- policy `Empresas podem ver suas próprias assinaturas`.

Essa tabela esta marcada remotamente como **DEPRECATED/read-only**, com dados
migrados para `user_subscriptions`, e ainda possui 5 linhas historicas. Ela nao
e autoridade ativa de roles globais e nao deve ser apagada nem reinterpretada
sem provenance. Seu saneamento pertence a G5 legado/database.

## 7. Capability preview

`CapabilityPreviewService` e `capabilityPreviewPolicy` servem para preview de
capacidade/UX. Eles nao substituem RLS, RPC server-owned nem `RoleService` como
enforcement. Nenhuma decisao de seguranca pode confiar apenas em capability
preview.

## 8. Guardrails

- runtime `src` nao consulta `user_roles` diretamente fora de
  `AdminRolesService`, que e management-only;
- browser nao chama `is_admin`, `is_super_admin`, `has_role` ou
  `get_user_roles` diretamente; usa `RoleRpcService`;
- `RoleService` nao importa Supabase;
- wrappers publicos de helper sao one-way para `private.*`;
- novas policies globais nao podem repetir SQL de `user_roles`;
- role expirada ou revogada nunca pode ser retornada como role valida;
- revogacao de assignment e lifecycle por UPDATE, nao hard DELETE browser;
- permissions especificas de dominio permanecem no owner do dominio e nao sao
  convertidas artificialmente em role global.

## 9. Evidencias

- `tests/architecture/authorization-ssot.test.ts`;
- `tests/security/global-role-read-validity-security.test.ts`;
- `tests/security/rls-authorization-helpers-security.test.ts`;
- migration `20260829203000_repair_get_user_roles_validity.sql`;
- migration `20260829204000_consolidate_global_authorization_helpers.sql`;
- migration `20260829204500_harden_user_role_lifecycle_grants.sql`;
- verificacao remota em 2026-08-29: `get_user_roles` aplica validade completa;
- verificacao remota: wrappers `auth_can_access_profile` e
  `group_can_manage_members` delegam a `private.*`;
- verificacao remota: authenticated possui SELECT/INSERT/UPDATE, mas nao DELETE,
  em `user_roles`, com RLS habilitado.

Este fechamento e de G4 source/authority. Drift exaustivo, legacy cleanup,
provenance, grants/policies de todos os dominios e certificacao same-SHA ficam
em G5/G7.
