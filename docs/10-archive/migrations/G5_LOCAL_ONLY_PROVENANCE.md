# G5 — migrations locais retiradas do conjunto aplicável

Este diretório preserva artefatos SQL que existiam localmente em `supabase/migrations`, mas que **não pertencem ao histórico remoto aplicável**. Eles não podem voltar para `supabase/migrations` sem nova análise de provenance.

## 20260821001800_restrict_vaga_applications_browser_authority.sql

- classificação G5: `LOCAL_ONLY_SUPERSEDED`;
- presença no histórico remoto por versão ou nome: **não**;
- estado remoto vivo em 2026-08-30: `public.vaga_applications` possui somente CRUD para `authenticated` (além de owner/service roles) e as quatro policies `vaga_applications_{select,insert,update,delete_admin}` estão `TO authenticated`;
- provenance da policy: `20260825183353_harden_admin_helper_anon_scope.sql` estreita explicitamente as quatro policies para `authenticated`;
- provenance de ACL: `20260825230429_remove_browser_ddl_table_privileges.sql` remove `TRUNCATE`, `REFERENCES`, `TRIGGER` e `MAINTAIN` dos browser roles; `20260825230612_revoke_browser_dml_without_rls_authority.sql` remove DML que não tem policy aplicável ao role, eliminando a autoridade anônima enquanto preserva o CRUD autenticado já concedido pela migration canônica `20260526023000_create_vaga_applications.sql`;
- conclusão: o SQL local de `20260821001800` descreve uma correção que o remoto alcançou posteriormente por migrations canônicas versionadas. Aplicá-lo atrasado apenas para preencher histórico repetiria DDL sem criar autoridade nova;
- preservação: `docs/10-archive/migrations/20260821001800_restrict_vaga_applications_browser_authority.local-only-superseded.sql`;
- decisão: remover do diretório de migrations aplicáveis e manter o ratchet apontando às migrations canônicas. **Não aplicar, não reintroduzir e não renomear como alias remoto.**

## 20260826032200_restore_private_safety_evidence_storage_flow.sql

- classificação G5: `LOCAL_ONLY_SUPERSEDED_UNSAFE`;
- presença no histórico remoto `supabase_migrations.schema_migrations`: **não**;
- evidência: a migration canônica `20260829161927_repair_safety_evidence_storage_owner_policies.sql` declara explicitamente que `20260826032200` não foi aplicada remotamente;
- defeito: a policy antiga avaliava `storage.foldername(name)` dentro de subquery que também juntava `profiles`, onde `name` podia resolver para `profiles.name` em vez de `storage.objects.name`;
- substituição remota/source: `20260829161927_repair_safety_evidence_storage_owner_policies.sql`;
- decisão: preservar o blob neste arquivo histórico e removê-lo do diretório de migrations aplicáveis. **Não aplicar, não renomear para uma versão remota e não reintroduzir.**

## 20260829111000_align_get_user_roles_validity.sql

- classificação G5: `LOCAL_ONLY_SUPERSEDED`;
- presença no histórico remoto por versão ou nome: **não**;
- evidência remota: o histórico contém `20260829202444_repair_get_user_roles_validity` e nenhuma entrada `20260829111000`/`align_get_user_roles_validity`;
- sobreposição: ambas instalam `public.get_user_roles(uuid)` como leitura broker-only e filtram apenas assignments ativos, não revogados e não expirados;
- substituição remota/source: `20260829202444_repair_get_user_roles_validity.sql`;
- decisão: preservar o blob neste arquivo histórico e removê-lo do diretório de migrations aplicáveis. **Não aplicar como migration atrasada e não renomear como se fosse alias textual do remoto.**

## 20260820084132_harden_vaga_review_ride_report_rpc_contract.sql

- classificação G5: `LOCAL_ONLY_RECONCILED_FORWARD`;
- presença no histórico remoto por versão ou nome: **não**;
- evidência viva antes da reconciliação: os seis helpers `private.*` já eram `authenticated`-only, mas os seis wrappers `public.*` ainda tinham `service_role EXECUTE`, apesar de serem `SECURITY INVOKER` e delegarem aos helpers que já negavam `service_role`;
- caller source: os serviços de reports usam o cliente Supabase autenticado normal; o ratchet `report-rpc-authorization-batch-2` exige `authenticated`-only e ausência de `anon/service_role`;
- substituição remota/source: `20260830091107_canonicalize_report_rpc_authenticated_only_contract_g5.sql`, aplicada em produção e versionada no GitHub;
- prova pós-aplicação: 12/12 funções alvo com `authenticated EXECUTE`, 0/12 com `anon EXECUTE` e 0/12 com `service_role EXECUTE`;
- preservação: `docs/10-archive/migrations/20260820084132_harden_vaga_review_ride_report_rpc_contract.local-only-reconciled.sql`;
- decisão: o arquivo antigo saiu da fila ativa. **Não reaplicar o timestamp antigo; a autoridade canônica é `20260830091107`.**

## 20260821002600_revoke_residual_anon_private_admin_helper_execute.sql

- classificação G5: `LOCAL_ONLY_SUPERSEDED`;
- presença no histórico remoto por versão ou nome: **não**;
- provenance canônica: `20260825183353_harden_admin_helper_anon_scope.sql` revoga `anon EXECUTE` de `private.is_admin(uuid)`, `private.is_admin_from_roles(uuid)` e `private.is_admin_user(uuid)`; `20260825233757_remove_anon_private_helper_execute.sql` revoga `anon` de `private.current_active_profile_id()` e `private.auth_can_view_group(uuid)`;
- incompatibilidade histórica: o SQL local antigo exigia que `anon` mantivesse `current_active_profile_id()`, condição deliberadamente removida pela migration canônica posterior;
- estado remoto vivo em 2026-08-30: todos esses helpers negam `anon` e preservam `authenticated`;
- preservação: `docs/10-archive/migrations/20260821002600_revoke_residual_anon_private_admin_helper_execute.local-only-superseded.sql`;
- decisão: remover da fila ativa e manter os ratchets apontando para `20260825183353` + `20260825233757`. **Não aplicar atrasado.**

## cadeia local 20260821011000 / 20260821022500 / 20260821024000 — account deletion

- arquivos: `20260821011000_create_account_deletion_request_authority.sql`, `20260821022500_enforce_account_deletion_operational_boundary.sql` e `20260821024000_guard_pending_deletion_dml.sql`;
- classificação G5: `LOCAL_ONLY_SUPERSEDED_BY_FORWARD_RECONCILIATION`;
- presença no histórico remoto por versão ou nome: **não** para os três;
- evidência autoritativa: `20260826015916_reconcile_account_deletion_authority_live_drift.sql` declara explicitamente que a cadeia de 21/08 foi versionada mas nunca aplicada em produção e que reaplicá-la seria inseguro porque redefiniria helpers centrais já endurecidos por migrations posteriores;
- substituição remota/source: `20260826015916_reconcile_account_deletion_authority_live_drift.sql`, que instala a autoridade reversível, broker-only e o DML hold de forma forward-only sem redefinir os helpers mais novos;
- ratchet canônico: `tests/security/account-deletion-live-reconcile-security.test.ts` cobre fail-closed, broker-only, blockers, write guard global e ausência de purge destrutivo;
- preservação imutável no histórico Git: blobs `44426fcde10783610f06204fa8b3e5d7b8b62fe4` (20260821011000), `283b11e353454503020f37e132f4e6114367f001` (20260821022500) e `eb3535f589fac1d1840fa72a8338817e53d5f8fb` (20260821024000), todos alcançáveis a partir do commit `c4ff5e0860b4966448aa0e8a36a8f3323adf9e8a`;
- decisão: retirar os três arquivos da fila ativa. **Não aplicar, não renomear como alias e não reintroduzir; `20260826015916` é a autoridade canônica.**
