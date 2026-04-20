# ⚡ FASE 6.2 — Performance Monitoring (COMPLETA)

> **Data**: 2026-04-19  
> **Status**: ✅ 100% COMPLETO  
> **Tempo**: 1 hora

---

## 📊 RESUMO EXECUTIVO

Sistema completo de performance monitoring implementado com React Query monitoring, Performance API, Vercel Analytics e alertas automáticos para operações lentas.

---

## ✅ O QUE FOI IMPLEMENTADO

### 1. React Query Monitoring ✅

**Arquivo**: `src/config/reactQuery.config.ts`

**Features Adicionadas**:
- ✅ **Query Performance Tracking** - Detecta queries > 3s
- ✅ **Mutation Performance Tracking** - Detecta mutations > 5s
- ✅ **Error Tracking** - Captura erros de queries e mutations
- ✅ **Sentry Integration** - Envia alertas para Sentry
- ✅ **Breadcrumbs** - Adiciona contexto de performance
- ✅ **Data Size Tracking** - Monitora tamanho dos dados

**Implementação**:
```typescript
queries: {
  // ... configurações existentes
  
  onError: (error: any) => {
    // Log error para Sentry
    if (import.meta.env.PROD) {
      captureSentryMessage(
        `Query error: ${error?.message || 'Unknown error'}`,
        'error',
        { error: error?.message, status: error?.status }
      );
    }
  },
  
  onSuccess: (data: any, query: any) => {
    const duration = Date.now() - query.state?.dataUpdatedAt;
    
    // Alert on slow queries (> 3s)
    if (duration > 3000) {
      captureSentryMessage(
        `Slow query detected: ${JSON.stringify(queryKey)}`,
        'warning',
        { queryKey, duration, dataSize: JSON.stringify(data).length }
      );
    }
  },
}
```

**Thresholds**:
- ⚠️ **Queries lentas**: > 3 segundos
- ⚠️ **Mutations lentas**: > 5 segundos
- 📊 **Breadcrumbs**: Queries > 1s, Mutations > 2s

---

### 2. Performance Monitoring Service ✅

**Arquivo**: `src/shared/services/PerformanceMonitoringService.ts`

**Features**:
- ✅ **Performance Marks** - Marca início/fim de operações
- ✅ **Performance Measures** - Calcula duração
- ✅ **Threshold Alerts** - Alerta operações lentas
- ✅ **Sentry Integration** - Reporta para Sentry
- ✅ **Page Metrics** - Métricas de navegação
- ✅ **React Hook** - `usePerformanceMonitoring`

**Operações Monitoradas**:
```typescript
type PerformanceOperation =
  | 'checkout'        // Threshold: 5s
  | 'dispatch'        // Threshold: 3s
  | 'signup'          // Threshold: 3s
  | 'login'           // Threshold: 2s
  | 'business-claim'  // Threshold: 3s
  | 'ride-request'    // Threshold: 2s
  | 'ride-accept'     // Threshold: 2s
  | 'payment'         // Threshold: 5s
  | 'subscription'    // Threshold: 5s
  | 'upload'          // Threshold: 10s
  | 'search'          // Threshold: 1s
  | 'navigation'      // Threshold: 1s
```

**Uso**:
```typescript
// Método 1: Manual
PerformanceMonitoringService.start('checkout', { userId: '123' });
// ... operação
PerformanceMonitoringService.end('checkout', { success: true });

// Método 2: Wrapper
await PerformanceMonitoringService.measure(
  'checkout',
  async () => {
    // ... operação
    return result;
  },
  { userId: '123' }
);

// Método 3: Hook (React)
const { start, end, measure } = usePerformanceMonitoring('checkout');

useEffect(() => {
  start();
  // ... operação
  return () => end();
}, []);
```

**Page Metrics**:
```typescript
// Obter métricas da página
const metrics = PerformanceMonitoringService.getPageMetrics();
// {
//   dns: 50,
//   tcp: 100,
//   ttfb: 300,
//   download: 200,
//   domInteractive: 800,
//   domComplete: 1200,
//   loadComplete: 1500,
//   transferSize: 500000,
//   encodedBodySize: 450000,
//   decodedBodySize: 500000,
// }

// Reportar para Sentry
PerformanceMonitoringService.reportPageMetrics('HomePage');
```

---

### 3. Vercel Analytics ✅

**Instalado**: `@vercel/analytics`

**Integração**: `src/App.tsx`

```typescript
import { Analytics } from "@vercel/analytics/react";

const App = () => (
  <ErrorBoundary>
    {/* ... resto do app */}
    {import.meta.env.PROD && <Analytics />}
  </ErrorBoundary>
);
```

**Métricas Capturadas**:
- ✅ **Page Views** - Visualizações de página
- ✅ **Web Vitals** - LCP, FID, CLS, FCP, TTFB
- ✅ **User Flow** - Navegação do usuário
- ✅ **Conversions** - Eventos customizados
- ✅ **Geographic Data** - Localização dos usuários
- ✅ **Device Data** - Dispositivos e navegadores

**Dashboard**:
- Acesse: [vercel.com/analytics](https://vercel.com/analytics)
- Métricas em tempo real
- Comparação com período anterior
- Filtros por página, país, dispositivo

---

### 4. Environment Variables ✅

**Arquivo**: `.env.example`

**Adicionado**:
```bash
# Debug flags
VITE_DEBUG_PERFORMANCE="false"  # Logs de performance em desenvolvimento
```

**Uso**:
```typescript
// Habilitar logs de performance em dev
if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_PERFORMANCE === 'true') {
  logger.info('[Performance] Operation completed', { duration });
}
```

---

## 🎯 COMO USAR

### 1. Monitorar Operação Crítica

**Exemplo: Checkout**
```typescript
import { PerformanceMonitoringService } from '@/shared/services/PerformanceMonitoringService';

async function handleCheckout() {
  await PerformanceMonitoringService.measure(
    'checkout',
    async () => {
      // 1. Criar sessão Stripe
      const session = await createCheckoutSession();
      
      // 2. Redirecionar
      window.location.href = session.url;
    },
    {
      userId: user.id,
      plan: selectedPlan,
    }
  );
}
```

**Exemplo: Dispatch de Corrida**
```typescript
async function handleDispatch(rideRequestId: string) {
  PerformanceMonitoringService.start('dispatch', { rideRequestId });
  
  try {
    const result = await dispatchRide(rideRequestId);
    PerformanceMonitoringService.end('dispatch', { 
      success: true,
      offersFound: result.offers.length 
    });
  } catch (error) {
    PerformanceMonitoringService.end('dispatch', { 
      success: false,
      error: error.message 
    });
    throw error;
  }
}
```

### 2. Monitorar Navegação

**Exemplo: Router**
```typescript
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PerformanceMonitoringService } from '@/shared/services/PerformanceMonitoringService';

function NavigationMonitor() {
  const location = useLocation();
  const previousLocation = useRef<string>('/');
  
  useEffect(() => {
    PerformanceMonitoringService.measureNavigation(
      previousLocation.current,
      location.pathname
    );
    
    previousLocation.current = location.pathname;
  }, [location]);
  
  return null;
}
```

### 3. Monitorar Queries Lentas

**Automático** - Já configurado no React Query:
```typescript
// Queries > 3s são automaticamente reportadas
const { data } = useQuery({
  queryKey: ['businesses', 'list'],
  queryFn: fetchBusinesses,
});

// Se demorar > 3s, será enviado para Sentry:
// "Slow query detected: ['businesses', 'list']"
```

### 4. Debug em Desenvolvimento

**Habilitar logs**:
```bash
# .env.local
VITE_DEBUG_PERFORMANCE="true"
```

**Console output**:
```
[Performance] Started: checkout { userId: '123' }
[Performance] Completed: checkout (4523ms) { userId: '123', success: true }
```

---

## 📊 MÉTRICAS MONITORADAS

### React Query
- ✅ **Query Duration** - Tempo de execução
- ✅ **Query Errors** - Erros em queries
- ✅ **Mutation Duration** - Tempo de mutations
- ✅ **Mutation Errors** - Erros em mutations
- ✅ **Data Size** - Tamanho dos dados retornados
- ✅ **Cache Hits** - Uso de cache

### Performance API
- ✅ **Operation Duration** - Tempo de operações críticas
- ✅ **DNS Lookup** - Tempo de resolução DNS
- ✅ **TCP Connection** - Tempo de conexão
- ✅ **TTFB** - Time to First Byte
- ✅ **Download Time** - Tempo de download
- ✅ **DOM Interactive** - Tempo até DOM interativo
- ✅ **DOM Complete** - Tempo até DOM completo
- ✅ **Load Complete** - Tempo de carregamento total

### Vercel Analytics
- ✅ **Page Views** - Visualizações
- ✅ **Unique Visitors** - Visitantes únicos
- ✅ **Bounce Rate** - Taxa de rejeição
- ✅ **Session Duration** - Duração da sessão
- ✅ **Web Vitals** - LCP, FID, CLS, FCP, TTFB
- ✅ **Geographic Data** - País, cidade
- ✅ **Device Data** - Desktop, mobile, tablet
- ✅ **Browser Data** - Chrome, Safari, Firefox

---

## 🚨 ALERTAS CONFIGURADOS

### Queries Lentas
- **Threshold**: > 3 segundos
- **Ação**: Sentry warning message
- **Contexto**: Query key, duration, data size

### Mutations Lentas
- **Threshold**: > 5 segundos
- **Ação**: Sentry warning message
- **Contexto**: Mutation key, duration

### Operações Críticas Lentas
- **Thresholds**: Varia por operação (1s - 10s)
- **Ação**: Sentry warning message
- **Contexto**: Operation, duration, threshold, metadata

### TTFB Lento
- **Threshold**: > 800ms
- **Ação**: Sentry warning message
- **Contexto**: Page name, TTFB, outros page metrics

---

## 📈 DASHBOARD SENTRY

### Performance Issues
- **Slow Queries** - Queries > 3s
- **Slow Mutations** - Mutations > 5s
- **Slow Operations** - Operações críticas lentas
- **Slow TTFB** - Páginas com TTFB > 800ms

### Breadcrumbs
- **Query Completed** - Queries > 1s
- **Mutation Completed** - Mutations > 2s
- **Operation** - Operações críticas
- **Page Metrics** - Métricas de navegação

### Filtros
- Por operação (checkout, dispatch, etc)
- Por página
- Por usuário
- Por duração
- Por período

---

## 📈 DASHBOARD VERCEL

### Overview
- **Total Page Views** - Visualizações totais
- **Unique Visitors** - Visitantes únicos
- **Top Pages** - Páginas mais visitadas
- **Top Referrers** - Principais referências

### Web Vitals
- **LCP** - Largest Contentful Paint
- **FID** - First Input Delay
- **CLS** - Cumulative Layout Shift
- **FCP** - First Contentful Paint
- **TTFB** - Time to First Byte

### Audience
- **Countries** - Países
- **Cities** - Cidades
- **Devices** - Dispositivos
- **Browsers** - Navegadores
- **Operating Systems** - Sistemas operacionais

---

## 🔧 TROUBLESHOOTING

### Erro: "Performance marks não estão funcionando"

**Verificar**:
1. Performance API está disponível? (todos navegadores modernos)
2. Está chamando `start()` antes de `end()`?
3. Está usando o mesmo nome de operação?

**Solução**:
```typescript
// Verificar suporte
if ('performance' in window && 'mark' in performance) {
  PerformanceMonitoringService.start('operation');
}
```

### Erro: "Queries lentas não estão sendo reportadas"

**Verificar**:
1. Está em produção? (alertas desabilitados em dev)
2. Query realmente demorou > 3s?
3. Sentry está configurado?

**Solução**:
```typescript
// Forçar em desenvolvimento
if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_PERFORMANCE === 'true') {
  logger.warn('Slow query', { queryKey, duration });
}
```

### Erro: "Vercel Analytics não aparece"

**Verificar**:
1. Está em produção? (`import.meta.env.PROD`)
2. Deploy foi feito no Vercel?
3. Analytics está habilitado no projeto?

**Solução**:
1. Acesse Vercel Dashboard
2. Vá em Settings > Analytics
3. Habilite Analytics
4. Redeploy

---

## ✅ CHECKLIST DE CONCLUSÃO

### React Query Monitoring
- [x] Query performance tracking
- [x] Mutation performance tracking
- [x] Error tracking
- [x] Sentry integration
- [x] Breadcrumbs
- [x] Thresholds configurados

### Performance Monitoring Service
- [x] Performance marks/measures
- [x] Threshold alerts
- [x] Sentry integration
- [x] Page metrics
- [x] Navigation tracking
- [x] React hook

### Vercel Analytics
- [x] Instalado
- [x] Integrado no App.tsx
- [x] Apenas em produção
- [x] Dashboard acessível

### Environment Variables
- [x] VITE_DEBUG_PERFORMANCE documentado
- [x] Debug logs implementados

### Documentação
- [x] Guia de uso
- [x] Exemplos de código
- [x] Troubleshooting
- [x] Métricas documentadas

---

## 💡 PRINCIPAIS CONQUISTAS

### 1. React Query Monitoring ⭐⭐⭐⭐⭐
Detecção automática de queries e mutations lentas

### 2. Performance Monitoring Service ⭐⭐⭐⭐⭐
Sistema completo para monitorar operações críticas

### 3. Vercel Analytics ⭐⭐⭐⭐⭐
Métricas de produção em tempo real

### 4. Alertas Automáticos ⭐⭐⭐⭐⭐
Notificação proativa de problemas de performance

### 5. Page Metrics ⭐⭐⭐⭐⭐
Métricas detalhadas de navegação

---

## 🎯 PRÓXIMOS PASSOS

### Etapa 6.3 - Logs Estruturados (próxima)
- [ ] Melhorar logger service
- [ ] Migration para application_logs
- [ ] Substituir console.* por logger.*
- [ ] Cleanup automático

### Opcional - Melhorias Futuras
1. **Custom Performance Marks**
   - Marks em componentes pesados
   - Marks em lazy loading
   - Marks em data fetching

2. **Performance Budget**
   - Definir budgets por página
   - Alertar quando exceder
   - CI/CD integration

3. **Real User Monitoring (RUM)**
   - Métricas de usuários reais
   - Segmentação por device/location
   - Comparação com synthetic monitoring

---

**Status**: ✅ ETAPA 6.2 - 100% COMPLETA  
**Próxima Etapa**: 6.3 - Logs Estruturados  
**Tempo Total**: 1 hora  
**Progresso Fase 6**: 40% (2 de 5 etapas)

---

*Documentado por: Kiro AI*  
*Data: 2026-04-19*  
*Fase: Pré-Lançamento - Monitoring & Observability*
