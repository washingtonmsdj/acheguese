# ARQUITETURA DA VERTICAL DE GASTRONOMIA

## DECISÕES ARQUITETURAIS

### 1. GASTRONOMIA COMO EXTENSÃO, NÃO DUPLICAÇÃO

- ✅ Empresa continua sendo a identidade principal (business_data)
- ✅ Gastronomia é uma especialização vinculada por business_id (profile_id)
- ✅ Sem duplicar: endereço, território, avaliações, galeria, perfil público
- ✅ Reutilizar SSOT: BusinessService, ReviewsService, FavoritesService, PublicIdentityService

### 2. PADRÃO DE URL TERRITORIAL

**URLs Canônicas:**
- Listagem: `/gastronomia/:uf/:cidade/:bairro`
- Detalhe: `/gastronomia/:uf/:cidade/:bairro/:slug`

**Integração com Empresas:**
- Página empresa (`/empresas/:uf/:cidade/:bairro/:slug`) continua existindo
- Para negócios gastronômicos: CTA forte "Ver Cardápio" → redireciona para `/gastronomia/...`
- Canonical SEO: gastronomia é a página especializada, empresas é institucional

### 3. MODELAGEM DE DADOS

#### Tabela Principal: `gastronomy_profiles`
```sql
- business_id (FK → business_data.profile_id) - SSOT de identidade
- cuisine_type (tipo de culinária)
- price_range (faixa de preço: $, $$, $$$, $$$$)
- delivery_enabled, takeout_enabled, dine_in_enabled
- delivery_fee, delivery_time_min, delivery_time_max
- minimum_order
- service_area (JSONB com bairros atendidos)
- accepts_reservations
- has_parking, has_wifi, has_accessibility
- status (active, inactive, temporarily_closed)
```

#### Sistema de Cardápio Robusto

**menus** - Container do cardápio
```sql
- id, business_id, name, description, is_active, display_order
```

**menu_categories** - Categorias do cardápio
```sql
- id, menu_id, name, description, display_order, is_available
```

**menu_items** - Itens do cardápio
```sql
- id, category_id, name, description, base_price, image_url
- preparation_time, calories, is_vegetarian, is_vegan, is_gluten_free
- allergens (JSONB), ingredients (JSONB)
- is_available, is_featured, display_order
```

**menu_item_variants** - Variações (tamanhos, sabores)
```sql
- id, item_id, name, price_adjustment, is_default
```

**menu_item_addons** - Adicionais
```sql
- id, item_id, name, price, max_quantity
```

**menu_item_availability** - Disponibilidade temporal
```sql
- id, item_id, day_of_week, start_time, end_time, is_available
```

**menu_promotions** - Promoções
```sql
- id, business_id, title, description, discount_type, discount_value
- valid_from, valid_until, is_active
- applicable_items (JSONB array de item_ids)
```

### 4. ARQUITETURA DE MÓDULO

```
src/modules/gastronomy/
├── components/
│   ├── GastronomyHero.tsx
│   ├── GastronomyFilters.tsx
│   ├── GastronomyBusinessCard.tsx
│   ├── MenuCategoryTabs.tsx
│   ├── MenuItemCard.tsx
│   ├── MenuItemDetailDrawer.tsx
│   ├── StickyOrderBar.tsx
│   ├── DeliveryInfoCard.tsx
│   └── OpeningStatusBadge.tsx
├── hooks/
│   ├── useGastronomyList.ts
│   ├── useGastronomyDetail.ts
│   ├── useMenu.ts
│   └── useMenuItem.ts
├── services/
│   ├── GastronomyQueryService.ts  (queries read-only)
│   ├── GastronomyService.ts       (mutations)
│   ├── MenuQueryService.ts        (queries read-only)
│   └── MenuService.ts             (mutations)
├── types/
│   ├── gastronomy.ts
│   └── menu.ts
└── pages/
    ├── GastronomyLandingPage.tsx
    └── GastronomyDetailPage.tsx
```

### 5. SERVICE LAYER - BLINDAGEM TOTAL

**Regras:**
- ✅ ZERO `supabase.from(...)` em componentes, hooks de UI ou páginas
- ✅ Hooks apenas para estado/fetch/loading/error (React Query)
- ✅ Lógica de negócio centralizada em services
- ✅ Tipagem forte, zero `any`
- ✅ Validação de input com Zod
- ✅ Sanitização de dados

**Separação Query/Command:**
- `GastronomyQueryService` - SELECT apenas, sem side effects
- `GastronomyService` - INSERT/UPDATE/DELETE com validações
- `MenuQueryService` - SELECT de cardápio
- `MenuService` - Gerenciamento de cardápio

### 6. INTEGRAÇÃO COM SSOT EXISTENTE

**Reutilizar:**
- `BusinessService` - Dados base da empresa
- `BusinessUrlService` - URLs territoriais (adaptar para módulo gastronomia)
- `ReviewsService` - Avaliações (já suporta business)
- `FavoritesService` - Favoritos
- `PublicIdentityService` - Validação de slug
- `business_gallery` - Galeria de fotos
- `business_reviews_new` - Avaliações

**Estender:**
- Criar `GastronomyUrlService` que herda padrões de `BusinessUrlService`
- Adaptar `useBusinessUrls` para suportar módulo gastronomia

### 7. PÁGINA DE DETALHE GASTRONÔMICA

**Seções:**
1. Hero com capa, logo, nome, tipo de culinária, status aberto/fechado
2. Badges: entrega, retirada, consumo local
3. Info rápida: tempo estimado, taxa de entrega, pedido mínimo
4. Área atendida (mapa ou lista de bairros)
5. Avaliação e total de reviews (reutilizar ReviewsService)
6. Promoções ativas em destaque
7. Cardápio por categorias (tabs)
8. Item com foto, descrição, preço, variantes, adicionais
9. CTA fixo de pedido (sticky bottom bar)
10. Galeria de fotos (reutilizar business_gallery)

### 8. FLUXO DE PEDIDO MVP

**Implementar:**
- ✅ Catálogo/cardápio navegável
- ✅ Carrinho local (localStorage + React Context)
- ✅ Seleção de variantes e adicionais
- ✅ Cálculo de subtotal + taxa de entrega
- ✅ Pedido assistido: botão "Finalizar no WhatsApp"
- ✅ Mensagem formatada com itens do carrinho

**NÃO implementar agora:**
- ❌ Logística completa tipo iFood
- ❌ Chat operacional
- ❌ Sistema de entregador
- ❌ Financeiro complexo
- ❌ Marketplace de pedidos

### 9. SEO E CANONICAL

**Estratégia:**
- `/gastronomia/:uf/:cidade/:bairro/:slug` - Página especializada (canonical)
- `/empresas/:uf/:cidade/:bairro/:slug` - Página institucional geral
- Para negócios gastronômicos:
  - Empresas tem `<link rel="alternate" href="/gastronomia/...">` 
  - Gastronomia tem `<link rel="canonical" href="/gastronomia/...">`
  - CTA forte na página empresas: "Ver Cardápio Completo"

### 10. NAVEGAÇÃO CONTEXTUAL

**Integração territorial:**
- Reutilizar `useTerritorialContext()` para resolver território da rota
- Adaptar `useBusinessUrls()` para suportar módulo gastronomia
- Links contextuais: "Restaurantes em Pituba" → `/gastronomia/ba/salvador/pituba`

**Breadcrumbs:**
- Salvador > Pituba > Gastronomia > Nome do Restaurante

### 11. RLS E SEGURANÇA

**Políticas:**
- Leitura pública: gastronomy_profiles, menus, menu_categories, menu_items (is_active = true)
- Escrita: apenas owners via profile_members
- Admin: acesso total
- Validação de ownership em todos os mutations

### 12. ÍNDICES E PERFORMANCE

**Índices críticos:**
- `gastronomy_profiles(business_id)` - FK lookup
- `gastronomy_profiles(cuisine_type)` - Filtro por tipo
- `gastronomy_profiles(delivery_enabled)` - Filtro delivery
- `menu_items(category_id, display_order)` - Listagem ordenada
- `menu_items(is_featured)` - Destaques
- `menu_promotions(business_id, is_active, valid_until)` - Promoções ativas

## RISCOS IDENTIFICADOS

1. **Performance de cardápio grande** - Mitigar com paginação e lazy loading
2. **Sincronização carrinho** - Usar localStorage + validação server-side antes de finalizar
3. **Disponibilidade em tempo real** - MVP usa campo booleano, futuro pode integrar estoque
4. **Conflito de URLs** - Validar que slug não existe em ambos módulos
5. **SEO duplicado** - Implementar canonical/alternate corretamente

## PRÓXIMOS GATES

### GATE 1: Fundação (Este PR)
- ✅ Migrations SQL completas
- ✅ Services e tipos
- ✅ Hooks básicos
- ✅ Páginas públicas
- ✅ Componentes essenciais

### GATE 2: Carrinho e Pedido
- Carrinho local com Context
- Cálculo de totais
- Integração WhatsApp
- Validação de área de entrega

### GATE 3: Admin e Gestão
- Dashboard de gestão de cardápio
- Upload de fotos de pratos
- Gestão de promoções
- Relatórios de visualizações

### GATE 4: Otimizações
- Cache agressivo de cardápio
- Imagens otimizadas
- Lazy loading de categorias
- Analytics de itens mais vistos
