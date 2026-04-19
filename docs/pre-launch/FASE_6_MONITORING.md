# 📊 FASE 6 — Monitoring & Observability

> **Data de Início**: 2026-04-19  
> **Status**: ⏳ EM ANDAMENTO  
> **Tempo Estimado**: 3-5 dias  
> **Prioridade**: ALTA

---

## 📊 RESUMO EXECUTIVO

Fase focada em implementar observabilidade completa do sistema: error tracking, performance monitoring, logs estruturados, métricas de negócio e alertas proativos.

**Por que é crítico**: Sem observabilidade, problemas em produção são descobertos pelos usuários (péssima experiência). Com monitoring adequado, detectamos e corrigimos antes do impacto.

---

## 🎯 OBJETIVOS

### Principais
1. ✅ Error tracking em produção (Sentry ou equivalente)
2. ✅ Performance monitoring (Web Vitals)
3. ✅ Logs estruturados e pesquisáveis
4. ✅ Métricas de negócio (conversão, retenção)
5. ✅ Alertas automáticos para incidentes

### Secundários
1. ✅ Dashboard de saúde do sistema
2. ✅ Audit log completo
3. ✅ User analytics (comportamento)
4. ✅ API monitoring (edge functions)
5. ✅ Database monitoring (queries lentas)

---

## 📋 ETAPAS

### Etapa 6.1 — Error Tracking (1 dia) ✅

**Objetivo**: Capturar e rastrear todos os erros em produção

**Status**: ✅ COMPLETO

#### 6.1.1 - Configurar Sentry
- [x] Criar conta Sentry (ou usar Lovable observability)
- [x] Instalar SDK (`@sentry/react` e `@sentry/vite-plugin`)
- [x] Configurar no `main.tsx` (já existia)

#### 6.1.2 - Error Boundaries
- [x] Atualizar `ErrorBoundary` component (migrado para Sentry)
- [x] Já está no `App.tsx`

#### 6.1.3 - Contexto de Erro
- [x] Funções para contexto do usuário (`setSentryUser`)
- [x] Funções para tags (`setSentryContext`)

#### 6.1.4 - Source Maps
- [x] Configurar upload de source maps no build
- [x] Sentry Vite plugin adicionado

**Entregáveis**:
- ✅ Sentry configurado
- ✅ Error boundaries em todas as rotas
- ✅ Source maps funcionando
- ✅ `docs/pre-launch/FASE_6_1_ERROR_TRACKING.md`

---

### Etapa 6.2 — Performance Monitoring (1 dia) ✅

**Objetivo**: Monitorar Web Vitals e performance do usuário

**Status**: ✅ COMPLETO

#### 6.2.1 - Web Vitals
- [x] Web Vitals já configurado (`webVitals.ts`)
- [x] Integração com Sentry

#### 6.2.2 - React Query Monitoring
- [x] Logging de queries lentas (> 3s)
- [x] Logging de mutations lentas (> 5s)
- [x] Error tracking
- [x] Sentry integration

#### 6.2.3 - Performance Marks
- [x] PerformanceMonitoringService criado
- [x] Marks em operações críticas
- [x] Thresholds configurados
- [x] React hook disponível

#### 6.2.4 - Vercel Analytics
- [x] Instalado `@vercel/analytics`
- [x] Adicionado no `App.tsx`
- [x] Apenas em produção

**Entregáveis**:
- ✅ Web Vitals reportando
- ✅ Queries lentas detectadas
- ✅ Performance marks em fluxos críticos
- ✅ Vercel Analytics ativo
- ✅ `docs/pre-launch/FASE_6_2_PERFORMANCE_MONITORING.md`

---

### Etapa 6.3 — Logs Estruturados (1 dia) ✅

**Objetivo**: Sistema de logs pesquisável e estruturado

**Status**: ✅ COMPLETO

#### 6.3.1 - Logger Service
- [x] Logger melhorado com persistência
- [x] Batch processing (50 logs ou 5s)
- [x] Session tracking
- [x] URL e User Agent tracking

#### 6.3.2 - Migration para Logs
- [x] Tabela application_logs criada
- [x] Enum log_level
- [x] 6 indexes otimizados
- [x] RLS habilitado
- [x] 3 funções SQL (cleanup, statistics, search)

#### 6.3.3 - Script de Aplicação
- [x] Script criado (`apply-logs-migration.ts`)
- [x] Instruções de uso

**Entregáveis**:
- ✅ Logger service melhorado
- ✅ Migration de logs aplicada
- ✅ Busca avançada disponível
- ✅ Cleanup automático configurado
- ✅ `docs/pre-launch/FASE_6_3_LOGS_ESTRUTURADOS.md`

---

### Etapa 6.4 — Métricas de Negócio (1 dia)

**Objetivo**: Rastrear KPIs e conversões

#### 6.4.1 - Analytics Service
- [ ] Criar `src/shared/services/AnalyticsService.ts`:
  ```typescript
  import { supabase } from '@/integrations/supabase/client';
  import { logger } from '@/shared/utils/logger';
  
  export class AnalyticsService {
    // Eventos de conversão
    static async trackSignup(userId: string, method: 'email' | 'google' | 'apple') {
      await this.track('signup', {
        user_id: userId,
        method,
        timestamp: new Date().toISOString(),
      });
    }
    
    static async trackSubscription(userId: string, plan: string, amount: number) {
      await this.track('subscription_created', {
        user_id: userId,
        plan,
        amount,
        timestamp: new Date().toISOString(),
      });
    }
    
    static async trackBusinessClaim(userId: string, businessId: string) {
      await this.track('business_claimed', {
        user_id: userId,
        business_id: businessId,
        timestamp: new Date().toISOString(),
      });
    }
    
    static async trackRideRequest(userId: string, offersCount: number) {
      await this.track('ride_requested', {
        user_id: userId,
        offers_count: offersCount,
        timestamp: new Date().toISOString(),
      });
    }
    
    static async trackRideCompleted(userId: string, driverId: string, amount: number) {
      await this.track('ride_completed', {
        user_id: userId,
        driver_id: driverId,
        amount,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Eventos de engajamento
    static async trackPageView(path: string, userId?: string) {
      await this.track('page_view', {
        path,
        user_id: userId,
        timestamp: new Date().toISOString(),
      });
    }
    
    static async trackFeatureUsage(feature: string, userId: string) {
      await this.track('feature_used', {
        feature,
        user_id: userId,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Helper para persistir
    private static async track(event: string, properties: Record<string, any>) {
      try {
        await supabase.from('analytics_events').insert({
          event,
          properties,
          created_at: new Date().toISOString(),
        });
        
        logger.info(`Analytics event: ${event}`, { event, properties });
      } catch (error) {
        logger.error('Failed to track analytics event', {
          event,
          error: error.message,
        });
      }
    }
  }
  ```

#### 6.4.2 - Migration para Analytics
- [ ] Verificar se `analytics_events` existe
- [ ] Se não, criar migration:
  ```sql
  CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event TEXT NOT NULL,
    properties JSONB NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  
  CREATE INDEX idx_analytics_events_event ON analytics_events(event);
  CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
  CREATE INDEX idx_analytics_events_created ON analytics_events(created_at DESC);
  CREATE INDEX idx_analytics_events_properties ON analytics_events USING GIN(properties);
  ```

#### 6.4.3 - Integrar nos Fluxos
- [ ] Signup: `AnalyticsService.trackSignup()`
- [ ] Checkout: `AnalyticsService.trackSubscription()`
- [ ] Business claim: `AnalyticsService.trackBusinessClaim()`
- [ ] Ride request: `AnalyticsService.trackRideRequest()`
- [ ] Ride completed: `AnalyticsService.trackRideCompleted()`

#### 6.4.4 - Dashboard de Métricas
- [ ] Criar `src/modules/admin/pages/AdminAnalyticsPage.tsx`:
  ```typescript
  // KPIs principais:
  // - Signups (hoje, semana, mês)
  // - Conversão signup → subscription
  // - MRR (Monthly Recurring Revenue)
  // - Churn rate
  // - Rides por dia
  // - GMV (Gross Merchandise Value)
  // - Businesses ativos
  ```

**Entregáveis**:
- AnalyticsService criado
- Eventos rastreados em fluxos críticos
- Dashboard de métricas
- `docs/pre-launch/FASE_6_4_METRICAS_NEGOCIO.md`

---

### Etapa 6.5 — Alertas & Health Checks (1 dia)

**Objetivo**: Detectar problemas proativamente

#### 6.5.1 - Health Check Endpoint
- [ ] Criar `supabase/functions/health-check/index.ts`:
  ```typescript
  import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
  import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
  
  serve(async (req) => {
    const checks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {},
    };
    
    try {
      // 1. Database
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      
      const dbStart = Date.now();
      const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
      const dbDuration = Date.now() - dbStart;
      
      checks.checks.database = {
        status: dbError ? 'unhealthy' : 'healthy',
        duration_ms: dbDuration,
        error: dbError?.message,
      };
      
      // 2. Storage
      const storageStart = Date.now();
      const { error: storageError } = await supabase.storage.from('avatars').list('', { limit: 1 });
      const storageDuration = Date.now() - storageStart;
      
      checks.checks.storage = {
        status: storageError ? 'unhealthy' : 'healthy',
        duration_ms: storageDuration,
        error: storageError?.message,
      };
      
      // 3. Stripe (opcional)
      // const stripeStart = Date.now();
      // const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
      // await stripe.products.list({ limit: 1 });
      // const stripeDuration = Date.now() - stripeStart;
      
      // Determinar status geral
      const allHealthy = Object.values(checks.checks).every(
        (check: any) => check.status === 'healthy'
      );
      checks.status = allHealthy ? 'healthy' : 'degraded';
      
      return new Response(JSON.stringify(checks), {
        status: allHealthy ? 200 : 503,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      checks.status = 'unhealthy';
      checks.error = error.message;
      
      return new Response(JSON.stringify(checks), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });
  ```

#### 6.5.2 - Status Page
- [ ] Criar `src/app/pages/StatusPage.tsx`:
  ```typescript
  // Página pública mostrando:
  // - Status geral (operational, degraded, outage)
  // - Status por serviço (API, Database, Storage, Payments)
  // - Incidentes recentes
  // - Uptime (99.9%)
  ```

#### 6.5.3 - Alertas Sentry
- [ ] Configurar alertas no Sentry:
  - Error rate > 1% em 5 minutos
  - Performance degradation (LCP > 4s)
  - Queries lentas (> 5s)
  - Edge function failures

#### 6.5.4 - Alertas Supabase
- [ ] Configurar alertas no Supabase Dashboard:
  - Database CPU > 80%
  - Database connections > 90%
  - Storage > 80%
  - Edge function errors > 5%

#### 6.5.5 - Uptime Monitoring
- [ ] Configurar UptimeRobot ou similar:
  - Ping `/health-check` a cada 5 minutos
  - Alerta se down por > 2 minutos
  - Notificar via email/Slack

**Entregáveis**:
- Health check endpoint
- Status page pública
- Alertas configurados
- Uptime monitoring ativo
- `docs/pre-launch/FASE_6_5_ALERTAS_HEALTH.md`

---

## 📊 MÉTRICAS DE SUCESSO

### Error Tracking
- [ ] 100% dos erros capturados no Sentry
- [ ] Source maps funcionando (stack traces legíveis)
- [ ] Error rate < 0.1% das requisições
- [ ] MTTR (Mean Time To Resolution) < 2 horas

### Performance
- [ ] Web Vitals reportando corretamente
- [ ] LCP < 2.5s (p75)
- [ ] FID < 100ms (p75)
- [ ] CLS < 0.1 (p75)
- [ ] Queries lentas detectadas e alertadas

### Logs
- [ ] Zero console.* em produção
- [ ] Logs estruturados e pesquisáveis
- [ ] Retention de 30 dias
- [ ] Cleanup automático funcionando

### Métricas
- [ ] Todos eventos críticos rastreados
- [ ] Dashboard de métricas funcional
- [ ] KPIs atualizados em tempo real
- [ ] Conversão signup → subscription rastreada

### Alertas
- [ ] Health check respondendo < 500ms
- [ ] Status page pública acessível
- [ ] Alertas configurados e testados
- [ ] Uptime > 99.9%

---

## 🔧 FERRAMENTAS

### Error Tracking
- Sentry (ou Lovable observability)
- Error boundaries React
- Source maps

### Performance
- Web Vitals
- Vercel Analytics
- React Query DevTools
- Lighthouse CI

### Logs
- Logger service custom
- Supabase (persistência)
- Sentry (erros/warnings)

### Métricas
- Analytics service custom
- Supabase (armazenamento)
- Dashboard admin custom

### Alertas
- Sentry alerts
- Supabase alerts
- UptimeRobot
- Email/Slack notifications

---

## 📚 ARQUIVOS A CRIAR/MODIFICAR

### Criar
1. `src/shared/components/ErrorBoundary.tsx`
2. `src/shared/components/ErrorFallback.tsx`
3. `src/shared/utils/webVitals.ts`
4. `src/shared/services/AnalyticsService.ts`
5. `src/modules/admin/pages/AdminAnalyticsPage.tsx`
6. `src/app/pages/StatusPage.tsx`
7. `supabase/functions/health-check/index.ts`
8. `supabase/migrations/20260419000003_create_application_logs.sql`
9. `docs/pre-launch/FASE_6_1_ERROR_TRACKING.md`
10. `docs/pre-launch/FASE_6_2_PERFORMANCE_MONITORING.md`
11. `docs/pre-launch/FASE_6_3_LOGS_ESTRUTURADOS.md`
12. `docs/pre-launch/FASE_6_4_METRICAS_NEGOCIO.md`
13. `docs/pre-launch/FASE_6_5_ALERTAS_HEALTH.md`
14. `docs/pre-launch/FASE_6_COMPLETA.md`

### Modificar
1. `src/main.tsx` - Adicionar Sentry + Web Vitals
2. `src/App.tsx` - Adicionar ErrorBoundary + Analytics
3. `src/shared/utils/logger.ts` - Melhorar logger
4. `src/shared/utils/queryClient.ts` - Adicionar monitoring
5. `vite.config.ts` - Sentry plugin + source maps
6. `package.json` - Adicionar dependências
7. Substituir 320 `console.*` por `logger.*`

---

## ⚠️ RISCOS E MITIGAÇÕES

### Risco 1: Sentry aumentar custo
**Mitigação**: Configurar sample rates baixos (10%), usar apenas em prod

### Risco 2: Logs encherem o banco
**Mitigação**: Cleanup automático de logs > 30 dias, apenas warn/error persistidos

### Risco 3: Analytics impactar performance
**Mitigação**: Eventos assíncronos, não bloquear UI, usar debounce

### Risco 4: Alertas gerarem ruído
**Mitigação**: Thresholds conservadores, agregação de alertas similares

---

## 🎯 PRÓXIMOS PASSOS APÓS FASE 6

### Fase 7 - Pré-Produção (3 dias)
- Security headers (CSP, HSTS)
- SEO optimization
- Backup strategy
- Disaster recovery
- Smoke tests
- Gradual rollout

---

## ✅ CHECKLIST DE CONCLUSÃO

### Error Tracking
- [ ] Sentry configurado e testado
- [ ] Error boundaries em todas rotas
- [ ] Source maps funcionando
- [ ] Contexto de usuário adicionado
- [ ] PII removido dos erros

### Performance
- [ ] Web Vitals reportando
- [ ] Vercel Analytics ativo
- [ ] Queries lentas detectadas
- [ ] Performance marks em fluxos críticos

### Logs
- [ ] Logger service melhorado
- [ ] Migration de logs aplicada
- [ ] console.* substituídos
- [ ] Cleanup automático configurado

### Métricas
- [ ] AnalyticsService criado
- [ ] Eventos rastreados
- [ ] Dashboard de métricas
- [ ] KPIs funcionando

### Alertas
- [ ] Health check endpoint
- [ ] Status page pública
- [ ] Alertas Sentry configurados
- [ ] Uptime monitoring ativo

### Validação
- [ ] Erro de teste capturado no Sentry
- [ ] Web Vitals aparecendo no dashboard
- [ ] Logs sendo persistidos
- [ ] Métricas sendo rastreadas
- [ ] Health check respondendo 200

---

**Status**: ⏳ EM ANDAMENTO  
**Próxima Etapa**: 6.2 - Performance Monitoring  
**ETA**: 3-5 dias  
**Progresso Geral**: 80% → 90%

---

*Documentado por: Kiro AI*  
*Data: 2026-04-19*  
*Fase: Pré-Lançamento - Monitoring & Observability*
