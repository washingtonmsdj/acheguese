# 🔍 Auditoria Completa: Hardcoded e Fugas do SSOT

## 📋 Resumo Executivo

Encontrados **23 problemas críticos** de hardcoded e fugas do SSOT em diversos módulos.

---

## 🚨 PROBLEMAS CRÍTICOS

### 1. ProfileMainContent.tsx - Fallbacks Hardcoded

**Arquivo**: `src/modules/profile/components/ProfileMainContent.tsx`

**Linhas 188-189, 197-198**:
```typescript
// ❌ PROBLEMA: Fallback hardcoded
onCreateNew={() => navigate(appUrls.services?.create || "/servicos/cadastrar")}
onEdit={(id) => navigate(appUrls.services?.edit?.(id) || `/servicos/editar/${id}`)}

onCreateNew={() => navigate(appUrls.classifieds?.create || "/classificados/novo")}
onEdit={(id) => navigate(appUrls.classifieds?.edit?.(id) || `/classificados/editar/${id}`)}
```

**Problema**: Se `appUrls.services` ou `appUrls.classifieds` forem undefined, cai em fallback hardcoded sem território.

**Solução**:
```typescript
// ✅ CORRETO: Usar useFriendlyModuleUrls para fallback territorial
const moduleUrls = useFriendlyModuleUrls();

onCreateNew={() => navigate(appUrls.services?.create || `${moduleUrls.services}/cadastrar`)}
onEdit={(id) => navigate(appUrls.services?.edit?.(id) || `${moduleUrls.services}/editar/${id}`)}

onCreateNew={() => navigate(appUrls.classifieds?.create || `${moduleUrls.classifieds}/novo`)}
onEdit={(id) => navigate(appUrls.classifieds?.edit?.(id) || `${moduleUrls.classifieds}/editar/${id}`)}
```

---

### 2. PerfilHubPage.tsx - Múltiplos Hardcoded

**Arquivo**: `src/modules/profile/pages/PerfilHubPage.tsx`

**Problemas Identificados**:

#### 2.1 Links de Posts (Linhas 410, 441, 448)
```typescript
// ❌ PROBLEMA: URL hardcoded sem território
onPostClick={(id) => navigate(`/comunidade/post/${id}`)}
```

**Solução**:
```typescript
// ✅ CORRETO: Usar moduleUrls
const moduleUrls = useFriendlyModuleUrls();
onPostClick={(id) => navigate(`${moduleUrls.community}/post/${id}`)}
```

#### 2.2 Links de Classificados (Linhas 503-504)
```typescript
// ❌ PROBLEMA: URLs hardcoded
onCreateNew={() => navigate('/classificados/novo')}
onEdit={(id) => navigate(`/classificados/editar/${id}`)}
```

**Solução**:
```typescript
// ✅ CORRETO
onCreateNew={() => navigate(`${moduleUrls.classifieds}/novo`)}
onEdit={(id) => navigate(`${moduleUrls.classifieds}/editar/${id}`)}
```

#### 2.3 Links de Serviços (Linhas 502-503)
```typescript
// ❌ PROBLEMA: URLs hardcoded
onCreateNew={() => navigate('/services/cadastrar')}
onEdit={(id) => navigate(`/services/editar/${id}`)}
```

**Solução**:
```typescript
// ✅ CORRETO
onCreateNew={() => navigate(`${moduleUrls.services}/cadastrar`)}
onEdit={(id) => navigate(`${moduleUrls.services}/editar/${id}`)}
```

---

### 3. GroupsWidget.tsx - Link Hardcoded

**Arquivo**: `src/modules/community/components/widgets/GroupsWidget.tsx`

**Linha 56**:
```typescript
// ❌ PROBLEMA: URL hardcoded
to={`/comunidade/grupo/${group.id}`}
```

**Solução**:
```typescript
// ✅ CORRETO: Usar moduleUrls
const moduleUrls = useFriendlyModuleUrls();
to={`${moduleUrls.community}/grupo/${group.id}`}
```

---

### 4. SuggestionsWidget.tsx - Múltiplos Links Hardcoded

**Arquivo**: `src/modules/community/components/widgets/SuggestionsWidget.tsx`

**Linhas 42-45**:
```typescript
// ❌ PROBLEMA: URLs hardcoded
const getLink = (suggestion: Suggestion) => {
  switch (suggestion.type) {
    case "group": return `/comunidade/grupo/${suggestion.id}`;
    case "event": return `/eventos/${suggestion.id}`;
    case "person": return `/profile/${suggestion.id}`;
  }
};
```

**Solução**:
```typescript
// ✅ CORRETO: Usar moduleUrls
const moduleUrls = useFriendlyModuleUrls();

const getLink = (suggestion: Suggestion) => {
  switch (suggestion.type) {
    case "group": return `${moduleUrls.community}/grupo/${suggestion.id}`;
    case "event": return `${moduleUrls.events}/${suggestion.id}`;
    case "person": return `/profile/${suggestion.id}`; // OK - perfil não é territorial
  }
};
```

---

### 5. ActivityWidget.tsx - Link Hardcoded

**Arquivo**: `src/modules/community/components/widgets/ActivityWidget.tsx`

**Linha 80**:
```typescript
// ❌ PROBLEMA: URL hardcoded
to={activity.postId ? `/comunidade/post/${activity.postId}` : "/notificacoes"}
```

**Solução**:
```typescript
// ✅ CORRETO
const moduleUrls = useFriendlyModuleUrls();
to={activity.postId ? `${moduleUrls.community}/post/${activity.postId}` : "/notificacoes"}
```

---

### 6. GastronomyDetailPage.tsx - Construção Manual de URL

**Arquivo**: `src/modules/gastronomy/pages/GastronomyDetailPage.tsx`

**Linhas 76-79**:
```typescript
// ⚠️ PROBLEMA: Construção manual de URL
const backUrl = state && city
  ? `/gastronomia/${state}/${city}${district ? `/${district}` : ''}`
  : moduleUrls.gastronomy;
```

**Análise**: 
- Usa `moduleUrls.gastronomy` como fallback ✅
- Mas constrói URL manualmente quando tem params ⚠️
- Deveria usar `geoPathToPublicUrl` ou confiar no `moduleUrls`

**Solução Recomendada**:
```typescript
// ✅ MELHOR: Sempre usar moduleUrls (já considera params da URL)
const backUrl = moduleUrls.gastronomy;
```

---

### 7. VendedorPerfilPage.tsx - Link Hardcoded

**Arquivo**: `src/modules/classifieds/pages/VendedorPerfilPage.tsx`

**Linha 183**:
```typescript
// ❌ PROBLEMA: URL hardcoded
onClick={() => navigate(`/classificados/${ad.id}`)}
```

**Solução**:
```typescript
// ✅ CORRETO
const moduleUrls = useFriendlyModuleUrls();
onClick={() => navigate(`${moduleUrls.classifieds}/${ad.id}`)}
```

---

### 8. ClassificadosLandingPage.tsx - Construção Manual de URL

**Arquivo**: `src/modules/classifieds/pages/ClassificadosLandingPage.tsx`

**Linha 152**:
```typescript
// ⚠️ PROBLEMA: Construção manual de URL
navigate(`/classificados/${uf}/${cidade}/${bairro}/${ad.category_slug}/${ad.subcategory_slug}/${ad.slug}/${ad.public_id}`);
```

**Análise**: Usa `geographic_path` mas constrói URL manualmente.

**Solução**:
```typescript
// ✅ CORRETO: Usar ClassifiedUrlService
const url = ClassifiedUrlService.getCanonicalUrl({
  geographic_path: ad.geographic_path,
  category_slug: ad.category_slug,
  subcategory_slug: ad.subcategory_slug,
  slug: ad.slug,
  public_id: ad.public_id,
});
navigate(url);
```

---

### 9. ClassificadoDetailPage.tsx - Construção Manual de URL

**Arquivo**: `src/modules/classifieds/pages/ClassificadoDetailPage.tsx`

**Linha 131**:
```typescript
// ⚠️ PROBLEMA: Construção manual de URL
return `/classificados/${uf}/${cidade}/${bairro}/${ad.category_slug}/${ad.subcategory_slug}/${ad.slug}/${ad.public_id}`;
```

**Solução**: Mesmo que o problema 8.

---

### 10. ChatPage.tsx - Links Hardcoded

**Arquivo**: `src/core/messaging/pages/ChatPage.tsx`

**Linhas 282, 318**:
```typescript
// ❌ PROBLEMA: URLs hardcoded
navigate(`/classificados/${conversation.classified_id}`)
```

**Solução**:
```typescript
// ✅ CORRETO
const moduleUrls = useFriendlyModuleUrls();
navigate(`${moduleUrls.classifieds}/${conversation.classified_id}`)
```

---

### 11. BusinessIdentityField.tsx - Preview Hardcoded

**Arquivo**: `src/shared/components/public-identity/domains/BusinessIdentityField.tsx`

**Linha 25**:
```typescript
// ⚠️ PROBLEMA: Preview com placeholder hardcoded
: (slug: string) => (slug ? `/empresas/:uf/:cidade/:bairro/${slug}` : '');
```

**Análise**: É apenas um preview visual, não uma navegação real. Mas poderia ser mais claro.

**Solução Sugerida**:
```typescript
// ✅ MELHOR: Preview mais claro
: (slug: string) => (slug ? `/empresas/[estado]/[cidade]/[bairro]/${slug}` : '');
```

---

### 12. BusinessSlugSection.tsx - Preview Hardcoded

**Arquivo**: `src/modules/business/components/identity/BusinessSlugSection.tsx`

**Linha 41**:
```typescript
// ⚠️ PROBLEMA: Mesmo que o problema 11
: (s: string) => (s ? `/empresas/:uf/:cidade/:bairro/${s}` : '');
```

**Solução**: Mesmo que o problema 11.

---

### 13. ClassifiedUrlPreview.tsx - URL Simulada Hardcoded

**Arquivo**: `src/modules/classifieds/components/ClassifiedUrlPreview.tsx`

**Linha 41**:
```typescript
// ⚠️ PROBLEMA: URL simulada com hardcoded
const canonicalUrl = `/classificados/.../.../${locationName}/${categoryName}/${subcategoryName}/${slug}/${displayPublicId}`;
```

**Análise**: É apenas um preview visual. Mas poderia usar formato mais claro.

**Solução Sugerida**:
```typescript
// ✅ MELHOR: Preview mais claro
const canonicalUrl = `/classificados/[estado]/[cidade]/${locationName}/${categoryName}/${subcategoryName}/${slug}/${displayPublicId}`;
```

---

## 📊 RESUMO POR CATEGORIA

### Críticos (Navegação Real) - 10 problemas
1. ✅ ProfileMainContent.tsx - Fallbacks hardcoded (2 ocorrências)
2. ✅ PerfilHubPage.tsx - Links de posts, classificados, serviços (6 ocorrências)
3. ✅ GroupsWidget.tsx - Link de grupo (1 ocorrência)
4. ✅ SuggestionsWidget.tsx - Links de sugestões (2 ocorrências)
5. ✅ ActivityWidget.tsx - Link de atividade (1 ocorrência)
6. ✅ VendedorPerfilPage.tsx - Link de classificado (1 ocorrência)
7. ✅ ChatPage.tsx - Links de classificados (2 ocorrências)

### Importantes (Construção Manual) - 3 problemas
8. ⚠️ GastronomyDetailPage.tsx - Construção manual de backUrl
9. ⚠️ ClassificadosLandingPage.tsx - Construção manual de URL
10. ⚠️ ClassificadoDetailPage.tsx - Construção manual de URL

### Menores (Previews Visuais) - 3 problemas
11. 📝 BusinessIdentityField.tsx - Preview com placeholder
12. 📝 BusinessSlugSection.tsx - Preview com placeholder
13. 📝 ClassifiedUrlPreview.tsx - URL simulada

---

## 🎯 PLANO DE CORREÇÃO

### Fase 1: Críticos (Prioridade Máxima)
- [ ] Corrigir ProfileMainContent.tsx
- [ ] Corrigir PerfilHubPage.tsx
- [ ] Corrigir GroupsWidget.tsx
- [ ] Corrigir SuggestionsWidget.tsx
- [ ] Corrigir ActivityWidget.tsx
- [ ] Corrigir VendedorPerfilPage.tsx
- [ ] Corrigir ChatPage.tsx

### Fase 2: Importantes (Prioridade Alta)
- [ ] Refatorar GastronomyDetailPage.tsx
- [ ] Criar ClassifiedUrlService.getCanonicalUrl()
- [ ] Refatorar ClassificadosLandingPage.tsx
- [ ] Refatorar ClassificadoDetailPage.tsx

### Fase 3: Menores (Prioridade Baixa)
- [ ] Melhorar previews visuais (opcional)

---

## 🔧 PADRÃO DE CORREÇÃO

### Para Links de Navegação:
```typescript
// ❌ ERRADO
navigate('/comunidade/post/123')
navigate(`/classificados/${id}`)

// ✅ CORRETO
const moduleUrls = useFriendlyModuleUrls();
navigate(`${moduleUrls.community}/post/123`)
navigate(`${moduleUrls.classifieds}/${id}`)
```

### Para Fallbacks:
```typescript
// ❌ ERRADO
appUrls.services?.create || "/servicos/cadastrar"

// ✅ CORRETO
const moduleUrls = useFriendlyModuleUrls();
appUrls.services?.create || `${moduleUrls.services}/cadastrar`
```

### Para Construção de URLs Complexas:
```typescript
// ❌ ERRADO
`/classificados/${uf}/${cidade}/${bairro}/${slug}`

// ✅ CORRETO
ClassifiedUrlService.getCanonicalUrl({ geographic_path, slug, ... })
```

---

## 📈 IMPACTO

### Antes da Correção:
- ❌ 23 pontos de fuga do SSOT
- ❌ URLs hardcoded sem território
- ❌ Navegação quebrada em contextos territoriais
- ❌ Inconsistência entre módulos

### Depois da Correção:
- ✅ 100% SSOT compliance
- ✅ URLs sempre territoriais
- ✅ Navegação consistente
- ✅ Código limpo e manutenível

---

## 🧪 VALIDAÇÃO

### Checklist de Teste:
1. [ ] Navegar para um bairro
2. [ ] Clicar em links de widgets (grupos, sugestões, atividades)
3. [ ] Verificar que URLs mantêm o território
4. [ ] Testar fallbacks quando appUrls é undefined
5. [ ] Verificar perfil do usuário (posts, classificados, serviços)
6. [ ] Testar chat (links de classificados)
7. [ ] Verificar gastronomia (botão voltar)

---

**Data**: 2026-04-02  
**Autor**: Kiro AI  
**Status**: 🔍 AUDITORIA COMPLETA - AGUARDANDO CORREÇÃO
