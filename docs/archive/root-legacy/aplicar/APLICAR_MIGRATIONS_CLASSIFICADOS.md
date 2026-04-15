# 🚀 Guia de Aplicação - Migrations de URLs Canônicas

## 📋 Ordem de Execução

Execute as migrations nesta ordem exata:

### 1️⃣ Migration de Estrutura (Categorias, Campos, Triggers)
```bash
supabase migration up 20260329000020
```

**O que faz:**
- Cria campos `slug`, `public_id`, `category_id`, `subcategory_id`
- Cria tabelas `classified_categories` e `classified_subcategories`
- Cria tabela `classified_url_history`
- Cria triggers de geração automática
- Seed de categorias iniciais (8 categorias, múltiplas subcategorias)

### 2️⃣ Migration de Dados Existentes
```bash
supabase migration up 20260330000000
```

**O que faz:**
- Gera `public_id` para classificados existentes
- Gera `slug` a partir do título
- Associa categoria/subcategoria padrão
- Valida `location_id` aponta para bairro
- Marca como inativo classificados inválidos
- Cria índices de performance
- Exibe relatório completo

## 📊 Validação Pós-Migration

### 1. Verificar Logs da Migration

A migration exibe um relatório completo:
```
📊 Total de classificados: X
⚠️  Sem public_id: X
⚠️  Sem slug: X
⚠️  Sem categoria/subcategoria: X
⚠️  Sem location_id: X
⚠️  Com location_id inválido: X
✅ Classificados atualizados: X
⚠️  Classificados marcados como inativos: X

✅ MIGRATION CONCLUÍDA COM SUCESSO

📊 ESTATÍSTICAS FINAIS:
  Ativos: X
  Inativos: X
  Com dados completos para URL: X
```

### 2. Query de Validação

Execute no Supabase SQL Editor:

```sql
-- Verificar classificados ativos com dados completos
SELECT 
  COUNT(*) as total_validos,
  COUNT(CASE WHEN public_id IS NULL THEN 1 END) as sem_public_id,
  COUNT(CASE WHEN slug IS NULL THEN 1 END) as sem_slug,
  COUNT(CASE WHEN category_id IS NULL THEN 1 END) as sem_category,
  COUNT(CASE WHEN subcategory_id IS NULL THEN 1 END) as sem_subcategory,
  COUNT(CASE WHEN location_id IS NULL THEN 1 END) as sem_location
FROM classifieds
WHERE status = 'active';

-- Verificar classificados marcados como inativos
SELECT 
  id,
  title,
  location_id,
  category_id,
  subcategory_id,
  public_id,
  slug
FROM classifieds
WHERE status = 'inactive'
  AND updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;

-- Verificar URLs canônicas de exemplo
SELECT 
  c.id,
  c.title,
  c.slug,
  c.public_id,
  l.geographic_path,
  cat.slug as category_slug,
  subcat.slug as subcategory_slug,
  CONCAT(
    '/classificados/',
    SPLIT_PART(LTRIM(l.geographic_path, '/'), '/', 2), '/',
    SPLIT_PART(LTRIM(l.geographic_path, '/'), '/', 3), '/',
    SPLIT_PART(LTRIM(l.geographic_path, '/'), '/', 4), '/',
    cat.slug, '/',
    subcat.slug, '/',
    c.slug, '/',
    c.public_id
  ) as canonical_url
FROM classifieds c
JOIN locations l ON c.location_id = l.id
JOIN classified_categories cat ON c.category_id = cat.id
JOIN classified_subcategories subcat ON c.subcategory_id = subcat.id
WHERE c.status = 'active'
LIMIT 5;
```

### 3. Corrigir Classificados Inválidos

Se houver classificados marcados como inativos, corrija manualmente:

```sql
-- Exemplo: Associar classificado a um bairro válido
UPDATE classifieds
SET 
  location_id = (SELECT id FROM locations WHERE name = 'Pituba' AND type = 'district' LIMIT 1),
  status = 'active',
  updated_at = NOW()
WHERE id = 'classificado-id-aqui';

-- Exemplo: Associar categoria válida
UPDATE classifieds
SET 
  category_id = (SELECT id FROM classified_categories WHERE slug = 'moveis' LIMIT 1),
  subcategory_id = (SELECT id FROM classified_subcategories WHERE slug = 'guarda-roupas' LIMIT 1),
  status = 'active',
  updated_at = NOW()
WHERE id = 'classificado-id-aqui';
```

## 🧪 Testes no Frontend

### 1. Testar Navegação Interna

```
1. Acesse: http://localhost:5173/classificados/ba/salvador
2. Clique em um classificado
3. Verifique URL na barra: /classificados/ba/salvador/[bairro]/[categoria]/[subcategoria]/[slug]/[publicId]
4. URL deve ser legível e completa ✅
```

### 2. Testar Link Curto

```
1. Copie um public_id de um classificado
2. Acesse: http://localhost:5173/c/[publicId]
3. Deve redirecionar para URL canônica ✅
4. Verifique redirect 308 no Network tab
```

### 3. Testar Compartilhamento

```
1. Abra um classificado
2. Clique no botão de compartilhar
3. Verifique que copiou: /c/[publicId] ✅
4. Cole em nova aba
5. Deve redirecionar para canonical ✅
```

### 4. Testar Mudança de Título

```
1. Edite um classificado e mude o título
2. Salve
3. Acesse a URL antiga (com slug antigo)
4. Deve redirecionar para nova canonical ✅
5. Verifique histórico no banco:
   SELECT * FROM classified_url_history WHERE classified_id = 'id-aqui';
```

## 🔍 Monitoramento

### Queries Úteis

**Classificados sem dados completos:**
```sql
SELECT id, title, public_id, slug, category_id, subcategory_id, location_id
FROM classifieds
WHERE status = 'active'
  AND (
    public_id IS NULL 
    OR slug IS NULL 
    OR category_id IS NULL 
    OR subcategory_id IS NULL 
    OR location_id IS NULL
  );
```

**Histórico de URLs:**
```sql
SELECT 
  h.old_canonical_url,
  h.change_reason,
  h.changed_at,
  c.title,
  c.slug as current_slug
FROM classified_url_history h
JOIN classifieds c ON h.classified_id = c.id
ORDER BY h.changed_at DESC
LIMIT 10;
```

**Performance de queries:**
```sql
EXPLAIN ANALYZE
SELECT * FROM classifieds
WHERE status = 'active'
  AND location_id = 'location-id-aqui'
ORDER BY created_at DESC
LIMIT 20;
```

## ⚠️ Troubleshooting

### Problema: Classificado sem URL canônica

**Causa:** Falta `location_id`, `category_id` ou `subcategory_id`

**Solução:**
```sql
-- Verificar dados
SELECT id, title, location_id, category_id, subcategory_id
FROM classifieds
WHERE id = 'classificado-id';

-- Corrigir
UPDATE classifieds
SET 
  location_id = 'location-id-valido',
  category_id = 'category-id-valido',
  subcategory_id = 'subcategory-id-valido'
WHERE id = 'classificado-id';
```

### Problema: URL antiga não redireciona

**Causa:** Histórico não foi registrado

**Solução:**
```sql
-- Inserir manualmente no histórico
INSERT INTO classified_url_history (classified_id, old_canonical_url, old_slug, change_reason)
VALUES (
  'classificado-id',
  '/classificados/ba/salvador/pituba/moveis/guarda-roupas/slug-antigo/ab12cd34',
  'slug-antigo',
  'slug_changed'
);
```

### Problema: public_id duplicado

**Causa:** Geração aleatória colidiu (extremamente raro)

**Solução:**
```sql
-- Gerar novo public_id
UPDATE classifieds
SET public_id = fn_generate_classified_public_id()
WHERE id = 'classificado-id';
```

## 📈 Métricas de Sucesso

Após aplicar as migrations, você deve ter:

- ✅ 100% dos classificados ativos com `public_id`
- ✅ 100% dos classificados ativos com `slug`
- ✅ 100% dos classificados ativos com `category_id` e `subcategory_id`
- ✅ 100% dos classificados ativos com `location_id` válido (bairro)
- ✅ 0 erros de TypeScript
- ✅ 14/14 testes unitários passando
- ✅ Navegação funcionando com URLs canônicas
- ✅ Compartilhamento funcionando com links curtos
- ✅ Redirects funcionando para URLs antigas

## 🎉 Conclusão

Sistema profissional implementado, sem gambiarras, seguindo 100% o SSOT e a decisão técnica oficial. Pronto para produção após aplicar as migrations e validar em desenvolvimento.
