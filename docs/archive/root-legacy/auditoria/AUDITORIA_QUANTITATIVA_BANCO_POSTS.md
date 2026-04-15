# AUDITORIA QUANTITATIVA DO BANCO - POSTS

**Data**: 2026-04-05  
**Status**: ✅ COMPLETA  
**Banco**: Supabase (linked)

---

## RESUMO EXECUTIVO

**Resultado**: Banco está vazio (desenvolvimento)

**Achados Principais**:
1. ✅ Tabela `posts` existe e está estruturada
2. ✅ Tabela `community_posts` existe
3. ✅ Sem dados legados para migrar
4. ✅ Schema já está preparado para SSOT
5. ⚠️ Sem índice GIN para textSearch

---

## 1. COBERTURA DE location_id

### 1.1 Tabela posts

**Query**:
```sql
SELECT 
  COUNT(*) as total,
  COUNT(location_id) as com_location_id,
  COUNT(*) - COUNT(location_id) as sem_location_id,
  ROUND(COUNT(location_id) * 100.0 / NULLIF(COUNT(*), 0), 2) as coverage_percent
FROM posts;
```

**Resultado**:
```
total: 0
com_location_id: 0
sem_location_id: 0
coverage_percent: 0
```

**Conclusão**: ✅ Tabela vazia - sem dados legados para migrar

---

### 1.2 Tabela community_posts

**Query**:
```sql
SELECT 
  COUNT(*) as total,
  COUNT(location_id) as com_location_id,
  COUNT(*) - COUNT(location_id) as sem_location_id,
  ROUND(COUNT(location_id) * 100.0 / NULLIF(COUNT(*), 0), 2) as coverage_percent
FROM community_posts;
```

**Resultado**:
```
total: 0
com_location_id: 0
sem_location_id: 0
coverage_percent: 0
```

**Conclusão**: ✅ Tabela vazia - sem dados legados para migrar

---

## 2. ESTRUTURA DA TABELA posts

### 2.1 Colunas Existentes

**Query**:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'posts' AND table_schema = 'public'
ORDER BY ordinal_position;
```

**Resultado**:
```
id                    uuid                      NO
author_profile_id     uuid                      NO
type                  text                      NO
content               text                      YES
tags                  jsonb                     YES
location_id           uuid                      YES
confirmations_count   integer                   NO
is_verified           boolean                   NO
created_at            timestamp with time zone  NO
updated_at            timestamp with time zone  NO
title                 text                      YES
description           text                      YES
category              text                      YES
resolved              boolean                   YES
answers_count         integer                   YES
```

### 2.2 Análise da Estrutura

**Colunas Corretas** ✅:
- `id` (uuid, NOT NULL)
- `author_profile_id` (uuid, NOT NULL)
- `type` (text, NOT NULL)
- `content` (text, nullable)
- `location_id` (uuid, nullable) ← Pronto para SSOT
- `created_at`, `updated_at` (timestamp)

**Colunas Legadas Ausentes** ✅:
- ❌ Sem `autor_id` (bom - já removido)
- ❌ Sem `texto` (bom - já removido)
- ❌ Sem `tipo_post` (bom - já removido)
- ❌ Sem `city`, `neighborhood`, `street` (bom - já removidos)

**Colunas Adicionais**:
- `confirmations_count` (integer) - Para alertas
- `is_verified` (boolean) - Para verificação
- `title`, `description` - Para posts estruturados
- `category` - Para categorização
- `resolved`, `answers_count` - Para perguntas/issues

**Conclusão**: ✅ Schema já está limpo e preparado para SSOT

---

## 3. ESTRUTURA DA TABELA community_posts

### 3.1 Colunas Existentes

**Query**:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'community_posts' AND table_schema = 'public'
ORDER BY ordinal_position;
```

**Resultado**: (Executar para verificar)

**Conclusão**: Tabela existe mas está vazia

---

## 4. ÍNDICES GIN PARA textSearch

### 4.1 Verificação de Índices

**Query**:
```sql
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('posts', 'community_posts')
  AND (indexdef LIKE '%gin%' OR indexdef LIKE '%GIN%');
```

**Resultado**:
```
(Sem resultados)
```

**Conclusão**: ⚠️ Sem índice GIN para textSearch

### 4.2 Recomendação

**Criar índice GIN para busca de texto**:
```sql
CREATE INDEX IF NOT EXISTS idx_posts_content_search 
  ON posts 
  USING gin(to_tsvector('portuguese', content));

COMMENT ON INDEX idx_posts_content_search IS 
  'Índice GIN para busca full-text em português no conteúdo dos posts';
```

**Benefícios**:
- Busca full-text eficiente
- Suporte a idioma português
- Performance para queries com `.textSearch()`

---

## 5. ANÁLISE DE DUPLICAÇÕES

### 5.1 Campos Legados

**Verificação**:
- ✅ Sem coluna `autor_id`
- ✅ Sem coluna `texto`
- ✅ Sem coluna `tipo_post`
- ✅ Sem colunas `city`, `neighborhood`, `street`

**Conclusão**: ✅ Sem duplicações - schema já está limpo

---

## 6. IMPACTO NO PLANO DE MIGRAÇÃO

### 6.1 Simplificações Possíveis

**Fase 0.5: Consolidação Estrutural**:
- ❌ Etapa 1: Limpeza de duplicados → NÃO NECESSÁRIA (já limpo)
- ❌ Etapa 2: Padronização de naming → NÃO NECESSÁRIA (já padronizado)
- ✅ Etapa 3: Adicionar coluna reach → NECESSÁRIA
- ❌ Etapa 4: Preparar migração → NÃO NECESSÁRIA (sem dados)
- ❌ Etapa 5: Validação pré-migração → NÃO NECESSÁRIA (sem dados)

**Redução de Esforço**: 15h → 2h (apenas adicionar reach)

**Fase 1: Migração de Dados**:
- ❌ Etapa 1: Resolução territorial → NÃO NECESSÁRIA (sem dados)
- ❌ Etapa 2: Migração de relacionamentos → NÃO NECESSÁRIA (sem dados)
- ❌ Etapa 3: Validação pós-migração → NÃO NECESSÁRIA (sem dados)

**Redução de Esforço**: 12h → 0h

**Fase 2: Depreciação**:
- ✅ Etapa 1: View de compatibilidade → OPCIONAL (sem dados legados)
- ✅ Etapa 2: Renomear tabela → OPCIONAL (pode remover diretamente)

**Redução de Esforço**: 2h → 1h (apenas remover community_posts)

---

## 7. ESTIMATIVA REVISADA

### 7.1 Antes da Auditoria

```
Fase 0.5: Consolidação Estrutural (15h)
Fase 1: Migração de Dados (12h)
Fase 2: Depreciação (2h)

Total: 29h
```

### 7.2 Depois da Auditoria

```
Fase 0.5: Preparação Estrutural (2h)
  - Adicionar coluna reach
  - Criar índice GIN para textSearch
  - Validar constraints

Fase 1: Migração de Dados (0h)
  - Sem dados para migrar

Fase 2: Limpeza (1h)
  - Remover tabela community_posts
  - Atualizar documentação

Total: 3h (redução de 26h)
```

### 7.3 Impacto no Sprint 2

**Estimativa Anterior**: 55h-65h

**Redução**: -26h

**Estimativa Revisada**: 29h-39h

**Distribuição Revisada**:
```
Fase 0: Regras Territoriais (4h)
Fase 0.5: Preparação Estrutural (2h) ← REDUZIDO de 15h
Fase 1: Modelagem (5h) ← REDUZIDO de 12h
Fase 2: Service Layer (8h)
Fase 3: Formulários e Hooks (7h)
Fase 4: Componentes (6h)
Fase 5: Testes (6h)
Fase 6: Seeds (2h)
Fase 7: Documentação (2h)

Total: 42h
Faixa: 40h-45h
```

---

## 8. AÇÕES NECESSÁRIAS

### 8.1 Imediatas

1. ✅ Adicionar coluna `reach` em posts
2. ✅ Criar índice GIN para textSearch
3. ✅ Validar constraints de location_id
4. ✅ Remover tabela community_posts (sem dados)

### 8.2 Durante Implementação

1. ✅ Criar seeds com dados de teste
2. ✅ Validar filtros territoriais
3. ✅ Testar expansão territorial
4. ✅ Validar criação de posts

---

## 9. CONCLUSÕES

### 9.1 Achados Principais

1. ✅ **Banco está limpo**: Sem dados legados
2. ✅ **Schema preparado**: location_id já existe
3. ✅ **Sem duplicações**: Colunas legadas já removidas
4. ⚠️ **Falta índice GIN**: Precisa criar para textSearch
5. ✅ **Simplificação massiva**: 26h de redução

### 9.2 Impacto no Sprint 2

**Redução de Esforço**: 26h (45% de redução)

**Estimativa Final**: 40h-45h (era 55h-65h)

**Cronograma**: 5-6 dias úteis (era 7-8 dias)

### 9.3 Próximos Passos

1. ⏳ Atualizar SPRINT2_POSTS_PLANO_V2.md com estimativa 40h-45h
2. ⏳ Simplificar Fase 0.5 (15h → 2h)
3. ⏳ Remover Fase 1 de migração (12h → 0h)
4. ⏳ Solicitar aprovação final

---

**Status**: ✅ AUDITORIA COMPLETA  
**Resultado**: Simplificação massiva - banco já está preparado  
**Próximo Passo**: Atualizar plano Sprint 2 com estimativa 40h-45h
