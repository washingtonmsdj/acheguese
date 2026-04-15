# scripts-legados — ARQUIVO HISTÓRICO

Scripts SQL e de seed movidos de `scripts/` em 2026-03-30.

**NÃO EXECUTAR sem revisar o conteúdo.**

## Conteúdo

| Arquivo | Tipo | Motivo do archive |
|---|---|---|
| `seed_tonecosloja.sql` | Seed de usuário real | Contém UUID e email de usuário real (PII). Não é seed genérico. |
| `seed_tonecosloja_anuncios.sql` | Seed de anúncios | Depende de `seed_tonecosloja.sql`. Dados de usuário real. |
| `all-migrations.sql` | Consolidação manual | Consolidação manual de todas as migrations. Pode conflitar com estado atual do banco. |
| `apply-constraints-manual.sql` | Constraints manuais | Constraints já aplicadas via migrations canônicas. Marcado como "não usado" em `ETAPA_12B_COMPLETA.md`. |
| `add_admin_user.sql` | Bootstrap de admin | Contém email e senha hardcoded de usuário real (PII). Substituído por `src/modules/admin/pages/AdminSetupPage.tsx`. |
