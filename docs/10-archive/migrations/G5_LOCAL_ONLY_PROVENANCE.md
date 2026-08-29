# G5 — migrations locais retiradas do conjunto aplicável

Este diretório preserva artefatos SQL que existiam localmente em `supabase/migrations`, mas que **não pertencem ao histórico remoto aplicável**. Eles não podem voltar para `supabase/migrations` sem nova análise de provenance.

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
