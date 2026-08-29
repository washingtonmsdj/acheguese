# G5 — Migration drift checkpoint — 2026-08-29

Status: **EM EXECUÇÃO**  
Escopo: reconciliação de identidade local ↔ `supabase_migrations.schema_migrations`.  
Regra: nenhuma migration é aplicada, apagada ou renomeada apenas por heurística. Alias só é aceito quando nome e SQL normalizado sob o reconciliador atual correspondem ao remoto. `content mismatch` e `local-only` exigem provenance explícita.

## 1. Resultado acumulado deste corte

### 31 aliases exatos alinhados às versões remotas

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

Os renames foram feitos atomicamente com o mesmo blob SQL: novo path usando a versão remota + remoção do path local antigo no mesmo commit. Nenhum SQL foi executado novamente no Supabase.

## 2. Local-only retiradas do conjunto aplicável

Provenance detalhada: `docs/10-archive/migrations/G5_LOCAL_ONLY_PROVENANCE.md`.

- `20260826032200_restore_private_safety_evidence_storage_flow.sql` → `LOCAL_ONLY_SUPERSEDED_UNSAFE`; nunca aplicada remotamente, tinha correlação ambígua e foi supersedida por `20260829161927_repair_safety_evidence_storage_owner_policies.sql`.
- `20260829111000_align_get_user_roles_validity.sql` → `LOCAL_ONLY_SUPERSEDED`; nunca aplicada remotamente e foi substituída pela autoridade instalada em `20260829202444_repair_get_user_roles_validity.sql`.

Os blobs foram preservados em `docs/10-archive/migrations/` e removidos de `supabase/migrations` para impedir aplicação atrasada por um futuro `db push`.

## 3. Content mismatches conhecidos — NÃO renomeados automaticamente

Estes nomes existem no remoto, mas o array de statements remoto foi armazenado com SQL compactado/reformatado e não passa pela equivalência estrita do reconciliador atual. Não tratar como alias sem reconstrução/provenance explícita.

- local `20260825190000_gate_admin_moderation_views.sql` ↔ remoto `20260825185039_gate_admin_moderation_views`
- local `20260825224500_add_server_authoritative_operational_pin_rpcs.sql` ↔ remoto `20260825223319_add_server_authoritative_operational_pin_rpcs`
- local `20260825225000_tighten_operational_verification_legacy_surface.sql` ↔ remoto `20260825223637_tighten_operational_verification_legacy_surface`
- local `20260825230000_lock_operational_verifications_behind_rpcs.sql` ↔ remoto `20260825223929_lock_operational_verifications_behind_rpcs`
- local `20260825231500_canonicalize_sensitive_admin_policies.sql` ↔ remoto `20260825224111_canonicalize_sensitive_admin_policies`

Não relaxar o comparador apenas para fazer estes casos passarem. A equivalência precisa ser demonstrada com parser/fingerprint suficientemente seguro ou pela reconstrução canônica do statement array remoto com provenance.

## 4. Regras para continuidade

1. Continuar aliases por pequenos lotes, sempre consultando os `statements` remotos antes do rename.
2. `local-only` não significa automaticamente “aplicar”: procurar supersession, caller, estado remoto e provenance.
3. `remote-only` não significa automaticamente “recriar”: verificar se o artefato local foi perdido e usar `supabase/migration-provenance.json` quando já houver reconstrução histórica aprovada.
4. `content mismatch` permanece blocker até prova explícita; não mascarar com timestamp remoto.
5. Não marcar `schema atual vs migrations` como concluído enquanto houver local-only, remote-only ou content mismatch sem classificação.
6. Não executar `db push` enquanto a paridade de identidade continuar aberta.

## 5. Próximo corte

Continuar a sequência de aliases do bloco de membership/authority e depois classificar os conflitos restantes em:

- alias exato;
- local-only superseded/unsafe;
- local-only pendente de decisão;
- remote-only recuperável;
- content mismatch com reconstrução canônica necessária.
