# MIGRATION REDE/FILIAIS — APROVADA PARA VALIDAÇÃO

## Status

✅ **ARQUITETURA APROVADA**  
⚠️  **MIGRATION APROVADA PARA STAGING**  
❌ **NÃO APLICAR EM PRODUÇÃO SEM VALIDAÇÃO**

## Correções Aplicadas

✅ **1. Standalone COM location_id** — `check_standalone_has_location`

✅ **2. Standalone SEM parent** — `check_standalone_no_parent`

✅ **3. Policy alinhada ao SSOT** — `Profile members manage business` usa `profile_members` com roles `owner`/`admin`

✅ **4. Policy brand_hub renomeada** — `Brand hubs public read` (isolamento territorial via services)

✅ **5. unit_name apenas em branch** — `check_unit_name_only_branch`

## Constraints de Integridade

**brand_hub**: ❌ parent, ❌ location  
**standalone**: ❌ parent, ✅ location  
**branch**: ✅ parent, ✅ location

**Extras**: headquarters só em branch, unit_name só em branch, parent aponta para brand_hub, uma headquarters por marca

## Arquivos

- `supabase/migrations/20260331000002_create_network_branches.sql` — Migration
- `scripts/validate_network_migration.sql` — Validação pré-produção
- `scripts/fix_network_migration_blockers.sql` — Correção de bloqueadores
- `scripts/SMOKE_TEST_NETWORK.md` — Smoke tests manuais

## Processo de Validação Obrigatório

### FASE 1: Validação de Dados (Staging)

```bash
# 1. Executar validação
psql $DATABASE_URL -f scripts/validate_network_migration.sql

# 2. Se houver bloqueadores, corrigir
psql $DATABASE_URL -f scripts/fix_network_migration_blockers.sql

# 3. Re-validar até tudo OK
psql $DATABASE_URL -f scripts/validate_network_migration.sql
```

### FASE 2: Aplicar Migration (Staging)

```bash
# Aplicar migration
psql $DATABASE_URL -f supabase/migrations/20260331000002_create_network_branches.sql
```

### FASE 3: Smoke Tests (Staging)

Executar TODOS os testes em `scripts/SMOKE_TEST_NETWORK.md`:

- [ ] 1. Listagem territorial
- [ ] 2. Detalhe bairro + slug
- [ ] 3. Conversão standalone → rede
- [ ] 4. Criação de branch
- [ ] 5. Página /marcas/:slug
- [ ] 6. Teste de policies
- [ ] 7. Teste de constraints

### FASE 4: Produção

✅ **SE TODOS OS TESTES PASSAREM EM STAGING**:
- Repetir FASE 1 em produção (validação)
- Aplicar migration em produção
- Executar smoke tests críticos

❌ **SE ALGUM TESTE FALHAR**:
- Rollback em staging
- Corrigir problemas
- Re-testar

## Critérios de Aprovação para Produção

✅ Validação de dados sem bloqueadores  
✅ Migration aplicada com sucesso em staging  
✅ Todos os smoke tests passaram  
✅ Nenhum erro em logs  
✅ Performance aceitável

## Rollback

Se necessário, script de rollback disponível em `scripts/SMOKE_TEST_NETWORK.md`

