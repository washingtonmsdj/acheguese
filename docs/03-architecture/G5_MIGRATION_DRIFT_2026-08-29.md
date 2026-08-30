# G5 — Migration drift checkpoint — 2026-08-29

Status: **EM EXECUÇÃO**  
Escopo: reconciliação de identidade local ↔ `supabase_migrations.schema_migrations`.  
Regra: nenhuma migration é aplicada, apagada ou renomeada apenas por heurística. Alias só é aceito quando nome e SQL normalizado sob o reconciliador atual correspondem ao remoto. `content mismatch`, `local-only` e `remote-only` exigem provenance explícita.

## 1. Resultado acumulado deste corte

### 59 identidades reconciliadas às versões remotas

1. `20260825123021_fix_global_admin_authority_source.sql`
2. `20260825123134_harden_profile_members_rls.sql`
3. `20260825123231_harden_issue_blocked_terms_rls.sql`
4. `20260825132718_harden_driver_locations_read_rls.sql`
5. `20260825143057_harden_driver_data_read_rls.sql`
6. `20260825152859_remove_addresses_public_select_shadow.sql`
7. `20260825163343_harden_orphan_address_mutations.sql`
8. `20260825172854_remove_legacy_ad_public_select_shadow.sql`
9. `20260825183353_harden_admin_helper_anon_scope.sql`
10. `20260825184206_harden_driver_profiles_financial_read.sql`
11. `20260825201017_require_anonymous_analytics_session.sql`
12. `20260825201350_harden_profile_favorites_read_privacy.sql`
13. `20260825214750_harden_driver_availability_read_privacy.sql`
14. `20260825215017_harden_question_answer_likes_read_privacy.sql`
15. `20260825215309_harden_event_review_helpfulness_read_privacy.sql`
16. `20260825215737_revoke_anon_identity_graph_select_grants.sql`
17. `20260825222533_remove_review_reports_profile_role_shadow.sql`
18. `20260825222735_repair_mobility_profile_user_rls_drift.sql`
19. `20260825225752_consolidate_platform_moderation_rls.sql`
20. `20260825230429_remove_browser_ddl_table_privileges.sql`
21. `20260825230612_revoke_browser_dml_without_rls_authority.sql`
22. `20260825230822_remove_inert_sensitive_mutation_policies.sql`
23. `20260825230922_fail_closed_future_public_function_grants.sql`
24. `20260825231133_require_active_profile_managers.sql`
25. `20260825231245_repair_business_profile_identity_rls.sql`
26. `20260825231519_require_active_business_and_professional_members.sql`
27. `20260825231618_require_active_members_for_links_reviews_channels.sql`
28. `20260825231750_require_active_education_and_pizza_members.sql`
29. `20260825232806_require_active_members_in_brokered_profile_auth.sql`
30. `20260825232956_restrict_business_professional_stats_reads.sql`
31. `20260825233458_isolate_public_business_catalog.sql`
32. `20260825233757_remove_anon_private_helper_execute.sql`
33. `20260825234031_drop_unused_lost_found_contact_pii.sql`
34. `20260825234410_repair_community_alert_runtime_contract.sql`
35. `20260825234632_use_active_profile_for_community_alerts.sql`
36. `20260826002457_drop_confirmed_legacy_gastronomy_and_tourist_backup.sql`
37. `20260826003019_replace_public_business_search_with_read_model.sql`
38. `20260826003840_restrict_emergency_contacts_to_direct_owner.sql`
39. `20260826004108_restrict_safety_private_reads_to_direct_owner.sql`
40. `20260826005704_harden_public_catalog_pricing_boundary.sql`
41. `20260826010528_lock_legacy_delivery_requests_browser_surface.sql`
42. `20260826011019_harden_business_claim_identity_rls.sql`
43. `20260826011328_remove_territorial_groups_public_true_shadow.sql`
44. `20260826011459_remove_community_questions_public_true_shadow.sql`
45. `20260826013012_restrict_coupon_visibility_to_active.sql`
46. `20260826013701_harden_public_analytics_event_integrity.sql`
47. `20260826014650_revoke_orphan_authenticated_group_member_helper_execute.sql`
48. `20260826015916_reconcile_account_deletion_authority_live_drift.sql`
49. `20260826022951_remove_locations_public_read_shadow.sql`
50. `20260826031850_restrict_documents_storage_policies_to_authenticated.sql`
51. `20260826033134_restrict_module_rollout_audit_columns.sql`
52. `20260826035946_restrict_legacy_delivery_helper_rpcs.sql`
53. `20260826040215_remove_territorial_group_member_public_shadow.sql`
54. `20260826032624_harden_storage_policy_roles_and_update_checks.sql`
55. `20260825185039_gate_admin_moderation_views.sql`
56. `20260825223637_tighten_operational_verification_legacy_surface.sql`
57. `20260825223929_lock_operational_verifications_behind_rpcs.sql`
58. `20260825224111_canonicalize_sensitive_admin_policies.sql`
59. `20260825223319_add_server_authoritative_operational_pin_rpcs.sql`

Os renames foram feitos atomicamente: novo path usando a versão remota + remoção do path local antigo no mesmo commit. Nenhum SQL foi executado novamente no Supabase. Isso inclui migrations que historicamente removeram dados/legados: nesta reconciliação apenas a identidade do artefato local foi alinhada ao histórico remoto já aplicado.

### Evidência reforçada para os antigos content mismatches

- `20260826032624_harden_storage_policy_roles_and_update_checks.sql`: SQL local e remoto, removendo apenas comentários de linha e whitespace, resultaram em 6.863 caracteres e MD5 `dcf82f046618511819667e9121c5c5c0`. Reconciliado no commit `3767d4d0c9e4006d97866d0301df566dfdfb19b4` usando o statement remoto reconstruído, blob `767eb9408ddf118146dfd67b0dcd8757e1288234`.
- `20260825185039_gate_admin_moderation_views.sql`: 4.187 caracteres normalizados, MD5 `2955b4fb83f68b450ec3823ec37691ec`, igualdade exata. Reconciliado no commit `94e21fea4e0a5505c2ed4899d2ae481d51dab11b`, blob remoto `d8e6f4ece8ac9b83b881ebe41d2b9b84a2e89393`.
- `20260825223637_tighten_operational_verification_legacy_surface.sql`: remoto e local contêm o mesmo `REVOKE` e `DROP POLICY`; diferenças limitadas a comentários/quebra de linhas. Reconciliado no commit `e394aad27a575efcfb273860d49cf122a3409a7b`, blob remoto `7711207381b78c943c3c9a5b09fe76a6ffa31132`.
- `20260825223929_lock_operational_verifications_behind_rpcs.sql`: 1.512 caracteres normalizados, MD5 `8a00556cea1ca8e6fc5b0dd1edd269d3`, igualdade exata. Reconciliado no commit `bd0ab6e2efed2a2d8496929d43ad7d0868330e20`, blob remoto `4761deb2cd7c40aa66f18d1a25fe008bee5d2d58`.
- `20260825224111_canonicalize_sensitive_admin_policies.sql`: 2.025 caracteres normalizados, MD5 `5704a0128fa6fcba58e273139470efaf`, igualdade exata, incluindo oito superfícies administrativas e os `WITH CHECK`. Reconciliado no commit `490f3a50153bf6cfb1b92fcbd6dbd54acfa39042`, blob remoto `d449ccdb205e35359e9a3763ce33ff4cc7e6d1f4`.
- `20260825223319_add_server_authoritative_operational_pin_rpcs.sql`: todo o DDL/RPC até os `GRANT EXECUTE` é idêntico sob normalização restrita: 8.858 caracteres, MD5 `7a8db7a48d152439592199951516489c`. O antigo local acrescentava apenas três `COMMENT ON FUNCTION`; esses comentários não constam no histórico remoto e `obj_description` das três funções no banco vivo é `NULL`. O statement remoto exato foi restaurado no commit `164cff1f576d9517278809da323235942a51b02f`, blob `d4b69f2f9212f46102b7d110cd3e80d531beae22`; o antigo blob local foi preservado em `docs/10-archive/migrations/20260825224500_add_server_authoritative_operational_pin_rpcs.local-content-mismatch.sql`.

**Resultado deste conjunto:** zero `content mismatch` conhecido entre os seis casos que bloqueavam este corte.

## 2. Local-only já retiradas do conjunto aplicável

Provenance detalhada: `docs/10-archive/migrations/G5_LOCAL_ONLY_PROVENANCE.md`.

- `20260826032200_restore_private_safety_evidence_storage_flow.sql` → `LOCAL_ONLY_SUPERSEDED_UNSAFE`; nunca aplicada remotamente, tinha correlação ambígua e foi supersedida por `20260829161927_repair_safety_evidence_storage_owner_policies.sql`.
- `20260829111000_align_get_user_roles_validity.sql` → `LOCAL_ONLY_SUPERSEDED`; nunca aplicada remotamente e foi substituída pela autoridade instalada em `20260829202444_repair_get_user_roles_validity.sql`.

Os blobs foram preservados em `docs/10-archive/migrations/` e removidos de `supabase/migrations` para impedir aplicação atrasada por um futuro `db push`.

## 3. Estado remoto observado

O histórico remoto do projeto Supabase ligado contém **450 entradas**, de `20240121155421` até `20260829202444` no corte observado em 2026-08-29.

O manifesto `supabase/migration-provenance.json` continua sendo evidência auxiliar e não substitui a comparação viva: seu baseline foi gerado antes deste corte e não deve ser alterado manualmente apenas para fazer a validação passar.

## 4. CI

Os workflows do GitHub Actions no head atual falham antes de executar qualquer step: jobs observados com `runner_id=0`, `runner_name` vazio e `steps=[]`. O mesmo padrão já existia no head `639fce51b58c66a855298b2a657589485773f25a`, anterior às reconciliações deste corte. Portanto, isso é tratado como bloqueio de execução/runner separado, não como evidência de regressão criada pelos renames de migration.

CI verde continua sendo requisito do plano global; este checkpoint não o marca como resolvido.

## 5. Regras para continuidade

1. A autoridade de aceite continua sendo `tools/supabase/validate-supabase-remote-migration-drift.ts` / `npm run validate:migrations:remote`.
2. O estado só pode ser considerado limpo com `ALIAS=0`, `CONFLICT=0`, `LOCAL_ONLY=0` e `REMOTE_ONLY=0`.
3. `local-only` não significa automaticamente “aplicar”: procurar supersession, caller, estado remoto e provenance.
4. `remote-only` não significa automaticamente “recriar”: verificar se o artefato local foi perdido e reconstruir a partir de `schema_migrations.statements` quando necessário.
5. Não executar `db push` enquanto a paridade viva não estiver comprovada.
6. Não relaxar o comparador nem editar o histórico remoto apenas para produzir zero artificial.

## 6. Próximo corte

Com os seis `content mismatch` conhecidos eliminados, o próximo gargalo é **paridade integral local-only/remote-only** contra as 450 entradas remotas. Auditar primeiro a cauda 20260825–20260829 e depois fechar qualquer divergência restante de versões anteriores. Só depois executar o validador remoto como critério de aceite. Se o GitHub Actions continuar sem runner, registrar esse bloqueio separadamente e não confundi-lo com drift de migrations.
