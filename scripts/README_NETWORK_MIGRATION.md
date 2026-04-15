# PROCESSO DE VALIDAÇÃO E APLICAÇÃO: Migration Rede/Filiais

## Visão Geral

Migration para suporte a rede/marca + filiais em `business_data`.

**Status**: ✅ Arquitetura aprovada, ⚠️ Validação obrigatória antes de produção

---

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `supabase/migrations/20260331000002_create_network_branches.sql` | Migration SQL |
| `scripts/validate_network_migration.sql` | Validação pré-produção |
| `scripts/fix_network_migration_blockers.sql` | Correção de bloqueadores |
| `scripts/SMOKE_TEST_NETWORK.md` | Smoke tests manuais |
| `ARQUITETURA_REDE_FILIAIS_FINAL.md` | Documentação completa |
| `MIGRATION_REDE_APROVADA.md` | Status e processo |

---

## Processo Completo

### 1️⃣ VALIDAÇÃO (Staging)

```bash
# Conectar ao banco staging
export DATABASE_URL="postgresql://..."

# Executar validação
psql $DATABASE_URL -f scripts/validate_network_migration.sql > validation_report.txt

# Revisar relatório
cat validation_report.txt
```

**Critérios**:
- ✅ OK → Prosseguir para aplicação
- ⚠️ ATENÇÃO → Aplicar com cuidado, corrigir depois
- ❌ BLOQUEADOR → Corrigir antes de aplicar

### 2️⃣ CORREÇÃO (Se necessário)

```bash
# Executar correções automáticas
psql $DATABASE_URL -f scripts/fix_network_migration_blockers.sql

# Correções manuais (se necessário)
# Ver output do script para instruções

# Re-validar
psql $DATABASE_URL -f scripts/validate_network_migration.sql
```

### 3️⃣ APLICAÇÃO (Staging)

```bash
# Backup antes de aplicar
pg_dump $DATABASE_URL > backup_before_network_migration.sql

# Aplicar migration
psql $DATABASE_URL -f supabase/migrations/20260331000002_create_network_branches.sql

# Verificar sucesso
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'business_data' AND column_name IN ('business_role', 'parent_business_id', 'is_headquarters', 'unit_name');"
```

**Esperado**: 4 colunas retornadas

### 4️⃣ SMOKE TESTS (Staging)

Executar TODOS os testes em `scripts/SMOKE_TEST_NETWORK.md`:

```bash
# Checklist
- [ ] 1. Listagem territorial
- [ ] 2. Detalhe bairro + slug
- [ ] 3. Conversão standalone → rede
- [ ] 4. Criação de branch
- [ ] 5. Página /marcas/:slug
- [ ] 6. Teste de policies
- [ ] 7. Teste de constraints
```

**Critério**: TODOS devem passar

### 5️⃣ PRODUÇÃO (Se tudo OK)

```bash
# Conectar ao banco produção
export DATABASE_URL="postgresql://..."

# 1. Validação em produção
psql $DATABASE_URL -f scripts/validate_network_migration.sql > prod_validation.txt

# 2. Corrigir bloqueadores (se houver)
psql $DATABASE_URL -f scripts/fix_network_migration_blockers.sql

# 3. Backup completo
pg_dump $DATABASE_URL > backup_prod_before_network.sql

# 4. Aplicar migration
psql $DATABASE_URL -f supabase/migrations/20260331000002_create_network_branches.sql

# 5. Smoke tests críticos
# - Listagem territorial
# - Detalhe bairro + slug
# - Teste de constraints

# 6. Monitorar logs por 1 hora
```

---

## Rollback (Emergência)

Se algo der errado em produção:

```bash
# Restaurar backup
psql $DATABASE_URL < backup_prod_before_network.sql

# OU executar rollback manual
# Ver scripts/SMOKE_TEST_NETWORK.md seção "ROLLBACK"
```

---

## Problemas Comuns

### Empresas sem location_id

**Sintoma**: Erro `check_standalone_has_location`

**Solução**:
```sql
-- Inferir do metadata
UPDATE business_data bd
SET location_id = l.id
FROM locations l
WHERE bd.location_id IS NULL
  AND bd.metadata->>'neighborhood' IS NOT NULL
  AND l.name ILIKE bd.metadata->>'neighborhood'
  AND l.type = 'district';

-- OU marcar como deleted
UPDATE business_data
SET status = 'deleted'
WHERE location_id IS NULL AND status != 'deleted';
```

### Colisões de slug

**Sintoma**: Erro `idx_business_data_slug_per_location`

**Solução**: Desambiguar manualmente (ver `fix_network_migration_blockers.sql`)

### Empresas sem profile_members

**Sintoma**: Não consegue editar empresa após migration

**Solução**:
```sql
INSERT INTO profile_members (profile_id, user_id, role)
SELECT bd.profile_id, p.user_id, 'owner'
FROM business_data bd
JOIN profiles p ON p.id = bd.profile_id
LEFT JOIN profile_members pm ON pm.profile_id = bd.profile_id
WHERE pm.id IS NULL
ON CONFLICT DO NOTHING;
```

---

## Suporte

- Documentação: `ARQUITETURA_REDE_FILIAIS_FINAL.md`
- Smoke tests: `scripts/SMOKE_TEST_NETWORK.md`
- Validação: `scripts/validate_network_migration.sql`
- Correções: `scripts/fix_network_migration_blockers.sql`

---

## Checklist Final

Antes de aplicar em produção:

- [ ] Validação executada em staging
- [ ] Bloqueadores corrigidos
- [ ] Migration aplicada em staging
- [ ] Todos os smoke tests passaram
- [ ] Backup de produção criado
- [ ] Validação executada em produção
- [ ] Bloqueadores corrigidos em produção
- [ ] Migration aplicada em produção
- [ ] Smoke tests críticos executados
- [ ] Logs monitorados por 1 hora
- [ ] Nenhum erro detectado

✅ **APROVADO PARA PRODUÇÃO**
