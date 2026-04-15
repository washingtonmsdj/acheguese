# 🗺️ Roadmap: Dashboard Admin - Próximas Implementações

## 📅 Planejamento de Melhorias Futuras

---

## 🎯 FASE 1: Dados Reais (Prioridade Alta)

### 1.1 Implementar Query Real de Atividade
**Arquivo**: `src/core/admin/services/AdminStatsService.ts`
**Método**: `getActivity(days: number)`

**Implementação Sugerida**:
```typescript
async getActivity(days = 30): Promise<ActivityData[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Query para cada tipo de conteúdo
  const queries = [
    supabase.from('posts').select('created_at').gte('created_at', startDate.toISOString()),
    supabase.from('profiles').select('created_at').gte('created_at', startDate.toISOString()),
    supabase.from('businesses').select('created_at').gte('created_at', startDate.toISOString()),
    supabase.from('events').select('created_at').gte('created_at', startDate.toISOString()),
    supabase.from('classifieds').select('created_at').gte('created_at', startDate.toISOString()),
  ];
  
  const [posts, users, businesses, eventos, classificados] = await Promise.all(queries);
  
  // Agrupar por dia
  const activityMap = new Map<string, ActivityData>();
  
  // Processar cada tipo...
  
  return Array.from(activityMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}
```

**Benefício**: Gráficos mostrarão dados reais de crescimento

---

### 1.2 Expandir Atividade Recente
**Método**: `getRecentActivity(limit: number)`

**Adicionar**:
- ✅ Businesses (já implementado)
- ⏳ Posts recentes
- ⏳ Eventos recentes
- ⏳ Classificados recentes
- ⏳ Novos usuários

**Implementação**:
```typescript
async getRecentActivity(limit = 10): Promise<RecentActivity[]> {
  const recent: RecentActivity[] = [];
  
  // Businesses
  const businesses = await BusinessService.getRecentBusinessesLegacy(3);
  businesses.forEach(b => recent.push({
    type: