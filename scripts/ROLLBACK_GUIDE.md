# GUIA DE ROLLBACK: Migration Rede/Filiais

## Quando Usar Rollback

Execute rollback APENAS em caso de:

❌ **Falha crítica** — Migration quebrou funcionalidade essencial  
❌ **Erro de dados** — Constraints causaram perda de dados  
❌ **Performance crítica** — Sistema ficou inutilizável  
❌ **Erro de lógica** — Migration aplicou regras incorretas

✅ **NÃO use rollback para**:
- Bugs menores que podem ser corrigidos com hotfix
- Problemas de UI que não afetam dados
- Ajustes de performance que podem ser otimizados

---

## Ordem Correta de Execução

### 1. AVALIAR SITUAÇÃO

Antes de fazer rollback, responda:

- [ ] A falha é crítica e impede operação?
- [ ] Há dados de produção criados após a migration?
- [ ] Há alternativa menos drástica (hotfix)?
- [ ] Backup recente está disponível?

### 2. COMUNICAR

- [ ] Notificar equipe sobre rollback iminente
- [ ] Documentar motivo da falha
- [ ] Estimar tempo de indisponibilidade

### 3. BACKUP

```bash
# OBRIGATÓRIO: Backup antes de rollback
pg_dump $DATABASE_URL > backup_before_rollback_$(date +%Y%m%d_%H%M%S).sql
```

### 4. EXECUTAR ROLLBACK

**Staging**:
```bash
psql $STAGING_DATABASE_URL -f scripts/rollback_network_migration.sql
```

**Produção** (apenas se staging passou):
```bash
psql $PRODUCTION_DATABASE_URL -f scripts/rollback_network_migration.sql
```

### 5. VERIFICAR

```sql
-- Verificar que colunas foram removidas
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'business_data'
  AND column_name IN ('business_role', 'parent_business_id', 'is_headquarters', 'unit_name');
-- Esperado: 0 linhas

-- Verificar que policies antigas foram restauradas
SELECT policyname 
FROM pg_policies
WHERE tablename = 'business_data';
-- Esperado: "Active businesses viewable", "Owners manage own business"
```

### 6. TESTAR

- [ ] Listagem de empresas funciona
- [ ] Detalhe de empresa funciona
- [ ] Edição de empresa funciona
- [ ] Criação de empresa funciona

### 7. COMUNICAR CONCLUSÃO

- [ ] Notificar equipe que rollback foi concluído
- [ ] Documentar lições aprendidas
- [ ] Planejar correção da migration

---

## Riscos do Rollback

### ⚠️ PERDA DE DADOS

**Risco**: Se houver dados criados após a migration (branches, brand_hubs), eles serão perdidos.

**Mitigação**:
- Backup antes de rollback
- Verificar se há dados novos:
  ```sql
  SELECT COUNT(*) FROM business_data 
  WHERE business_role IN ('brand_hub', 'branch');
  ```
- Se houver dados, considerar migração manual antes de rollback

### ⚠️ INCONSISTÊNCIA TEMPORÁRIA

**Risco**: Durante rollback, sistema pode ficar inconsistente.

**Mitigação**:
- Colocar aplicação em modo manutenção
- Executar rollback fora de horário de pico
- Testar em staging primeiro

### ⚠️ SLUG ÚNICO GLOBAL

**Risco**: Rollback pode recriar constraint de slug único global, causando colisões.

**Mitigação**:
- Verificar se constraint existia antes da migration
- Se não existia, não recriar
- Se existia, verificar colisões antes de recriar

### ⚠️ POLICIES

**Risco**: Policies antigas podem não refletir modelo atual de permissões.

**Mitigação**:
- Verificar que policies antigas são compatíveis
- Testar permissões após rollback
- Ajustar se necessário

---

## Checklist de Rollback

### PRÉ-ROLLBACK
- [ ] Falha é crítica e justifica rollback
- [ ] Backup criado
- [ ] Equipe notificada
- [ ] Aplicação em modo manutenção (produção)

### DURANTE ROLLBACK
- [ ] Script executado sem erros
- [ ] Verificações SQL passaram
- [ ] Logs revisados

### PÓS-ROLLBACK
- [ ] Testes funcionais passaram
- [ ] Aplicação voltou ao normal
- [ ] Equipe notificada
- [ ] Documentação atualizada

---

## Alternativas ao Rollback

Antes de fazer rollback, considere:

### 1. HOTFIX
Se problema é pontual, criar migration de correção:
```sql
-- Exemplo: corrigir constraint específica
ALTER TABLE business_data DROP CONSTRAINT check_problematica;
ALTER TABLE business_data ADD CONSTRAINT check_corrigida CHECK (...);
```

### 2. FEATURE FLAG
Se problema é de lógica de negócio, desabilitar feature:
```typescript
const ENABLE_NETWORK_FEATURES = false;
```

### 3. MIGRATION FORWARD
Se problema é de dados, criar migration de correção:
```sql
-- Exemplo: corrigir dados inválidos
UPDATE business_data SET location_id = ... WHERE location_id IS NULL;
```

---

## Após Rollback

1. **Investigar causa raiz**
   - Revisar logs de erro
   - Identificar o que falhou
   - Documentar lições aprendidas

2. **Corrigir migration**
   - Ajustar SQL
   - Adicionar validações
   - Melhorar testes

3. **Re-testar em staging**
   - Aplicar migration corrigida
   - Executar todos os smoke tests
   - Validar por período maior

4. **Planejar reaplicação**
   - Escolher janela de manutenção
   - Comunicar equipe
   - Preparar plano B

---

## Suporte

- Script: `scripts/rollback_network_migration.sql`
- Validação: `scripts/validate_network_migration.sql`
- Smoke tests: `scripts/SMOKE_TEST_NETWORK.md`
- Arquitetura: `ARQUITETURA_REDE_FILIAIS_FINAL.md`
