# 📊 Análise: Atividades dos Vizinhos - Gastronomia

**Data**: 2026-04-15  
**Status**: 🔴 NÃO CONFORME COM SSOT  
**Módulo**: `src/modules/gastronomy`

---

## 🎯 Objetivo da Funcionalidade

A seção "Atividade dos Vizinhos" na página de gastronomia tem como objetivo:

1. **Engajamento Social**: Mostrar atividades recentes de usuários próximos
2. **Prova Social**: Demonstrar que outros usuários estão ativos na plataforma
3. **Descoberta**: Ajudar usuários a descobrir novos estabelecimentos através das ações de outros
4. **Confiança**: Aumentar confiança mostrando atividade real da comunidade

### Tipos de Atividades Esperadas

Baseado no mock atual e na arquitetura do sistema:

```typescript
const NEARBY_ACTIVITIES = [
  { user: "Maria S.", action: "recomendou", business: "Acarajé da Dinha", time: "2h atrás", emoji: "👍" },
  { user: "João P.", action: "pediu delivery de", business: "Pizzaria Napoli", time: "3h atrás", emoji: "🛵" },
  { user: "Ana L.", action: "avaliou com 5★", business: "Bar do Reggae", time: "5h atrás", emoji: "⭐" },
  { user: "Carlos M.", action: "visitou", business: "Sorveteria Tropical", time: "6h atrás", emoji: "📍" },
  { user: "Luísa R.", action: "fez pedido no", business: "Restaurante Solar", time: "1 dia", emoji: "🍽️" },
];
```

---

## 🔍 Análise da Implementação Atual

### ❌ Problemas Identificados

#### 1. **Dados Hardcoded**
```typescript
// Linha 93-99 em GastronomyLandingPage.tsx
const NEARBY_ACTIVITIES = [
  // ... dados estáticos
];
```

**Problema**: Dados mockados diretamente no componente, sem fonte de verdade.

#### 2. **Sem Service/Hook Dedicado**
- Não existe `GastronomyActivityService`
- Não existe `useGastronomyActivity` hook
- Viola princípio SSOT do módulo

#### 3. **Sem Integração com Backend**
- Não há queries reais ao banco de dados
- Não usa dados de reviews, favoritos ou pedidos existentes
- Não filtra por território ativo

#### 4. **Sem Tipos TypeScript**
- Não há interface `GastronomyActivity` em `types/gastronomy.ts`
- Dados não tipados adequadamente

---

## 🗄️ Fontes de Dados Disponíveis

### ✅ Recursos Existentes no Sistema

#### 1. **Reviews** (`reviews` table)
- **Service**: `ReviewQueryService` (já existe)
- **Dados**: rating, comment, reviewer_profile_id, created_at
- **Ação**: "avaliou com X★"

#### 2. **Favoritos** (`user_favorite_businesses` table)
- **Service**: `FavoritesQueryService` (já existe)
- **Dados**: user_id, business_id, created_at
- **Ação**: "favoritou" ou "recomendou"

#### 3. **Pedidos** (`delivery_requests` table)
- **Service**: `OrderDeliverySSOTService` (módulo delivery)
- **Dados**: customer_id, business_id, created_at, delivery_mode
- **Ação**: "pediu delivery de" ou "fez pedido no"

#### 4. **Perfis de Usuário** (`profiles` table)
- **Dados**: display_name, avatar_url
- **Necessário para**: Mostrar nome e foto do usuário

#### 5. **Business Data** (`business_data` table)
- **Dados**: name, slug, geographic_path
- **Necessário para**: Nome do estabelecimento e link

---

## 🏗️ Arquitetura Proposta (SSOT Compliant)

### 1. **Tipos** (`types/gastronomy.ts`)

```typescript
export type ActivityType = 
  | 'review'      // Avaliou
  | 'favorite'    // Favoritou/Recomendou
  | 'order'       // Fez pedido
  | 'visit';      // Visitou (futuro - check-in)

export interface GastronomyActivity {
  id: string;
  type: ActivityType;
  user_name: string;
  user_avatar: string | null;
  business_id: string;
  business_name: string;
  business_slug: string;
  action_label: string;  // "avaliou com 5★", "pediu delivery de"
  emoji: string;
  created_at: string;
  time_ago: string;      // "2h atrás", "1 dia"
}

export interface GastronomyActivityFilters {
  territoryFilter?: TerritoryFilter;
  limit?: number;
  types?: ActivityType[];
}
```

### 2. **Service** (`services/activity.queries.ts`)

```typescript
export class ActivityQueryService {
  /**
   * Obter atividades recentes de gastronomia no território
   * 
   * Agrega dados de:
   * - Reviews recentes
   * - Favoritos recentes
   * - Pedidos recentes (se permitido por privacidade)
   */
  static async getRecentActivities(
    filters: GastronomyActivityFilters
  ): Promise<GastronomyActivity[]>
  
  /**
   * Obter atividades de um usuário específico
   */
  static async getUserActivities(
    userId: string,
    limit?: number
  ): Promise<GastronomyActivity[]>
  
  /**
   * Obter atividades de um estabelecimento
   */
  static async getBusinessActivities(
    businessId: string,
    limit?: number
  ): Promise<GastronomyActivity[]>
}
```

### 3. **Hook** (`hooks/useGastronomyActivity.ts`)

```typescript
export function useGastronomyActivity(
  filters: GastronomyActivityFilters
) {
  return useQuery({
    queryKey: ['gastronomy', 'activities', filters],
    queryFn: () => ActivityQueryService.getRecentActivities(filters),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}
```

### 4. **Componente** (`components/ActivityFeed.tsx`)

```typescript
export function GastronomyActivityFeed({
  territoryFilter,
  limit = 5,
}: {
  territoryFilter?: TerritoryFilter;
  limit?: number;
}) {
  const { data: activities, isLoading } = useGastronomyActivity({
    territoryFilter,
    limit,
  });
  
  // Renderização...
}
```

---

## 🔐 Considerações de Privacidade (APROVADO)

### Estratégia de Compartilhamento

#### ✅ Automático (Sem Confirmação)
- **Favoritos/Curtidas**: Compartilhamento automático
- **Reviews**: Compartilhamento automático (já são públicas por natureza)

#### ⚠️ Com Confirmação (Opt-in)
- **Pedidos**: Perguntar no momento do pedido "Compartilhar esta atividade?"
- **Visitas/Check-ins**: Perguntar no momento da visita

### Configurações de Privacidade

#### 1. Configuração Global (Profiles)
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS 
  share_activity_default BOOLEAN DEFAULT true;
```

#### 2. Confirmação por Ação (Orders)
```sql
ALTER TABLE delivery_requests ADD COLUMN IF NOT EXISTS 
  share_as_activity BOOLEAN DEFAULT false;
```

#### 3. Lógica de Compartilhamento

| Tipo | Automático | Requer Confirmação | Campo de Controle |
|------|------------|-------------------|-------------------|
| Review | ✅ Sim | ❌ Não | - |
| Favorito | ✅ Sim | ❌ Não | - |
| Pedido | ❌ Não | ✅ Sim | `delivery_requests.share_as_activity` |
| Visita | ❌ Não | ✅ Sim | `check_ins.share_as_activity` (futuro) |

### Fluxo de Confirmação

```typescript
// No checkout de pedido
<Checkbox 
  label="Compartilhar esta atividade com vizinhos"
  description="Outros usuários verão que você fez um pedido neste estabelecimento"
  defaultChecked={user.share_activity_default}
  onChange={(checked) => setShareActivity(checked)}
/>
```

---

## 📊 Query SQL Proposta

```sql
-- Function: get_recent_gastronomy_activities
CREATE OR REPLACE FUNCTION get_recent_gastronomy_activities(
  p_territory_filter jsonb DEFAULT NULL,
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  type text,
  user_name text,
  user_avatar text,
  business_id uuid,
  business_name text,
  business_slug text,
  action_label text,
  emoji text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  WITH recent_reviews AS (
    SELECT 
      r.id,
      'review' as type,
      p.display_name as user_name,
      p.avatar_url as user_avatar,
      bd.id as business_id,
      bd.name as business_name,
      bd.slug as business_slug,
      CONCAT('avaliou com ', r.rating, '★') as action_label,
      '⭐' as emoji,
      r.created_at
    FROM reviews r
    JOIN profiles p ON p.id = r.reviewer_profile_id
    JOIN business_data bd ON bd.id = r.reviewed_profile_id
    JOIN gastronomy_profiles gp ON gp.business_id = bd.id
    WHERE r.status = 'active'
      AND p.share_gastronomy_activity = true
      AND (p_territory_filter IS NULL OR bd.geographic_path ~ (p_territory_filter->>'path_pattern'))
    ORDER BY r.created_at DESC
    LIMIT p_limit
  ),
  recent_favorites AS (
    SELECT 
      ufb.id,
      'favorite' as type,
      p.display_name as user_name,
      p.avatar_url as user_avatar,
      bd.id as business_id,
      bd.name as business_name,
      bd.slug as business_slug,
      'recomendou' as action_label,
      '👍' as emoji,
      ufb.created_at
    FROM user_favorite_businesses ufb
    JOIN profiles p ON p.user_id = ufb.user_id
    JOIN business_data bd ON bd.id = ufb.business_id
    JOIN gastronomy_profiles gp ON gp.business_id = bd.id
    WHERE p.share_gastronomy_activity = true
      AND (p_territory_filter IS NULL OR bd.geographic_path ~ (p_territory_filter->>'path_pattern'))
    ORDER BY ufb.created_at DESC
    LIMIT p_limit
  )
  SELECT * FROM (
    SELECT * FROM recent_reviews
    UNION ALL
    SELECT * FROM recent_favorites
  ) combined
  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

---

## 🎯 Plano de Implementação

### Fase 1: Estrutura Base (SSOT)
1. ✅ Criar tipos em `types/gastronomy.ts`
2. ✅ Criar `ActivityQueryService` em `services/activity.queries.ts`
3. ✅ Criar hook `useGastronomyActivity` em `hooks/useGastronomyActivity.ts`
4. ✅ Exportar em barrel exports

### Fase 2: Backend
1. ✅ Criar migration para campo `share_gastronomy_activity` em profiles
2. ✅ Criar function SQL `get_recent_gastronomy_activities`
3. ✅ Testar queries com dados reais

### Fase 3: Componente
1. ✅ Criar `GastronomyActivityFeed.tsx` em `components/`
2. ✅ Refatorar `GastronomyLandingPage.tsx` para usar novo componente
3. ✅ Remover mock hardcoded

### Fase 4: Testes
1. ✅ Testar com dados reais
2. ✅ Validar filtros territoriais
3. ✅ Verificar performance
4. ✅ Testar privacidade

---

## ⚠️ Riscos e Mitigações

### Risco 1: Performance
**Problema**: Query pode ser lenta com muitos dados  
**Mitigação**: 
- Índices em `created_at`, `geographic_path`
- Cache de 2 minutos no React Query
- Limit baixo (5-10 atividades)

### Risco 2: Privacidade
**Problema**: Expor dados sensíveis  
**Mitigação**:
- Campo `share_gastronomy_activity` (opt-out)
- Apenas display_name, não nome completo
- Filtro territorial, não coordenadas exatas

### Risco 3: Dados Vazios
**Problema**: Território novo sem atividades  
**Mitigação**:
- Fallback para mensagem amigável
- Sugestão de ações ("Seja o primeiro a avaliar!")
- Não mostrar seção se vazia

---

## 📝 Checklist de Conformidade SSOT

- [ ] Tipos definidos em `types/gastronomy.ts`
- [ ] Service em `services/activity.queries.ts`
- [ ] Hook em `hooks/useGastronomyActivity.ts`
- [ ] Componente em `components/GastronomyActivityFeed.tsx`
- [ ] Exports em barrel files
- [ ] Query SQL otimizada
- [ ] Índices de banco criados
- [ ] Testes de integração
- [ ] Documentação atualizada
- [ ] Sem dados hardcoded
- [ ] Sem duplicação de lógica
- [ ] TypeScript strict compliance

---

## 🎓 Referências

- **Padrão SSOT**: `src/modules/gastronomy/README.md`
- **Validação**: `src/modules/gastronomy/VALIDATION.md`
- **Services Existentes**: 
  - `services/review.queries.ts`
  - `services/favorites.queries.ts`
- **Hooks Existentes**: `hooks/README.md`

---

## ✅ Aprovação para Implementação - APROVADO

### Decisões Finais:

1. **Privacidade**: ✅ APROVADO
   - Reviews e Favoritos: Automático
   - Pedidos e Visitas: Com confirmação opt-in
   - Campo `share_activity_default` em profiles (padrão: true)
   - Campo `share_as_activity` em delivery_requests (padrão: false)

2. **Tipos de Atividade**: ✅ TODOS ATIVADOS
   - ✅ Reviews (automático)
   - ✅ Favoritos (automático)
   - ✅ Pedidos (com confirmação)
   - ✅ Visitas/Check-ins (com confirmação - futuro)

3. **Fallback**: ✅ DEFINIDO
   - Ocultar seção se vazia
   - Mostrar mensagem de incentivo em dev
   - Sem mocks em produção

4. **Performance**: ✅ DEFINIDO
   - Limite: 5 atividades na landing
   - Cache: 2 minutos
   - Índices otimizados

---

## 🚀 Iniciando Implementação

**Status**: PRONTO PARA IMPLEMENTAR  
**Próximos Passos**:
1. Criar tipos TypeScript
2. Criar migration SQL
3. Criar service e hook
4. Criar componente
5. Integrar na landing page
