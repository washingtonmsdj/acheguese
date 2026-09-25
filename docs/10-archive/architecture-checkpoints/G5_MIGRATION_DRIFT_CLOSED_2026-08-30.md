# G5 — Migration identity drift closure — 2026-08-30

Status: **CLOSED**  
Escopo: identidade `supabase/migrations/*.sql` ↔ `supabase_migrations.schema_migrations`.  
Critério canônico: `tools/supabase/validate-supabase-remote-migration-drift.ts` — zero duplicate local versions, `ALIAS=0`, `CONFLICT=0`, `LOCAL_ONLY=0`, `REMOTE_ONLY=0`.

## 1. Base da prova

O full-set reconciliation imediatamente anterior a este checkpoint consultou o histórico vivo e isolou apenas os candidatos pendentes que foram tratados nesta sequência: aliases/version mismatches de 26/08, um `name_content_mismatch` de `harden_community_entity_link_manager_helper` e migrations `LOCAL_ONLY` cuja provenance precisava ser resolvida.

A reconciliação foi fechada sem editar o ledger remoto e sem executar migrations antigas apenas para fazer o comparador passar.

## 2. Delta final reconciliado

As identidades abaixo existem no `main` sob a mesma versão e nome registrados no Supabase:

- `20260826040419_consolidate_territorial_group_admin_authority.sql`
- `20260826043003_restrict_site_settings_public_columns.sql`
- `20260826072953_harden_community_entity_link_manager_helper.sql`
- `20260826082614_harden_community_membership_manager_helper.sql`
- `20260826095937_unify_business_profile_management_authority.sql`
- `20260830091107_canonicalize_report_rpc_authenticated_only_contract_g5.sql`

Os quatro primeiros aliases puros de versão foram canonicalizados por filename sem reaplicar DDL. O caso `20260826072953_harden_community_entity_link_manager_helper` não foi tratado como alias cego: o conteúdo local divergente foi preservado em archive/provenance e o artefato ativo foi restaurado para a identidade/conteúdo registrados remotamente.

A migration de reports foi forward-only: o antigo hardening local nunca aplicado não foi empurrado com timestamp histórico. A autoridade foi reconciliada no remoto sob `20260830091107`, e o arquivo ativo usa exatamente essa identidade.

## 3. Local-only resolvidos

Os antigos `LOCAL_ONLY` foram retirados da fila aplicável somente após provenance:

- report RPC hardening → substituído por `20260830091107_canonicalize_report_rpc_authenticated_only_contract_g5.sql`, aplicado forward-only;
- private helper hardening antigo → supersedido pelas migrations canônicas de 25/08 que removem execução anônima;
- cadeia histórica de account deletion de 21/08 → nunca aplicada; autoridade viva/canônica é `20260826015916_reconcile_account_deletion_authority_live_drift.sql`;
- blobs divergentes/obsoletos permanecem auditáveis em `docs/10-archive/migrations/` e no histórico Git.

Nenhum SQL antigo foi aplicado apenas para apagar `LOCAL_ONLY`.

## 4. Estado remoto final observado

Consulta viva de `supabase_migrations.schema_migrations` em 2026-08-30:

- `migration_count = 477`
- primeira versão: `20260412000000`
- última versão: `20260830091107`

As seis identidades alteradas no delta final foram consultadas diretamente no ledger e correspondem por `version + name` aos seis arquivos ativos listados acima.

### Nota sobre a busca de código do GitHub

Uma consulta ao índice de code search retornou `398` SQLs em `supabase/migrations`, mas o mesmo índice não retornou corretamente a migration recém-criada `20260830091107` como arquivo ativo. Essa cardinalidade foi rejeitada como evidência porque code search é índice assíncrono e pode estar stale. A árvore Git/`fetch_file` do HEAD e o ledger vivo são as autoridades usadas neste checkpoint.

## 5. Resultado

Com o full-set reconciliation anterior preservado e o delta final acima resolvido, não permanece candidato conhecido em nenhuma classe do reconciliador:

- `ALIAS = 0`
- `CONFLICT = 0`
- `LOCAL_ONLY = 0`
- `REMOTE_ONLY = 0`
- duplicate local version conhecida = `0`

Portanto, o item G5 **schema atual vs migrations** fica fechado neste checkpoint.

Isso **não fecha G5 inteiro**. RLS/grants, funções/RPC authority, legados/orphans, fixtures/E2E provenance, schema integrity, fail-closed/idempotência e source↔DB contract continuam governados pelos seus checkpoints próprios até fechamento integral.

## 6. Do not repeat

- não reconstruir novamente os aliases de 26/08 já canonicalizados;
- não reintroduzir os SQLs de account deletion de 21/08 na fila ativa;
- não aplicar timestamps históricos apenas para igualar ledger;
- não usar GitHub code-search cardinality como prova de migration parity;
- não alterar `supabase_migrations.schema_migrations` manualmente para fabricar PASS;
- não executar `db push --linked` se um novo full-set reconciliation voltar a apresentar drift.
