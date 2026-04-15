# ✅ Correções Finais - URLs Canônicas de Classificados

## 🎯 Problema Identificado

O link `/c/:publicId` estava sendo usado para navegação interna, quando deveria ser APENAS para compartilhamento. A navegação interna deve usar a URL canônica completa.

## 🔧 Correções Aplicadas

### 1. Navegação Interna → URL Canônica

**Antes (ERRADO):**
```typescript
// Navegava para link curto
navigate(classifiedUrls.short(c.public_id)); // /c/ab12cd34
```

**Depois (CORRETO):**
```typescript
// Navega para URL canônica completa
if (c.geographic_path && c.category_slug && c.subcategory_slug && c.slug && c.public_id) {
  const urls = classifiedUrlService.buildUrls({
    id: c.id,
    public_id: c.public_id,
    slug: c.slug,
    geographic_path: c.geographic_path,
    category_slug: c.category_slug,
    subcategory_slug: c.subcategory_slug,
  });
  navigate(urls.canonical); // /classificados/ba/salvador/pituba/moveis/guarda-roupas/armario-cozinha/ab12cd34
}
```

### 2. Dados Completos na Listagem

Para evitar queries adicionais, os dados necessários para construir a URL canônica agora vêm direto da listagem:

**ClassifiedService.getAllClassifieds():**
```sql
SELECT 
  *,
  locations!inner(geographic_path),
  classified_categories!inner(slug),
  classified_subcategories!inner(slug)
FROM classifieds
```

**Tipos Atualizados:**
- `ClassifiedData` - Inclui `geographic_path`, `category_slug`, `subcategory_slug`
- `ClassificadoWithVendedor` - Inclui `slug`, `geographic_path`, `category_slug`, `subcategory_slug`
- `FeaturedClassified` - Inclui `public_id`, `slug`, `geographic_path`, `category_slug`, `subcategory_slug`

### 3. Componentes Atualizados

**useClassificadosPage.ts:**
- ✅ `handleClassificadoClick` constrói URL canônica
- ✅ Fallback para link curto se dados incompletos

**TerritorialLandingPage.tsx:**
- ✅ `ClassifiedCard` recebe `classifiedUrls` como prop
- ✅ Constrói URL canônica com dados disponíveis
- ✅ Fallback para link curto se dados incompletos

**LandingFeaturedService.ts:**
- ✅ `getFeaturedClassifieds` busca dados completos para URL
- ✅ Inclui joins com `locations`, `classified_categories`, `classified_subcategories`

## 📊 Migration Profissional

Criada migration `20260330000000_migrate_existing_classifieds.sql` que:

### Atualiza Classificados Válidos
- ✅ Gera `public_id` para classificados sem ele
- ✅ Gera `slug` a partir do título
- ✅ Associa `category_id` e `subcategory_id` padrão ("outros")
- ✅ Valida `location_id` aponta para bairro (district)

### Marca Inválidos como Inativos
- ⚠️ Classificados sem `location_id`
- ⚠️ Classificados com `location_id` inválido (não é bairro)

### Cria Índices de Performance
- `idx_classifieds_active_location_created` - Listagem por território
- `idx_classifieds_active_category` - Listagem por categoria

### Logs Detalhados
```
📊 Total de classificados: X
⚠️  Sem public_id: X
⚠️  Sem slug: X
⚠️  Sem categoria/subcategoria: X
⚠️  Sem location_id: X
⚠️  Com location_id inválido: X
✅ Classificados atualizados: X
⚠️  Classificados marcados como inativos: X
```

## 🔄 Fluxo Correto

### Navegação Interna (Listagens, Cards)
```
Usuário clica → URL canônica completa
/classificados/ba/salvador/pituba/moveis/guarda-roupas/armario-cozinha/ab12cd34
```

### Compartilhamento (Botão Share)
```
Usuário compartilha → Link curto
/c/ab12cd34
```

### Resolução do Link Curto
```
1. Usuário acessa /c/ab12cd34
2. ClassifiedShortRoute resolve por public_id
3. Redirect 308 para canonical atual
4. /classificados/ba/salvador/pituba/moveis/guarda-roupas/armario-cozinha/ab12cd34
```

## ✅ Benefícios

1. **SEO Otimizado** - URLs canônicas com palavras-chave
2. **UX Melhor** - URLs legíveis mostram contexto (cidade, bairro, categoria)
3. **Compartilhamento Fácil** - Link curto `/c/:publicId` sempre funciona
4. **Estabilidade** - `public_id` nunca muda, links antigos sempre funcionam
5. **Performance** - Dados para URL vêm na listagem, sem queries extras
6. **SSOT Compliance** - Nenhum componente monta URLs manualmente

## 🚀 Aplicar Migration

```bash
# 1. Aplicar migration de categorias (se ainda não aplicada)
psql -d database -f supabase/migrations/20260329000020_classified_canonical_urls.sql

# 2. Aplicar migration de dados existentes
psql -d database -f supabase/migrations/20260330000000_migrate_existing_classifieds.sql

# 3. Verificar logs e estatísticas
# A migration exibe relatório completo no console
```

## ⚠️ Ações Pós-Migration

1. **Revisar classificados inativos** - Corrigir `location_id` manualmente
2. **Validar URLs no frontend** - Testar navegação e compartilhamento
3. **Monitorar erros** - Verificar se algum classificado não tem dados completos
4. **Atualizar documentação** - Informar usuários sobre novo formato de URLs

## 📝 Checklist Final

- [x] Navegação interna usa URL canônica
- [x] Link curto apenas para compartilhamento
- [x] Dados completos vêm na listagem
- [x] Tipos atualizados com novos campos
- [x] Componentes atualizados
- [x] Migration profissional criada
- [x] Índices de performance criados
- [x] Logs e estatísticas detalhados
- [x] Fallback para dados incompletos
- [x] TypeScript válido (0 erros)
- [ ] Migration aplicada no banco
- [ ] Testes em desenvolvimento
- [ ] Validação de URLs
- [ ] Monitoramento de erros
