# ✅ Atualizações - URLs Canônicas de Classificados

## 📝 Resumo das Alterações

Sistema completo de URLs canônicas implementado e integrado em todos os componentes.

## 🔄 Componentes Atualizados

### 1. Tipos e Interfaces

**`src/modules/classifieds/types/classified.ts`**
- ✅ Adicionado `slug: string` - derivado do título
- ✅ Adicionado `public_id: string` - identificador estável
- ✅ Adicionado `category_id?: string` - FK para categorias
- ✅ Adicionado `subcategory_id?: string` - FK para subcategorias

**`src/modules/classifieds/hooks/useClassificados.ts`**
- ✅ Interface `ClassificadoWithVendedor` atualizada com `public_id`
- ✅ Mapeamento de dados inclui `public_id`

**`src/core/classifieds/services/ClassifiedService.ts`**
- ✅ Interface `ClassifiedData` atualizada com `slug`, `public_id`, `category_id`, `subcategory_id`
- ✅ Método `createClassified` gera slug automaticamente

### 2. Hooks de Navegação

**`src/modules/classifieds/hooks/useClassifiedUrls.ts`**
- ✅ Adicionado método `short(publicId)` - retorna `/c/:publicId`
- ✅ Método `detail(id)` marcado como deprecated
- ✅ Documentação atualizada

**`src/modules/classifieds/hooks/useClassificadosPage.ts`**
- ✅ `handleClassificadoClick` usa `classifiedUrls.short(c.public_id)`
- ✅ Navegação sempre pelo link curto (estável)

### 3. Páginas e Componentes

**`src/modules/classifieds/pages/ClassificadoDetailPage.tsx`**
- ✅ Aceita prop `classifiedId?: string`
- ✅ Suporta resolução por ID interno ou public_id

**`src/modules/classifieds/hooks/useClassificadoDetail.ts`**
- ✅ Aceita opção `classifiedId?: string`
- ✅ Prioriza `classifiedId` sobre param da URL

**`src/core/routing/components/TerritorialLandingPage.tsx`**
- ✅ Import de `useClassifiedUrls` adicionado
- ✅ Hook `classifiedUrls` inicializado com `resolved`
- ✅ Navegação usa `classifiedUrls.short(c.public_id)`

**`src/core/messaging/pages/ChatPage.tsx`**
- ✅ Import de `useClassifiedUrls` adicionado
- ✅ Hook `classifiedUrls` inicializado
- ⚠️ Navegação ainda usa ID interno (conversation não tem public_id)

### 4. Rotas

**`src/App.tsx`**
- ✅ Rota curta: `/c/:publicId` → `ClassifiedShortRoute`
- ✅ Rota canônica: `/classificados/:uf/:cidade/:bairro/:categoria/:subcategoria/:slug/:publicId` → `ClassifiedCanonicalRoute`
- ✅ Rotas de hub por cidade, bairro, categoria e subcategoria

**`src/core/routing/components/ClassifiedCanonicalRoute.tsx`**
- ✅ Resolve classificado pela URL canônica completa
- ✅ Detecta URL desatualizada
- ✅ Redirect 308 para canonical atual
- ✅ 404 se não encontrado

**`src/core/routing/components/ClassifiedShortRoute.tsx`**
- ✅ Resolve classificado por public_id
- ✅ Sempre redireciona para canonical atual
- ✅ 404 se não encontrado

## 🎯 Padrão de Navegação Implementado

### Links Internos (Listagens, Cards)
```typescript
// ✅ CORRETO - Usa link curto com public_id
navigate(classifiedUrls.short(classificado.public_id));
// Resultado: /c/ab12cd34
```

### Links Públicos (Compartilhamento)
```typescript
// ✅ CORRETO - Link curto sempre funciona
const shareUrl = `${window.location.origin}/c/${classificado.public_id}`;
// Resultado: https://app.com/c/ab12cd34
```

### URLs Canônicas (SEO, Breadcrumbs)
```typescript
// ✅ CORRETO - URL completa para SEO
const canonical = await classifiedUrlService.getUrlContext(classifiedId);
// Resultado: /classificados/ba/salvador/pituba/moveis/guarda-roupas/armario-cozinha/ab12cd34
```

## 🔍 Fluxo de Resolução

1. **Usuário clica em classificado** → Navega para `/c/ab12cd34`
2. **ClassifiedShortRoute** → Resolve por `public_id`
3. **Redirect 308** → `/classificados/ba/salvador/pituba/moveis/guarda-roupas/armario-cozinha/ab12cd34`
4. **ClassifiedCanonicalRoute** → Valida URL canônica
5. **Se URL desatualizada** → Redirect 308 para nova canonical
6. **Se URL válida** → Renderiza `ClassificadoDetailPage`

## ✅ Benefícios Implementados

1. **URLs Legíveis**: `/classificados/ba/salvador/pituba/moveis/guarda-roupas/armario-cozinha/ab12cd34`
2. **Links Curtos**: `/c/ab12cd34` (fácil de compartilhar)
3. **Estabilidade**: `public_id` nunca muda, links sempre funcionam
4. **SEO**: URLs canônicas com palavras-chave (UF, cidade, bairro, categoria)
5. **Hiperlocal**: Território sempre presente na URL
6. **Histórico**: URLs antigas redirecionam automaticamente
7. **SSOT**: Nenhum componente monta URLs manualmente

## ⚠️ Pendências

### ChatPage
- ❌ `conversation.classified_id` não tem `public_id`
- ❌ Navegação ainda usa ID interno
- 🔧 **Solução**: Atualizar tipo `ConversationWithDetails` para incluir `classified_public_id`

### Migration
- ⏳ Aplicar migration no banco de dados
- ⏳ Validar geração de `public_id` e `slug`
- ⏳ Testar triggers de histórico

### Testes
- ✅ Testes unitários passando (14/14)
- ⚠️ Testes de integração precisam de ajustes nos mocks

## 🚀 Próximos Passos

1. Aplicar migration: `supabase/migrations/20260329000020_classified_canonical_urls.sql`
2. Validar geração automática de `slug` e `public_id`
3. Testar navegação em desenvolvimento
4. Atualizar tipo `ConversationWithDetails` para incluir `classified_public_id`
5. Validar redirects de URLs antigas
6. Testar compartilhamento de links curtos

## 📊 Checklist de Validação

- [x] ClassifiedUrlService criado e testado
- [x] Rotas canônicas e curtas implementadas
- [x] Hooks atualizados para usar URLs corretas
- [x] Tipos atualizados com `slug` e `public_id`
- [x] Componentes de listagem usam link curto
- [x] Página de detalhe aceita `classifiedId`
- [x] Migration criada com triggers
- [x] Testes unitários passando
- [ ] Migration aplicada no banco
- [ ] Testes de integração ajustados
- [ ] Validação em desenvolvimento
- [ ] ChatPage atualizado com `public_id`
