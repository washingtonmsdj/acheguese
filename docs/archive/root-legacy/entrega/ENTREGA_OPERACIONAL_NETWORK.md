# ENTREGA OPERACIONAL: Migration Rede/Filiais

## STATUS

✅ **ARQUITETURA APROVADA**  
⚠️  **STAGING: AGUARDANDO VALIDAÇÃO**  
❌ **PRODUÇÃO: BLOQUEADA ATÉ STAGING PASSAR 100%**

---

## PROCESSO OFICIAL: Supabase CLI

O projeto usa Supabase CLI como fluxo oficial de migrations.

### STAGING

```bash
# 1. Validar dados antes de aplicar
psql $STAGING_DATABASE_URL -f scripts/validate_network_migration.sql > validation_staging.txt

# 2. Revisar relatório de validação
cat validation_staging.txt

# 3. Se houver bloqueadores, corrigir
psql $STAGING_DATABASE_URL -f scripts/fix_network_migration_blockers.sql

# 4. Re-validar até tudo OK
psql $STAGING_DATABASE_URL -f scripts/validate_network_migration.sql

# 5. Aplicar migration via Supabase CLI
supabase db push --db-url="$STAGING_DATABASE_URL"

# 6. Executar smoke tests (ver scripts/SMOKE_TEST_NETWORK.md)
# Todos os 7 testes devem passar
```

### PRODUÇÃO

```bash
# 1. Validar dados em produção
psql $PRODUCTION_DATABASE_URL -f scripts/validate_network_migration.sql > validation_prod.txt

# 2. Revisar relatório
cat validation_prod.txt

# 3. Corrigir bloqueadores (se houver)
psql $PRODUCTION_DATABASE_URL -f scripts/fix_network_migration_blockers.sql

# 4. Backup completo OBRIGATÓRIO
pg_dump $PRODUCTION_DATABASE_URL > backup_prod_$(date +%Y%m%d_%H%M%S).sql

# 5. Aplicar migration via Supabase CLI
supabase db push --db-url="$PRODUCTION_DATABASE_URL"

# 6. Smoke tests críticos
# - Listagem territorial
# - Detalhe bairro + slug
# - Teste de constraints
# - CASO CRÍTICO: Slug repetido em bairros diferentes

# 7. Monitorar logs por 1 hora
```

---

## ROLLBACK

Script SQL executável real disponível.

### Quando Usar

❌ Falha crítica que impede operação  
❌ Erro de dados com perda de informação  
❌ Performance crítica que inutiliza sistema  
❌ Erro de lógica que aplica regras incorretas

### Como Executar

```bash
# Backup antes de rollback (OBRIGATÓRIO)
pg_dump $DATABASE_URL > backup_before_rollback_$(date +%Y%m%d_%H%M%S).sql

# Executar rollback
psql $DATABASE_URL -f scripts/rollback_network_migration.sql

# Verificar que rollback funcionou
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'business_data' AND column_name IN ('business_role', 'parent_business_id');"
# Esperado: 0 linhas
```

### Riscos

⚠️ **Perda de dados**: Branches e brand_hubs criados após migration serão perdidos  
⚠️ **Inconsistência temporária**: Sistema pode ficar inconsistente durante rollback  
⚠️ **Slug único global**: Pode recriar constraint que causa colisões

**Documentação completa**: `scripts/ROLLBACK_GUIDE.md`

---

## CASO CRÍTICO: Slug Territorial Repetido

### Cenário

Duas empresas com MESMO slug em bairros DIFERENTES devem coexistir sem conflito.

**Exemplo**:
- Empresa A: `/empresas/ba/salvador/pituba/sabor-da-bahia`
- Empresa B: `/empresas/ba/salvador/barra/sabor-da-bahia`

### Validação Adicional

```sql
-- Verificar que mesmo slug em bairros diferentes coexiste
SELECT 
  bd.business_name,
  bd.slug,
  l.full_name as bairro,
  l.geographic_path
FROM business_data bd
JOIN locations l ON l.id = bd.location_id
WHERE bd.slug = 'sabor-da-bahia'
  AND bd.status = 'active'
ORDER BY l.full_name;
-- Esperado: Múltiplas linhas (uma por bairro)

-- Verificar resolução por bairro + slug (Pituba)
SELECT COUNT(*) FROM business_data bd
JOIN locations l ON l.id = bd.location_id
WHERE bd.slug = 'sabor-da-bahia'
  AND l.slug = 'pituba'
  AND bd.status = 'active';
-- Esperado: 1

-- Verificar resolução por bairro + slug (Barra)
SELECT COUNT(*) FROM business_data bd
JOIN locations l ON l.id = bd.location_id
WHERE bd.slug = 'sabor-da-bahia'
  AND l.slug = 'barra'
  AND bd.status = 'active';
-- Esperado: 1
```

### Smoke Test

✅ Listagem territorial não colide (filtra por location_id)  
✅ Detalhe público não colide (resolve por bairro + slug)  
✅ URLs únicas funcionam corretamente  
✅ Índice `idx_business_data_slug_per_location` garante unicidade por bairro

**Documentação completa**: `scripts/SMOKE_TEST_NETWORK.md` seção 4

---

## CHECKLIST FINAL DE APROVAÇÃO PARA PRODUÇÃO

### PRÉ-REQUISITOS
- [ ] Validação executada em staging sem bloqueadores
- [ ] Migration aplicada em staging com sucesso
- [ ] Todos os 7 smoke tests passaram em staging
- [ ] Caso crítico de slug territorial testado e aprovado
- [ ] Nenhum erro em logs de staging por 24 horas
- [ ] Performance aceitável em staging

### VALIDAÇÃO PRODUÇÃO
- [ ] Validação executada em produção
- [ ] Bloqueadores corrigidos (se houver)
- [ ] Backup completo de produção criado
- [ ] Equipe notificada sobre deploy

### APLICAÇÃO PRODUÇÃO
- [ ] Migration aplicada via Supabase CLI
- [ ] Smoke tests críticos executados
- [ ] Caso crítico de slug territorial validado
- [ ] Logs monitorados por 1 hora
- [ ] Nenhum erro crítico detectado

### PÓS-DEPLOY
- [ ] Aplicação funcionando normalmente
- [ ] Métricas de performance normais
- [ ] Nenhum report de usuário sobre problemas
- [ ] Documentação atualizada

---

## CONFIRMAÇÃO OBJETIVA

### STAGING

⚠️  **AGUARDANDO VALIDAÇÃO**

Executar processo de staging e marcar checklist acima.

### PRODUÇÃO

❌ **BLOQUEADA ATÉ STAGING PASSAR 100%**

Produção permanece bloqueada até:
1. Todos os smoke tests passarem em staging
2. Caso crítico de slug territorial validado
3. Nenhum erro em staging por 24 horas
4. Checklist de pré-requisitos completo

---

## ARQUIVOS

| Arquivo | Descrição |
|---------|-----------|
| `supabase/migrations/20260331000002_create_network_branches.sql` | Migration SQL |
| `scripts/validate_network_migration.sql` | Validação pré-aplicação |
| `scripts/fix_network_migration_blockers.sql` | Correção de bloqueadores |
| `scripts/SMOKE_TEST_NETWORK.md` | 7 smoke tests obrigatórios |
| `scripts/rollback_network_migration.sql` | Rollback executável |
| `scripts/ROLLBACK_GUIDE.md` | Guia de rollback |
| `ARQUITETURA_REDE_FILIAIS_FINAL.md` | Arquitetura completa |

---

## SUPORTE

- Validação: `scripts/validate_network_migration.sql`
- Correções: `scripts/fix_network_migration_blockers.sql`
- Smoke tests: `scripts/SMOKE_TEST_NETWORK.md`
- Rollback: `scripts/rollback_network_migration.sql`
- Guia rollback: `scripts/ROLLBACK_GUIDE.md`
- Arquitetura: `ARQUITETURA_REDE_FILIAIS_FINAL.md`
