# 🔧 Correção: Query de Categorias

**Data**: 2026-03-30  
**Problema**: Erro 400 ao buscar classificados

## 🐛 Problema Identificado

A aplicação estava retornando erro 400 (Bad Request) ao tentar buscar classificados:

```
GET /rest/v1/classifieds?select=*,seller:profiles!seller_id(...),locations!inner(geographic_path),classified_categories!inner(slug),classified_subcategories!inner(slug)&is_active=eq.true
```

### Causa Raiz

As queries estavam usando `!inner` join (obrigatório) nas tabelas de categorias:

```typescript
classified_categories!inner(slug),
classified_subcategories!inner(slug)
```

Isso significa que **apenas classificados com categoria seriam retornados**. Como a migration acabou de ser aplicada e alguns classificados podem não ter categoria ainda, a query falhava.

## ✅ Solução Aplicada

Mudei para **left join** (opcional) em todas as queries:

```typescript
classified_categories(slug),
classified_subcategories(slug)
```

### Arquivos Corrigidos

1. `src/core/classifieds/services/ClassifiedService.ts`
   - Método `getAllClassifieds()`

2. `src/core/classifieds/services/ClassifiedUrlService.ts`
   - Método `resolveByPublicId()`
   - Método `resolveOldUrl()`
   - Método `getUrlContext()`

3. `src/core/landing/LandingFeaturedService.ts`
   - Método de busca de classificados em destaque

## 📊 Impacto

- ✅ Classificados SEM categoria agora são retornados
- ✅ Classificados COM categoria continuam funcionando
- ✅ Não quebra funcionalidade existente
- ⚠️ URLs canônicas só funcionam para classificados COM categoria

## 🔄 Próximos Passos

1. **Garantir que TODOS os classificados tenham categoria**
   - A migration já fez isso para classificados com `location_id` válido
   - Classificados sem `location_id` foram marcados como inativos

2. **Validar no banco**
   ```sql
   SELECT COUNT(*) 
   FROM classifieds 
   WHERE status = 'active' 
     AND (category_id IS NULL OR subcategory_id IS NULL);
   ```
   
   Resultado esperado: 0

3. **Após validação, podemos voltar para `!inner` join**
   - Isso garante que apenas classificados válidos sejam retornados
   - Melhora performance (menos dados retornados)

## 🎯 Status Atual

- ✅ Aplicação funcionando
- ✅ Classificados sendo listados
- ✅ Erro 400 corrigido
- ⏳ Aguardando validação de dados no banco

---

**Nota**: Esta é uma correção temporária. Após validar que todos os classificados ativos têm categoria, podemos voltar para `!inner` join para garantir integridade dos dados.
