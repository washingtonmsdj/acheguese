# ✅ Checklist de Aceite - URLs Canônicas de Classificados

## 📋 Decisão Técnica Implementada

Sistema completo de URLs públicas canônicas, hiperlocalais, legíveis e estáveis para classificados.

## 🎯 Padrão Oficial

### URLs Implementadas

1. **Canônica**: `/classificados/:uf/:cidade/:bairro/:categoria/:subcategoria/:slug/:publicId`
   - Exemplo: `/classificados/ba/salvador/pituba/moveis/guarda-roupas/armario-de-cozinha/ab12cd34`

2. **Curta**: `/c/:publicId`
   - Exemplo: `/c/ab12cd34`
   - Redireciona para canonical atual

### Componentes da URL

- `slug`: derivado do título, pode mudar
- `public_id`: identificador estável (8 chars), nunca muda
- `uf`, `cidade`, `bairro`: extraídos do `geographic_path` da location
- `categoria`, `subcategoria`: slugs das tabelas de categorias

## ✅ Testes Obrigatórios

### 1. Geração de Slug
- [ ] Slug gerado automaticamente a partir do título
- [ ] Remove acentos corretamente
- [ ] Remove caracteres especiais
- [ ] Converte para lowercase
- [ ] Substitui espaços por hífens
- [ ] Remove hífens duplicados

### 2. Public ID
- [ ] Public ID único e estável gerado automaticamente
- [ ] 8 caracteres alfanuméricos
- [ ] Não muda quando título/categoria/localização mudam

### 3. URL Canônica
- [ ] Classificado com bairro/categoria/subcategoria gera canonical correta
- [ ] URL inclui todos os segmentos obrigatórios
- [ ] Formato: `/classificados/:uf/:cidade/:bairro/:categoria/:subcategoria/:slug/:publicId`

### 4. Resolução por Public ID
- [ ] Link curto `/c/:publicId` resolve classificado
- [ ] Redireciona para canonical atual
- [ ] Retorna 404 se public_id não existe

### 5. Redirect de URL Antiga
- [ ] Mudança de título altera slug
- [ ] URL antiga registrada no histórico
- [ ] Acesso à URL antiga redireciona para nova canonical
- [ ] Redirect é 308 (Permanent Redirect)

### 6. Mudança de Bairro
- [ ] Mudança de location_id altera URL
- [ ] URL antiga preservada no histórico
- [ ] Redirect funciona corretamente

### 7. Mudança de Categoria
- [ ] Mudança de category_id ou subcategory_id altera URL
- [ ] URL antiga preservada no histórico
- [ ] Redirect funciona corretamente

### 8. Rota Inexistente
- [ ] URL com public_id inexistente retorna 404
- [ ] URL com formato inválido retorna 404

### 9. SSOT Compliance
- [ ] Nenhum componente monta URL pública manualmente
- [ ] Todos usam ClassifiedUrlService
- [ ] useClassifiedUrls retorna URLs corretas

### 10. Hubs de Listagem
- [ ] `/classificados/:uf/:cidade` - hub da cidade
- [ ] `/classificados/:uf/:cidade/:bairro` - hub do bairro
- [ ] `/classificados/:uf/:cidade/:bairro/:categoria` - hub categoria no bairro
- [ ] `/classificados/:uf/:cidade/:bairro/:categoria/:subcategoria` - hub subcategoria

## 🏗️ Arquitetura Implementada

### Modelagem
- ✅ Campo `slug` na tabela `classifieds`
- ✅ Campo `public_id` na tabela `classifieds`
- ✅ Campos `category_id` e `subcategory_id` na tabela `classifieds`
- ✅ Tabela `classified_categories` com seed inicial
- ✅ Tabela `classified_subcategories` com seed inicial
- ✅ Tabela `classified_url_history` para histórico
- ✅ Índices de unicidade e busca
- ✅ Trigger para gerar `public_id` automaticamente
- ✅ Trigger para gerar `slug` automaticamente
- ✅ Trigger para registrar histórico de URLs

### Serviço
- ✅ `ClassifiedUrlService` criado
- ✅ Método `buildUrls()` - gera canonical, short, edit
- ✅ Método `resolveByPublicId()` - resolve por public_id
- ✅ Método `resolveByCanonicalUrl()` - detecta URL desatualizada
- ✅ Método `generateSlug()` - gera slug do título
- ✅ Método `getUrlContext()` - busca contexto completo
- ✅ Função `slugify()` exportada

### Routing
- ✅ Rota canônica: `/classificados/:uf/:cidade/:bairro/:categoria/:subcategoria/:slug/:publicId`
- ✅ Rota curta: `/c/:publicId`
- ✅ Rotas de hub por cidade, bairro, categoria e subcategoria
- ✅ Componente `ClassifiedCanonicalRoute`
- ✅ Componente `ClassifiedShortRoute`

### UI
- ✅ Hook `useClassifiedUrls` atualizado
- ✅ Componente `ClassifiedUrlPreview` para preview de URL
- ✅ Página de detalhe aceita `classifiedId` como prop
- ✅ Hook `useClassificadoDetail` aceita `classifiedId` como opção

### Testes
- ✅ Testes unitários do `ClassifiedUrlService`
- ✅ Testes de integração das rotas
- ✅ Testes de geração de slug
- ✅ Testes de resolução e redirect

## 📝 Comandos de Teste

```bash
# Executar testes unitários
npm test src/core/classifieds/services/__tests__/ClassifiedUrlService.test.ts

# Executar testes de integração
npm test src/core/routing/components/__tests__/ClassifiedRoutes.integration.test.tsx

# Executar todos os testes de classificados
npm test classifieds
```

## 🚀 Próximos Passos

1. Aplicar migration no banco de dados
2. Executar testes
3. Validar geração de slug e public_id
4. Testar resolução de URLs
5. Validar redirects de URLs antigas
6. Verificar preview de URL na criação
7. Confirmar que nenhum componente monta URLs manualmente

## ⚠️ Avisos Importantes

- Classificados SEM `location_id` apontando para bairro são inválidos
- Classificados SEM `category_id` e `subcategory_id` são inválidos
- URLs antigas são preservadas no histórico e redirecionam automaticamente
- O `public_id` é a âncora estável - nunca muda
- O `slug` pode mudar se o título mudar
- Mudanças de território ou categoria alteram a URL canônica
