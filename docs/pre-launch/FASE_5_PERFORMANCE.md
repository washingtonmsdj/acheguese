# 🚀 FASE 5 — Performance & Caching

> **Data de Início**: 2026-04-19  
> **Status**: ⏳ EM ANDAMENTO  
> **Tempo Estimado**: 4 horas  
> **Prioridade**: ALTA

---

## 📊 RESUMO EXECUTIVO

Fase focada em otimização de performance, caching inteligente e melhoria da experiência do usuário através de carregamento mais rápido e uso eficiente de recursos.

---

## 🎯 OBJETIVOS

### Principais
1. ✅ Lighthouse Score ≥ 90 (mobile e desktop)
2. ✅ Bundle size otimizado (< 500KB inicial)
3. ✅ Tempo de carregamento < 3s (3G)
4. ✅ Cache strategy implementada
5. ✅ Lazy loading em todas as rotas

### Secundários
1. ✅ Imagens otimizadas (WebP/AVIF)
2. ✅ Code splitting por rota
3. ✅ React Query optimizado
4. ✅ Service Worker caching
5. ✅ Database indexes otimizados

---

## 📋 ETAPAS

### Etapa 5.1 — Análise de Performance (1h)

**Objetivo**: Identificar gargalos e oportunidades de otimização

#### 5.1.1 - Lighthouse Audit
- [ ] Rodar Lighthouse em 5 páginas principais:
  - Landing page (/)
  - Dashboard (/dashboard)
  - Business listing (/negocios)
  - Ride request (/mobilidade)
  - Gastronomy (/gastronomia)
- [ ] Documentar scores atuais (Performance, Accessibility, Best Practices, SEO)
- [ ] Identificar top 10 issues

#### 5.1.2 - Bundle Analysis
- [ ] Instalar `vite-plugin-bundle-analyzer`
- [ ] Gerar relatório de bundle
- [ ] Identificar:
  - Maiores dependências
  - Código duplicado
  - Oportunidades de tree-shaking
  - Chunks desnecessários

#### 5.1.3 - Query Performance
- [ ] Analisar queries mais lentas (Supabase Dashboard)
- [ ] Identificar N+1 queries
- [ ] Verificar uso de indexes
- [ ] Documentar queries que precisam otimização

**Entregáveis**:
- `docs/pre-launch/FASE_5_1_ANALISE_PERFORMANCE.md`
- Screenshots de Lighthouse
- Relatório de bundle analysis

---

### Etapa 5.2 — Otimização de Queries (1h)

**Objetivo**: Melhorar performance do banco de dados

#### 5.2.1 - Database Indexes
- [ ] Criar indexes para queries frequentes:
  ```sql
  -- Businesses
  CREATE INDEX idx_businesses_location ON businesses(location_id);
  CREATE INDEX idx_businesses_category ON businesses(category_id);
  CREATE INDEX idx_businesses_status ON businesses(status) WHERE status = 'active';
  
  -- Ride Requests
  CREATE INDEX idx_ride_requests_user ON ride_requests(user_id);
  CREATE INDEX idx_ride_requests_status ON ride_requests(status);
  CREATE INDEX idx_ride_requests_created ON ride_requests(created_at DESC);
  
  -- Notifications
  CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
  
  -- Gastronomy
  CREATE INDEX idx_gastronomy_subscriptions_user ON gastronomy_subscriptions(user_id);
  CREATE INDEX idx_gastronomy_subscriptions_status ON gastronomy_subscriptions(status);
  ```

#### 5.2.2 - React Query Optimization
- [ ] Configurar `staleTime` e `gcTime` por tipo de query:
  ```typescript
  // Static data (categories, locations)
  staleTime: 1000 * 60 * 60 * 24, // 24 hours
  gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
  
  // User data (profile, subscriptions)
  staleTime: 1000 * 60 * 5, // 5 minutes
  gcTime: 1000 * 60 * 30, // 30 minutes
  
  // Real-time data (notifications, messages)
  staleTime: 0, // Always fresh
  gcTime: 1000 * 60 * 5, // 5 minutes
  ```

- [ ] Implementar prefetching em rotas principais
- [ ] Adicionar `keepPreviousData` em listas paginadas
- [ ] Implementar optimistic updates em mutations

#### 5.2.3 - Query Consolidation
- [ ] Identificar queries que podem ser combinadas
- [ ] Usar `select` para buscar apenas campos necessários
- [ ] Implementar pagination em todas as listas

**Entregáveis**:
- Migration com indexes
- Arquivo de configuração React Query
- `docs/pre-launch/FASE_5_2_QUERIES_OTIMIZADAS.md`

---

### Etapa 5.3 — Implementar Caching (1.5h)

**Objetivo**: Reduzir chamadas ao servidor e melhorar tempo de resposta

#### 5.3.1 - Service Worker Caching
- [ ] Atualizar `public/sw.js` com estratégias de cache:
  ```javascript
  // Cache-First: Static assets
  - JS, CSS, fonts, icons
  
  // Network-First: API calls
  - Supabase functions
  - Auth endpoints
  
  // Stale-While-Revalidate: Images
  - Avatars, business photos
  
  // Cache-Only: App shell
  - index.html, manifest.json
  ```

- [ ] Implementar cache versioning
- [ ] Adicionar cleanup de cache antigo
- [ ] Configurar cache size limits

#### 5.3.2 - API Response Caching
- [ ] Implementar cache em edge functions:
  ```typescript
  // nominatim-proxy: 30 dias
  // get-push-config: 1 hora
  // billing-plans: 24 horas
  ```

- [ ] Criar tabela `api_cache`:
  ```sql
  CREATE TABLE api_cache (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  
  CREATE INDEX idx_api_cache_expires ON api_cache(expires_at);
  ```

- [ ] Implementar cleanup automático de cache expirado

#### 5.3.3 - Browser Caching
- [ ] Configurar headers de cache no Vercel:
  ```json
  {
    "headers": [
      {
        "source": "/assets/(.*)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "/(.*).(?:jpg|jpeg|png|gif|svg|webp|avif)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=86400, stale-while-revalidate=604800"
          }
        ]
      }
    ]
  }
  ```

**Entregáveis**:
- `public/sw.js` atualizado
- Migration para `api_cache`
- `vercel.json` com headers
- `docs/pre-launch/FASE_5_3_CACHING_IMPLEMENTADO.md`

---

### Etapa 5.4 — CDN & Assets (0.5h)

**Objetivo**: Otimizar entrega de assets estáticos

#### 5.4.1 - Image Optimization
- [ ] Converter imagens para WebP/AVIF
- [ ] Adicionar `loading="lazy"` em todas as imagens
- [ ] Implementar responsive images:
  ```tsx
  <img
    src="/image.webp"
    srcSet="/image-320w.webp 320w, /image-640w.webp 640w, /image-1280w.webp 1280w"
    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
    loading="lazy"
    alt="Description"
  />
  ```

- [ ] Configurar Supabase Storage para servir imagens otimizadas

#### 5.4.2 - Code Splitting
- [ ] Implementar `React.lazy` em todas as páginas:
  ```typescript
  const DashboardPage = lazy(() => import('./pages/DashboardPage'));
  const BusinessPage = lazy(() => import('./pages/BusinessPage'));
  // ... todas as páginas
  ```

- [ ] Adicionar `Suspense` com loading states
- [ ] Configurar chunk splitting no Vite:
  ```typescript
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-*'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-supabase': ['@supabase/supabase-js'],
        }
      }
    }
  }
  ```

#### 5.4.3 - Font Optimization
- [ ] Usar `font-display: swap` em todas as fontes
- [ ] Preload fontes críticas:
  ```html
  <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
  ```

- [ ] Subset de fontes (apenas caracteres usados)

**Entregáveis**:
- Imagens otimizadas
- `vite.config.ts` atualizado
- Lazy loading implementado
- `docs/pre-launch/FASE_5_4_ASSETS_OTIMIZADOS.md`

---

## 📊 MÉTRICAS DE SUCESSO

### Performance
- [ ] Lighthouse Performance Score ≥ 90 (mobile)
- [ ] Lighthouse Performance Score ≥ 95 (desktop)
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.5s
- [ ] Cumulative Layout Shift < 0.1

### Bundle
- [ ] Initial bundle < 500KB (gzipped)
- [ ] Largest chunk < 200KB
- [ ] Total bundle < 2MB
- [ ] Reduction de 30% no bundle size

### Caching
- [ ] Cache hit rate > 80% (static assets)
- [ ] Cache hit rate > 50% (API responses)
- [ ] Repeat visit load time < 1s

### Database
- [ ] Queries < 100ms (p95)
- [ ] Queries < 50ms (p50)
- [ ] Zero N+1 queries
- [ ] All frequent queries indexed

---

## 🔧 FERRAMENTAS

### Análise
- Lighthouse (Chrome DevTools)
- WebPageTest
- Bundle Analyzer (Vite plugin)
- React DevTools Profiler
- Supabase Dashboard (Query Performance)

### Otimização
- Sharp (image optimization)
- Vite (build optimization)
- React.lazy (code splitting)
- React Query (data caching)
- Service Worker (asset caching)

### Monitoramento
- Vercel Analytics
- Web Vitals
- Sentry Performance
- Supabase Logs

---

## 📚 ARQUIVOS A CRIAR/MODIFICAR

### Criar
1. `supabase/migrations/20260419000001_create_performance_indexes.sql`
2. `supabase/migrations/20260419000002_create_api_cache.sql`
3. `src/config/reactQuery.config.ts`
4. `src/utils/imageOptimization.ts`
5. `docs/pre-launch/FASE_5_1_ANALISE_PERFORMANCE.md`
6. `docs/pre-launch/FASE_5_2_QUERIES_OTIMIZADAS.md`
7. `docs/pre-launch/FASE_5_3_CACHING_IMPLEMENTADO.md`
8. `docs/pre-launch/FASE_5_4_ASSETS_OTIMIZADOS.md`
9. `docs/pre-launch/FASE_5_COMPLETA.md`

### Modificar
1. `public/sw.js` - Adicionar estratégias de cache
2. `vite.config.ts` - Code splitting e otimizações
3. `vercel.json` - Headers de cache
4. `src/App.tsx` - Lazy loading de rotas
5. `src/main.tsx` - React Query config
6. Edge functions - Adicionar caching

---

## ⚠️ RISCOS E MITIGAÇÕES

### Risco 1: Cache invalidation complexa
**Mitigação**: Usar versioning de cache e TTLs conservadores

### Risco 2: Code splitting quebrar funcionalidades
**Mitigação**: Testar todas as rotas após implementação

### Risco 3: Indexes impactarem write performance
**Mitigação**: Monitorar performance de INSERT/UPDATE após criar indexes

### Risco 4: Service Worker causar bugs em dev
**Mitigação**: Desabilitar SW em desenvolvimento

---

## 🎯 PRÓXIMOS PASSOS APÓS FASE 5

### Fase 6 - Monitoring & Observability (3-5 dias)
- Sentry integration
- Custom metrics
- Error tracking
- Performance monitoring
- User analytics

### Fase 7 - Pré-Produção (3 dias)
- Security headers
- SEO optimization
- Backup strategy
- Disaster recovery
- Smoke tests

---

## ✅ CHECKLIST DE CONCLUSÃO

### Análise
- [ ] Lighthouse audit completo
- [ ] Bundle analysis feito
- [ ] Query performance analisado
- [ ] Gargalos identificados

### Otimização
- [ ] Indexes criados
- [ ] React Query configurado
- [ ] Queries consolidadas
- [ ] Pagination implementada

### Caching
- [ ] Service Worker atualizado
- [ ] API cache implementado
- [ ] Browser cache configurado
- [ ] Cache cleanup automático

### Assets
- [ ] Imagens otimizadas
- [ ] Code splitting implementado
- [ ] Fonts otimizadas
- [ ] Lazy loading em todas rotas

### Validação
- [ ] Lighthouse ≥ 90 (mobile)
- [ ] Bundle < 500KB
- [ ] Cache hit rate > 80%
- [ ] Queries < 100ms (p95)

---

**Status**: ⏳ INICIANDO  
**Próxima Etapa**: 5.1 - Análise de Performance  
**ETA**: 4 horas  
**Progresso Geral**: 70% → 80%

---

*Documentado por: Kiro AI*  
*Data: 2026-04-19*  
*Fase: Pré-Lançamento - Performance & Caching*
