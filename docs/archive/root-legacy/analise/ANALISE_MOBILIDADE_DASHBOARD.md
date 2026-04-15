# 🚗 Análise: Dados de Mobilidade no Dashboard Admin

**Data**: 25/03/2026  
**Status**: ⚠️ Dados de Mobilidade NÃO estão no Dashboard Principal

---

## 🔍 SITUAÇÃO ATUAL

### Dashboard Principal (`AdminDashboard.tsx`)
**Dados Exibidos**:
- ✅ Empresas (businesses)
- ✅ Profissionais (professionals)
- ✅ Classificados (classifieds)
- ✅ Eventos (events)
- ✅ Posts (posts)
- ✅ Usuários (profiles)
- ✅ Comentários (comments)
- ✅ Empresas Premium

**Dados de Mobilidade**:
- ❌ Motoristas (drivers)
- ❌ Corridas (ride_requests)
- ❌ Passageiros ativos
- ❌ Corridas em andamento
- ❌ Avaliações de corridas

---

## 📊 DADOS DE MOBILIDADE DISPONÍVEIS NO SSOT

### Tabelas no Banco de Dados
```typescript
// Confirmado via types e schemas:
1. ride_requests - Solicitações de corrida
2. ride_reports - Relatórios de corridas
3. ride_ratings - Avaliações de corridas
4. driver_routes - Rotas dos motoristas
5. driver_location_tracking - Rastreamento de localização
6. profiles (com profile_type = 'driver') - Motoristas
```

### Páginas Admin Específicas de Mobilidade
```
✅ AdminMotoristas.tsx - Gestão de motoristas
✅ AdminAnalyticsMobilidade.tsx - Analytics de mobilidade
✅ AdminRealtimeDashboard.tsx - Dashboard em tempo real
✅ AdminPontosEmbarque.tsx - Pontos de embarque
✅ AdminReportsPassageiros.tsx - Relatórios de passageiros
```

### Mock Data Disponível
```typescript
// src/integrations/supabase/mockData.ts
export const mockActiveRide = {
  id: "ride-mock-001",
  driver_profile_id: "mock-profile-123",
  passenger_id: "mock-profile-456",
  status: "in_progress",
  pickup_location: {...},
  dropoff_location: {...},
  distance_km: 4.8,
  price: 16.5,
  ...
}
```

---

## 🎯 RECOMENDAÇÃO

### Opção 1: Adicionar ao Dashboard Principal ✅ RECOMENDADO
**Vantagens**:
- Visão unificada de toda a plataforma
- Métricas de mobilidade junto com comunidade
- Melhor para admins que gerenciam tudo

**Métricas a Adicionar**:
```typescript
{
  key: "drivers",
  label: "Motoristas",
  icon: Car,
  color: "bg-blue-500/10 text-blue-600",
  route: "/admin/motoristas",
},
{
  key: "rides_today",
  label: "Corridas Hoje",
  icon: Navigation,
  color: "bg-green-500/10 text-green-600",
  route: "/admin/analytics-mobilidade",
},
{
  key: "rides_active",
  label: "Corridas Ativas",
  icon: Activity,
  color: "bg-purple-500/10 text-purple-600",
  route: "/admin/realtime",
},
```

### Opção 2: Dashboard Separado (Já Existe)
**Vantagens**:
- Foco específico em mobilidade
- Métricas detalhadas e em tempo real
- Já implementado em `AdminRealtimeDashboard.tsx`

**Desvantagens**:
- Admins precisam navegar entre dashboards
- Visão fragmentada da plataforma

---

## 🚀 IMPLEMENTAÇÃO RECOMENDADA

### Fase 1: Adicionar Cards de Mobilidade ao Dashboard Principal

**Arquivo**: `src/modules/admin/pages/AdminDashboard.tsx`

```typescript
// Adicionar aos statConfig:
{
  key: "drivers",
  label: "Motoristas",
  icon: Car,
  color: "bg-blue-500/10 text-blue-600",
  route: "/admin/motoristas",
},
{
  key: "rides_total",
  label: "Corridas",
  icon: Navigation,
  color: "bg-indigo-500/10 text-indigo-600",
  route: "/admin/analytics-mobilidade",
},
```

### Fase 2: Atualizar AdminStatsService

**Arquivo**: `src/core/admin/services/AdminStatsService.ts`

```typescript
// Adicionar método para estatísticas de mobilidade
async getMobilityStats(): Promise<MobilityStats> {
  const { count: driversCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("profile_type", "driver");

  const { count: ridesCount } = await supabase
    .from("ride_requests")
    .select("*", { count: "exact", head: true });

  const { count: activeRidesCount } = await supabase
    .from("ride_requests")
    .select("*", { count: "exact", head: true })
    .in("status", ["pending", "accepted", "in_progress"]);

  return {
    drivers: driversCount || 0,
    rides_total: ridesCount || 0,
    rides_active: activeRidesCount || 0,
  };
}
```

### Fase 3: Atualizar adminApi.ts

```typescript
export async function adminGetStats(): Promise<TableStats> {
  const tables = [
    "businesses",
    "professionals",
    "classifieds",
    "events",
    "posts",
    "profiles",
    "comments",
    "ride_requests", // ✅ Adicionar
  ];
  
  const stats = await adminStatsService.getTableStats(tables);
  
  // Adicionar estatísticas específicas de mobilidade
  const mobilityStats = await adminStatsService.getMobilityStats();
  
  return {
    ...stats,
    ...mobilityStats,
  };
}
```

### Fase 4: Adicionar ao Mock

**Arquivo**: `src/integrations/supabase/supabaseMock.ts`

```typescript
// Adicionar casos para ride_requests
case "ride_requests":
  mockData = [
    {
      id: "ride-1",
      passenger_id: "mock-user-123",
      driver_profile_id: "driver-1",
      status: "completed",
      created_at: new Date().toISOString(),
    },
    // ... mais rides mock
  ];
  break;
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Backend/SSOT
- [ ] Adicionar `getMobilityStats()` ao AdminStatsService
- [ ] Adicionar tabela `ride_requests` ao getTableStats
- [ ] Adicionar contagem de motoristas (profiles com type=driver)
- [ ] Adicionar contagem de corridas ativas

### Frontend/Dashboard
- [ ] Adicionar cards de mobilidade ao statConfig
- [ ] Importar ícones (Car, Navigation, Activity)
- [ ] Adicionar rotas para páginas de mobilidade
- [ ] Atualizar tipos TypeScript

### Mock Data
- [ ] Adicionar dados mock de ride_requests
- [ ] Adicionar dados mock de motoristas
- [ ] Garantir que queries funcionem no modo mock

### Testes
- [ ] Testar carregamento de dados de mobilidade
- [ ] Testar navegação para páginas de mobilidade
- [ ] Testar modo mock
- [ ] Verificar performance com dados reais

---

## 🎨 PREVIEW DO DASHBOARD ATUALIZADO

```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard Administrativo                                     │
│ Visão geral · 1.234 registros totais                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [🏢 Empresas]  [🔧 Profissionais]  [🏷️ Classificados]     │
│      150              89                  234               │
│                                                              │
│  [📅 Eventos]   [📝 Posts]         [👥 Usuários]           │
│      45              567                  1.234             │
│                                                              │
│  [💬 Comentários] [🚗 Motoristas]  [🧭 Corridas]           │
│      890              42                  156               │
│                                                              │
│  [⚡ Corridas Ativas] [👑 Premium]                          │
│      3                   15 (10%)                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚠️ CONSIDERAÇÕES IMPORTANTES

### 1. Contexto da Plataforma
**Pergunta**: A plataforma é primariamente:
- [ ] Comunidade + Mobilidade (50/50)
- [ ] Comunidade com Mobilidade secundária (80/20)
- [ ] Mobilidade com Comunidade secundária (20/80)

**Impacto**: Define se mobilidade deve estar no dashboard principal ou separado

### 2. Usuários Admin
**Pergunta**: Os admins gerenciam:
- [ ] Tudo (comunidade + mobilidade)
- [ ] Apenas comunidade
- [ ] Apenas mobilidade
- [ ] Equipes separadas

**Impacto**: Define se precisa de dashboards separados ou unificado

### 3. Prioridade de Métricas
**Pergunta**: Quais métricas são mais importantes?
- [ ] Engajamento (posts, comentários)
- [ ] Negócios (empresas, classificados)
- [ ] Mobilidade (corridas, motoristas)
- [ ] Todas igualmente

**Impacto**: Define ordem e destaque dos cards

---

## ✅ PRÓXIMOS PASSOS

1. **Definir Estratégia**: Dashboard unificado ou separado?
2. **Implementar Backend**: Adicionar métodos ao AdminStatsService
3. **Atualizar Frontend**: Adicionar cards ao dashboard
4. **Testar**: Validar com dados mock e reais
5. **Documentar**: Atualizar documentação do dashboard

---

## 📊 COMPARAÇÃO

### Antes (Atual)
```
Dashboard Principal:
- Comunidade: ✅ Completo
- Negócios: ✅ Completo
- Mobilidade: ❌ Ausente

Dashboard Realtime:
- Mobilidade: ✅ Completo
- Comunidade: ❌ Ausente
```

### Depois (Proposto)
```
Dashboard Principal:
- Comunidade: ✅ Completo
- Negócios: ✅ Completo
- Mobilidade: ✅ Resumo (cards principais)

Dashboard Realtime:
- Mobilidade: ✅ Detalhado (métricas em tempo real)
```

---

## 🎯 RECOMENDAÇÃO FINAL

**Adicionar cards de mobilidade ao dashboard principal** para:
- ✅ Visão unificada da plataforma
- ✅ Acesso rápido a métricas de mobilidade
- ✅ Manter dashboard realtime para detalhes
- ✅ Melhor experiência para admins

**Esforço**: 🟡 Médio (2-3 horas)  
**Impacto**: 🟢 Alto (visibilidade completa)  
**Prioridade**: 🟡 Média (melhoria, não bug)

