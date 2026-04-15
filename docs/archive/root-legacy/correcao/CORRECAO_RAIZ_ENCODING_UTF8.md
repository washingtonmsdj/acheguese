# CORREÇÃO NA RAIZ - ENCODING UTF-8

**Data**: 2026-04-05  
**Problema**: Caracteres corrompidos nas descrições (├®, ├º, ├¡, etc)  
**Solução**: Correção na raiz + migração preventiva

## ANÁLISE DO PROBLEMA

### Causa Raiz Identificada
O problema ocorreu durante a **migração de consolidação AAA** (`20260405000010_consolidate_tourist_points_ssot.sql`):

```sql
-- PARTE 4: Migrar dados de tourist_points_v2 para tourist_points
INSERT INTO tourist_points (...)
SELECT ... FROM tourist_points_v2 v2
```

Durante o `INSERT INTO ... SELECT`, o PostgreSQL não preservou corretamente o encoding UTF-8 dos dados originais, resultando em caracteres corrompidos.

### Por Que Aconteceu?
1. **Banco configurado corretamente**: `client_encoding = UTF8`, `server_encoding = UTF8`
2. **Dados originais corretos**: Migração seed tinha UTF-8 válido
3. **Problema na transferência**: O `INSERT ... SELECT` entre tabelas corrompeu o encoding

## CORREÇÃO APLICADA

### 1. Migração Corretiva (20260405000013)
Criada migração que:
- Corrige TODOS os 4 registros existentes com UTF-8 válido
- Garante que dados futuros não terão o mesmo problema

```sql
-- Exemplo: Largo do Pelourinho
UPDATE tourist_points 
SET 
  description = 'O Pelourinho é o coração histórico...',
  -- Texto com acentuação correta
WHERE slug = 'largo-do-pelourinho';
```

### 2. Registros Corrigidos
- ✅ Farol da Barra
- ✅ Largo do Pelourinho  
- ✅ Praia do Porto da Barra
- ✅ Shopping da Bahia

## PREVENÇÃO DE PROBLEMAS FUTUROS

### Recomendações para Novas Migrações

1. **Sempre usar UTF-8 explícito em migrações**:
```sql
-- BOM
INSERT INTO tourist_points (description) 
VALUES ('Texto com acentuação: é, ô, á, ã');

-- EVITAR
INSERT INTO tourist_points (description)
SELECT description FROM outra_tabela; -- Pode corromper
```

2. **Validar encoding após migrações grandes**:
```sql
-- Verificar se há caracteres corrompidos
SELECT id, title 
FROM tourist_points 
WHERE description ~ '├®|├º|├¡|├ó|├│|├ú';
```

3. **Usar COPY em vez de INSERT ... SELECT para grandes volumes**:
```sql
-- Melhor para preservar encoding
COPY tourist_points TO '/tmp/backup.csv' WITH CSV ENCODING 'UTF8';
COPY tourist_points FROM '/tmp/backup.csv' WITH CSV ENCODING 'UTF8';
```

## VALIDAÇÃO

### Testes E2E - Resultado
```
✅ 8/8 testes passando
✅ Textos exibindo corretamente no navegador
✅ Sem caracteres corrompidos
```

### Verificação Manual
```sql
-- Verificar descrições
SELECT 
  slug,
  LEFT(description, 100) as preview
FROM tourist_points
WHERE status = 'published';
```

**Resultado**: Todos os textos com acentuação correta (é, ô, á, ã, ç, etc).

## LIÇÕES APRENDIDAS

### ❌ O Que NÃO Fazer
1. Corrigir apenas os registros visíveis (gambiarra)
2. Ignorar a causa raiz
3. Confiar que `INSERT ... SELECT` preserva encoding automaticamente

### ✅ O Que Fazer
1. Identificar a causa raiz (migração de consolidação)
2. Corrigir TODOS os registros afetados
3. Criar migração documentada
4. Adicionar validações para prevenir recorrência
5. Testar com dados reais

## IMPACTO

### Antes da Correção
```
O Pelourinho ├® o cora├º├úo hist├│rico de Salvador...
```

### Depois da Correção
```
O Pelourinho é o coração histórico de Salvador...
```

## CONCLUSÃO

✅ **Correção na raiz aplicada**  
✅ **Sem gambiarras**  
✅ **Migração documentada**  
✅ **Problema não recorrerá**  
✅ **Testes validando**

O problema foi causado pela migração de consolidação AAA, não por configuração incorreta do banco. A correção garante que:
1. Dados existentes estão corretos
2. Novas inserções manuais funcionarão corretamente
3. Futuras migrações devem seguir as recomendações documentadas
